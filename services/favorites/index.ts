import { backendRequest } from "../backend";

const movieId = (movieId: string) => ({ pathParams: { movieId } });

const favoritesServices = {
  list(signal?: AbortSignal) {
    return backendRequest("/favorites", "get", { signal });
  },
  listForUser(userId: number, signal?: AbortSignal) {
    return backendRequest("/favorites/users/{userId}", "get", { pathParams: { userId }, signal });
  },
  set(movieIds: string[]) {
    return backendRequest("/favorites", "put", { body: { movieIds } });
  },
  has(id: string, signal?: AbortSignal) {
    return backendRequest("/favorites/{movieId}", "get", { ...movieId(id), signal });
  },
  add(id: string) {
    return backendRequest("/favorites/{movieId}", "put", movieId(id));
  },
  /** `null` clears the note. Returns the whole updated list. */
  setNote(id: string, note: string | null) {
    return backendRequest("/favorites/{movieId}", "patch", { ...movieId(id), body: { note } });
  },
  remove(id: string) {
    return backendRequest("/favorites/{movieId}", "delete", movieId(id));
  },
};

export default favoritesServices;
