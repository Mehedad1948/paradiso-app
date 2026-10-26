import { backendRequest } from "../backend";

// The generated types say `number`, but the backend validates a movie uuid.
const movieId = (movieId: string) => ({ pathParams: { movieId: movieId as unknown as number } });

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
  remove(id: string) {
    return backendRequest("/favorites/{movieId}", "delete", movieId(id));
  },
};

export default favoritesServices;
