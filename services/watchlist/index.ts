import type { BackendQuery } from "@/types/backend";
import { backendRequest } from "../backend";

// The generated types say `number`, but the backend validates a movie uuid.
const movieId = (movieId: string) => ({ pathParams: { movieId: movieId as unknown as number } });

const watchlistServices = {
  list(query: BackendQuery<"/watchlist", "get">, signal?: AbortSignal) {
    return backendRequest("/watchlist", "get", { query, signal });
  },
  has(id: string, signal?: AbortSignal) {
    return backendRequest("/watchlist/{movieId}", "get", { ...movieId(id), signal });
  },
  add(id: string) {
    return backendRequest("/watchlist/{movieId}", "put", movieId(id));
  },
  remove(id: string) {
    return backendRequest("/watchlist/{movieId}", "delete", movieId(id));
  },
};

export default watchlistServices;
