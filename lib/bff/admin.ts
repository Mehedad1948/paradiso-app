import "server-only";
import adminServices from "@/services/admin";
import { moviesServices } from "@/services/movies";
import type { RequestResult } from "@/types/request";
import { InputError, boolean, positiveInteger, text } from "./validation";

const day = /^\d{4}-\d{2}-\d{2}$/;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TAGLINE_MAX = 140;
const NOTE_MAX = 500;
const RANGE_DAYS = 120;

function dayInput(value: unknown) {
  if (typeof value !== "string" || !day.test(value) || !Number.isFinite(Date.parse(value)))
    throw new InputError("Invalid date");
  return value;
}

function uuidInput(value: unknown) {
  if (typeof value !== "string" || !uuid.test(value)) throw new InputError("Invalid id");
  return value;
}

function optionalFlag(value: string | null, name: string) {
  return value === null ? undefined : boolean(value, name);
}

function candidateBody(data: Record<string, unknown>) {
  const body: { boost?: number; blocked?: boolean; note?: string } = {};
  if (data.boost !== undefined) {
    if (typeof data.boost !== "number" || !Number.isFinite(data.boost) || data.boost < 0 || data.boost > 10)
      throw new InputError("Boost must be between 0 and 10");
    body.boost = data.boost;
  }
  if (data.blocked !== undefined) {
    if (typeof data.blocked !== "boolean") throw new InputError("Invalid blocked");
    body.blocked = data.blocked;
  }
  if (data.note !== undefined) {
    if (typeof data.note !== "string" || data.note.length > NOTE_MAX)
      throw new InputError(`Keep the note under ${NOTE_MAX} characters`);
    body.note = data.note.trim();
  }
  return body;
}

type AdminToolRequest = {
  path: string[];
  method: string;
  query: URLSearchParams;
  data: () => Promise<Record<string, unknown>>;
  signal: AbortSignal;
};

/**
 * The featured-artist, genre and TMDb-import routes under `/admin/*`; `path` is the part after
 * `admin`. Returns null for a route this handler does not own.
 */
export async function handleAdminToolsRequest({
  path,
  method,
  query,
  data,
  signal,
}: AdminToolRequest): Promise<RequestResult<unknown> | null> {
  const [area, a, b] = path;

  if (area === "featured") {
    if (a === "days" && path.length === 2 && method === "GET") {
      const from = dayInput(query.get("from"));
      const to = dayInput(query.get("to"));
      if (Date.parse(to) - Date.parse(from) > RANGE_DAYS * 86_400_000) throw new InputError("Range too long");
      return adminServices.featuredDays(from, to, signal);
    }
    if (a === "days" && path.length === 3) {
      const date = dayInput(b);
      if (method === "PUT") {
        const body = await data();
        if (body.tagline !== undefined && typeof body.tagline !== "string") throw new InputError("Invalid tagline");
        const tagline = body.tagline?.trim();
        if (tagline && tagline.length > TAGLINE_MAX)
          throw new InputError(`Keep the tagline under ${TAGLINE_MAX} characters`);
        return adminServices.setFeaturedDay(date, positiveInteger(body.tmdbPersonId, "person"), tagline);
      }
      if (method === "DELETE") return adminServices.removeFeaturedDay(date);
    }
    if (a === "candidates" && path.length === 2 && method === "GET")
      return adminServices.candidates(
        {
          boosted: optionalFlag(query.get("boosted"), "boosted"),
          blocked: optionalFlag(query.get("blocked"), "blocked"),
          page: positiveInteger(query.get("page"), "page", 1),
          limit: positiveInteger(query.get("limit"), "limit", 20, 100),
        },
        signal,
      );
    if (a === "candidates" && path.length === 3) {
      const id = positiveInteger(b, "person");
      if (method === "PUT") return adminServices.saveCandidate(id, candidateBody(await data()));
      if (method === "DELETE") return adminServices.removeCandidate(id);
    }
    if (a === "people" && path.length === 2 && method === "GET")
      return adminServices.searchPeople(
        text(query.get("query"), "query", 100),
        positiveInteger(query.get("page"), "page", 1, 500),
        signal,
      );
    if (a === "people" && path.length === 4 && path[3] === "preview" && method === "GET")
      return adminServices.previewPerson(positiveInteger(b, "person"), signal);
  }

  if (area === "genres") {
    if (path.length === 1 && method === "POST") return adminServices.syncGenres();
    if (path.length === 2) {
      const id = uuidInput(a);
      if (method === "PATCH") return adminServices.renameGenre(id, text((await data()).name, "name", 100));
      if (method === "DELETE") return adminServices.removeGenre(id);
    }
  }

  // Films the library does not hold yet: search TMDb, then add one on demand.
  if (area === "library" && a === "tmdb" && path.length === 2 && method === "GET") {
    const term = (query.get("query") ?? "").trim();
    if (term.length > 100) throw new InputError("Search is too long");
    if (!term) return { result: [], response: { ok: true, status: 200, statusText: "" } };
    const result = await moviesServices.searchDbMovies(term, signal);
    return {
      ...result,
      result:
        result.result?.results.map((film) => ({
          tmdbId: film.id,
          title: film.title,
          poster_path: film.poster_path ?? null,
          release_date: film.release_date || null,
        })) ?? null,
    };
  }
  if (area === "library" && a === "import" && path.length === 2 && method === "POST")
    return moviesServices.resolve(positiveInteger((await data()).tmdbId, "tmdbId"));

  return null;
}
