import type { BackendRequestBody } from "@/types/backend";
import { backendRequest } from "../backend";

type CreateMovieBody = BackendRequestBody<"/movies", "post">;

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
  create(body: CreateMovieBody) {
    return backendRequest("/movies", "post", { body });
  },
};
