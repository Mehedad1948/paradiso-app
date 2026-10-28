import type { BackendRequestBody } from "@/types/backend";
import { backendRequest } from "../backend";

type CreateMovieBody = BackendRequestBody<"/movies", "post">;
type UpdateMovieBody = BackendRequestBody<"/movies/{id}", "put">;

export const moviesServices = {
  searchDbMovies(query: string, signal?: AbortSignal) {
    return backendRequest("/movies/tmdb/search", "get", {
      query: { query },
      signal,
    });
  },
  tmdbMovie(movieId: number, signal?: AbortSignal) {
    return backendRequest("/movies/tmdb/{movieId}", "get", {
      pathParams: { movieId },
      signal,
    });
  },
  list(page: number, limit: number, signal?: AbortSignal) {
    return backendRequest("/movies", "get", { query: { page, limit }, signal });
  },
  update(id: string, body: UpdateMovieBody) {
    return backendRequest("/movies/{id}", "put", { pathParams: { id }, body });
  },
  create(body: CreateMovieBody) {
    return backendRequest("/movies", "post", { body });
  },
  /** The library's copy of a TMDb film, added first if it isn't there yet. Safe to repeat. */
  resolve(tmdbId: number) {
    return backendRequest("/movies/resolve", "post", { body: { tmdbId } });
  },
};
