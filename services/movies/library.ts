import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { MoviePreview } from "@/features/movies/preview";
import { backendRequest } from "../backend";

export const movieLibraryTag = "movie-library";

/**
 * The newest library films that have a poster: the landing shelf until the editors' picks are
 * filled. Kept for an hour; an outage is remembered only briefly.
 */
export async function libraryShowcase(limit = 16) {
  "use cache";
  cacheTag(movieLibraryTag);
  const list = await backendRequest("/movies", "get", { query: { page: 1, limit: 60 }, withAuth: false });
  if (!list.response.ok || !list.result) {
    cacheLife("minutes");
    return [];
  }
  cacheLife("hours");
  const films: (MoviePreview & { poster_path: string })[] = [];
  for (const movie of list.result.data) {
    if (!movie.poster_path) continue;
    films.push({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date ?? null,
    });
    if (films.length >= limit) break;
  }
  return films;
}
