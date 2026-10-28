import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { backendRequest } from "../backend";

export const movieDetailsTag = (id: string) => `movie-details:${id}`;

/**
 * Film details barely change, so the server keeps one shared copy per movie for days. A missing
 * movie is remembered briefly; an outage throws so it never lands in the cache.
 */
async function cachedMovieDetails(id: string) {
  "use cache";
  cacheTag(movieDetailsTag(id));
  const result = await backendRequest("/movies/{id}/details", "get", {
    pathParams: { id },
    withAuth: false,
  });
  if (result.response.ok) cacheLife("days");
  else if (result.response.status === 404) cacheLife("minutes");
  else throw new Error(result.error ?? "Movie details unavailable");
  return result;
}

export async function movieDetails(id: string) {
  try {
    return await cachedMovieDetails(id);
  } catch {
    // Ask once more outside the cache so the caller gets the real failure.
    return backendRequest("/movies/{id}/details", "get", { pathParams: { id }, withAuth: false });
  }
}
