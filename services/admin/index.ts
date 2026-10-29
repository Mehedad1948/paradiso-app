import "server-only";
import type { BackendRequestBody } from "@/types/backend";
import { backendRequest } from "../backend";

type CandidateBody = BackendRequestBody<"/admin/featured-candidates/{tmdbPersonId}", "put">;

/** The admin tools beyond the curated lists. The backend checks the admin role on every call. */
const adminServices = {
  featuredDays(from: string, to: string, signal?: AbortSignal) {
    return backendRequest("/admin/featured-artists", "get", { query: { from, to }, signal });
  },
  setFeaturedDay(date: string, tmdbPersonId: number, tagline?: string) {
    return backendRequest("/admin/featured-artists/{date}", "put", {
      pathParams: { date },
      body: { tmdbPersonId, ...(tagline ? { tagline } : {}) },
    });
  },
  removeFeaturedDay(date: string) {
    return backendRequest("/admin/featured-artists/{date}", "delete", { pathParams: { date } });
  },
  candidates(
    query: { boosted?: boolean; blocked?: boolean; page: number; limit: number },
    signal?: AbortSignal,
  ) {
    return backendRequest("/admin/featured-candidates", "get", { query, signal });
  },
  saveCandidate(tmdbPersonId: number, body: CandidateBody) {
    return backendRequest("/admin/featured-candidates/{tmdbPersonId}", "put", {
      pathParams: { tmdbPersonId },
      body,
    });
  },
  removeCandidate(tmdbPersonId: number) {
    return backendRequest("/admin/featured-candidates/{tmdbPersonId}", "delete", {
      pathParams: { tmdbPersonId },
    });
  },
  searchPeople(query: string, page: number, signal?: AbortSignal) {
    return backendRequest("/admin/featured-people/search", "get", { query: { query, page }, signal });
  },
  previewPerson(tmdbPersonId: number, signal?: AbortSignal) {
    return backendRequest("/admin/featured-people/{tmdbPersonId}/preview", "get", {
      pathParams: { tmdbPersonId },
      signal,
    });
  },
  syncGenres() {
    return backendRequest("/genres", "post");
  },
  renameGenre(id: string, name: string) {
    return backendRequest("/genres/{id}", "patch", { pathParams: { id }, body: { name } });
  },
  removeGenre(id: string) {
    return backendRequest("/genres/{id}", "delete", { pathParams: { id } });
  },
};

export default adminServices;
