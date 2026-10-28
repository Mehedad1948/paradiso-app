import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { MoviePreview } from "@/features/movies/preview";
import { backendRequest } from "../backend";

export const movieLibraryTag = "movie-library";

const SCAN_PAGES = 20;

/**
 * The library's copies of the given TMDb films, keyed by TMDb id. There is no lookup by TMDb id
 * yet, so this pages through the public library once and keeps the matches for an hour. Films
 * not in the library are simply absent; an outage is remembered only briefly.
 */
export async function libraryMoviesByTmdb(tmdbIds: number[]) {
  "use cache";
  cacheTag(movieLibraryTag);
  const wanted = new Set(tmdbIds);
  const found: Record<number, MoviePreview> = {};
  for (let page = 1; page <= SCAN_PAGES; page++) {
    const list = await backendRequest("/movies", "get", { query: { page, limit: 100 }, withAuth: false });
    if (!list.response.ok || !list.result) {
      cacheLife("minutes");
      return found;
    }
    for (const movie of list.result.data) {
      if (movie.dbId == null || !wanted.has(movie.dbId)) continue;
      found[movie.dbId] = {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path ?? null,
        release_date: movie.release_date ?? null,
      };
    }
    if (page >= list.result.meta.totalPages) break;
  }
  cacheLife("hours");
  return found;
}

/** A shelf of library films that have a poster, for the landing's carousel. Kept for an hour. */
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
