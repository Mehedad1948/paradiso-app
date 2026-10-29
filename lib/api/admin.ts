import { bffRequest, queryString } from "./client";
import type { components } from "@/types/generated/backend";

type Schemas = components["schemas"];

export type AdminFeaturedDays = Schemas["AdminFeaturedArtistListResponse"];
export type AdminFeaturedDay = Schemas["AdminFeaturedArtistItem"];
export type AdminCandidates = Schemas["FeaturedCandidateListResponse"];
export type AdminCandidate = Schemas["FeaturedCandidate"];
export type AdminPeopleSearch = Schemas["FeaturedPeopleSearchResponse"];
export type AdminPerson = Schemas["FeaturedPeopleSearchItem"];
export type AdminPersonPreview = Schemas["FeaturedPersonPreview"];
export type CandidateChange = Pick<Schemas["UpsertFeaturedCandidateRequest"], "boost" | "blocked" | "note">;
export type CandidateFilter = "all" | "boosted" | "blocked";
export type TmdbFilm = { tmdbId: number; title: string; poster_path: string | null; release_date: string | null };

const json = (body: unknown) => JSON.stringify(body);
const personPath = (id: number) => `/admin/featured/candidates/${id}`;

/** The admin tools: featured artists, genres and adding films from TMDb. */
export const adminApi = {
  featuredDays: (from: string, to: string, signal?: AbortSignal) =>
    bffRequest<AdminFeaturedDays>(`/admin/featured/days${queryString({ from, to })}`, { signal }),
  setFeaturedDay: (variables: { date: string; tmdbPersonId: number; tagline?: string }) =>
    bffRequest<AdminFeaturedDay>(`/admin/featured/days/${variables.date}`, {
      method: "PUT",
      body: json({ tmdbPersonId: variables.tmdbPersonId, tagline: variables.tagline }),
    }),
  removeFeaturedDay: (date: string) =>
    bffRequest<unknown>(`/admin/featured/days/${date}`, { method: "DELETE" }),
  candidates: (filter: CandidateFilter, page: number, signal?: AbortSignal) =>
    bffRequest<AdminCandidates>(
      `/admin/featured/candidates${queryString({
        boosted: filter === "boosted" ? true : undefined,
        blocked: filter === "blocked" ? true : undefined,
        page,
        limit: 20,
      })}`,
      { signal },
    ),
  saveCandidate: (variables: { tmdbPersonId: number } & CandidateChange) => {
    const { tmdbPersonId, ...change } = variables;
    return bffRequest<AdminCandidate>(personPath(tmdbPersonId), { method: "PUT", body: json(change) });
  },
  removeCandidate: (tmdbPersonId: number) => bffRequest<unknown>(personPath(tmdbPersonId), { method: "DELETE" }),
  searchPeople: (query: string, page: number, signal?: AbortSignal) =>
    bffRequest<AdminPeopleSearch>(`/admin/featured/people${queryString({ query, page })}`, { signal }),
  previewPerson: (tmdbPersonId: number, signal?: AbortSignal) =>
    bffRequest<AdminPersonPreview>(`/admin/featured/people/${tmdbPersonId}/preview`, { signal }),
  syncGenres: () => bffRequest<unknown>("/admin/genres", { method: "POST" }),
  renameGenre: (variables: { id: string; name: string }) =>
    bffRequest<unknown>(`/admin/genres/${variables.id}`, { method: "PATCH", body: json({ name: variables.name }) }),
  removeGenre: (id: string) => bffRequest<unknown>(`/admin/genres/${id}`, { method: "DELETE" }),
  searchTmdb: (query: string, signal?: AbortSignal) =>
    bffRequest<TmdbFilm[]>(`/admin/library/tmdb${queryString({ query })}`, { signal }),
  importFilm: (tmdbId: number) =>
    bffRequest<{ id: string }>("/admin/library/import", { method: "POST", body: json({ tmdbId }) }),
};
