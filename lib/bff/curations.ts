import "server-only";
import { revalidateTag } from "next/cache";
import curationsAdmin from "@/services/curations/admin";
import { curationTag } from "@/services/curations";
import { GRID_SLOTS } from "@/lib/curations/grid";
import type { RequestResult } from "@/types/request";
import {
  EDITORS_PICKS_MAX,
  LIBRARY_SEARCH_MAX,
  type CuratedMovie,
  type CurationKey,
  type LandingGridItemInput,
} from "@/types/curations";
import { InputError, positiveInteger } from "./validation";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMAGE_URL_MAX = 2048;
const POSITION_MAX = 40;

function movieId(value: unknown) {
  if (typeof value !== "string" || !uuid.test(value)) throw new InputError("Invalid movie");
  return value;
}

/** Blank is null, like the backend stores it. */
function optionalText(value: unknown, name: string, max: number) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || value.length > max) throw new InputError(`Invalid ${name}`);
  return value.trim() || null;
}

function gridItems(data: Record<string, unknown>): LandingGridItemInput[] {
  const { items } = data;
  if (!Array.isArray(items) || items.length > GRID_SLOTS) throw new InputError("Invalid grid");
  return items.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new InputError("Invalid grid");
    const cell = item as Record<string, unknown>;
    const slot = cell.slot;
    if (typeof slot !== "number" || !Number.isInteger(slot) || slot < 0 || slot >= GRID_SLOTS)
      throw new InputError("Invalid slot");
    const imageUrl = optionalText(cell.imageUrl, "image", IMAGE_URL_MAX);
    // The same rule as the backend: an https URL or a site path, never a protocol-relative one.
    if (imageUrl && !/^https:\/\//i.test(imageUrl) && !/^\/(?!\/)/.test(imageUrl))
      throw new InputError("Invalid image");
    return {
      slot,
      movieId: movieId(cell.movieId),
      imageUrl,
      objectPosition: optionalText(cell.objectPosition, "image position", POSITION_MAX),
    };
  });
}

function pickIds(data: Record<string, unknown>) {
  const { movieIds } = data;
  if (!Array.isArray(movieIds) || movieIds.length > EDITORS_PICKS_MAX)
    throw new InputError(`Pick at most ${EDITORS_PICKS_MAX} films`);
  return movieIds.map(movieId);
}

/** The landing shows a saved list on its next render instead of serving the old one meanwhile. */
function saved<T>(key: CurationKey, result: RequestResult<T>) {
  if (result.response.ok) revalidateTag(curationTag(key), { expire: 0 });
  return result;
}

/** Routes `/admin/*`; `path` is the part after `admin`. Signed in; the backend checks the role. */
export async function handleAdminRequest({
  path,
  method,
  query,
  data,
  signal,
}: {
  path: string[];
  method: string;
  query: URLSearchParams;
  data: () => Promise<Record<string, unknown>>;
  signal: AbortSignal;
}): Promise<RequestResult<unknown>> {
  const route = path.join("/");

  if (route === "curations/landing-grid") {
    if (method === "GET") return curationsAdmin.landingGrid(signal);
    if (method === "PUT") return saved("landing-grid", await curationsAdmin.saveLandingGrid(gridItems(await data())));
  }

  if (route === "curations/editors-picks") {
    if (method === "GET") return curationsAdmin.editorsPicks(signal);
    if (method === "PUT") return saved("editors-picks", await curationsAdmin.saveEditorsPicks(pickIds(await data())));
  }

  if (route === "library" && method === "GET") {
    const search = (query.get("search") ?? "").trim();
    if (search.length > LIBRARY_SEARCH_MAX) throw new InputError("Search is too long");
    if (!search) return { result: [], response: { ok: true, status: 200, statusText: "" } };
    const result = await curationsAdmin.searchLibrary(search, positiveInteger(query.get("page"), "page", 1), signal);
    return {
      ...result,
      result:
        result.result?.data.map(
          (movie): CuratedMovie => ({
            id: movie.id,
            dbId: movie.dbId,
            title: movie.title,
            poster_path: movie.poster_path ?? null,
            release_date: movie.release_date ?? null,
          }),
        ) ?? null,
    };
  }

  throw new InputError("Not found", 404);
}
