import { backendRequest } from "../backend";

export const moviesServices = {
  searchDbMovies(query: string, signal?: AbortSignal) {
    return backendRequest("/movies/tmdb/search", "get", {
      query: { query },
      signal,
    });
  },
};
