import "server-only";
import type { BackendRequestBody } from "@/types/backend";
import { backendRequest } from "../backend";

type CreateBody = BackendRequestBody<"/movies/{movieId}/comments", "post">;
type UpdateBody = BackendRequestBody<"/movies/{movieId}/comments/{commentId}", "patch">;

// The backend validates `movieId` as the movie's UUID, but its OpenAPI spec declares an integer.
const movie = (movieId: string) => movieId as unknown as number;

export const movieComments = {
  list(movieId: string, query: { limit?: number; before?: number }, signal?: AbortSignal) {
    return backendRequest("/movies/{movieId}/comments", "get", {
      pathParams: { movieId: movie(movieId) },
      query,
      signal,
    });
  },
  create(movieId: string, body: CreateBody) {
    return backendRequest("/movies/{movieId}/comments", "post", {
      pathParams: { movieId: movie(movieId) },
      body,
    });
  },
  update(movieId: string, commentId: number, body: UpdateBody) {
    return backendRequest("/movies/{movieId}/comments/{commentId}", "patch", {
      pathParams: { movieId: movie(movieId), commentId },
      body,
    });
  },
  remove(movieId: string, commentId: number) {
    return backendRequest("/movies/{movieId}/comments/{commentId}", "delete", {
      pathParams: { movieId: movie(movieId), commentId },
    });
  },
};
