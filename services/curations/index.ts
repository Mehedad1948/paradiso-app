import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { dailyPicks, utcDay } from "@/lib/curations/daily";
import { libraryShowcase } from "@/services/movies/library";
import { untilNextFeaturedDay } from "@/services/featured/ttl";
import { DAILY_PICKS, type CurationKey } from "@/types/curations";
import { backendRequest } from "../backend";

/** Saving a list in the admin expires its tag, so the landing shows the edit on the next visit. */
export const curationTag = (key: CurationKey) => `curation:${key}`;

/**
 * The landing grid's filled cells, or `null` when the backend can't be read (the grid then shows
 * its built-in frames). A save refreshes it at once through the tag; the daily refresh only picks
 * up films the library hid or deleted on its own. An outage is remembered only briefly.
 */
export async function landingGrid() {
  "use cache";
  cacheTag(curationTag("landing-grid"));
  const { response, result } = await backendRequest("/curations/landing-grid", "get", { withAuth: false });
  if (!response.ok || !result) {
    cacheLife("minutes");
    return null;
  }
  cacheLife("days");
  return result.data;
}

/** The whole editors' picks pool (each film with its cover, if any) in admin order, or `null` when the backend can't be read. */
async function editorsPicksPool() {
  "use cache";
  cacheTag(curationTag("editors-picks"));
  const { response, result } = await backendRequest("/curations/editors-picks", "get", { withAuth: false });
  if (!response.ok || !result) {
    cacheLife("minutes");
    return null;
  }
  cacheLife("days");
  return result.data;
}

/**
 * Today's shelf: a date-seeded draw from the editors' picks, the same for everyone until the UTC
 * rollover (when the featured artist changes too). With no picks yet, or no answer, it falls back
 * to the newest library films that have a poster.
 */
export async function todaysPicks() {
  "use cache";
  cacheTag(curationTag("editors-picks"));
  const pool = await editorsPicksPool();
  if (!pool?.length) {
    if (pool) cacheLife(untilNextFeaturedDay());
    else cacheLife("minutes");
    return libraryShowcase();
  }
  cacheLife(untilNextFeaturedDay());
  return dailyPicks(
    pool.flatMap(({ movie, imageUrl }) => {
      // A pick's own cover wins; a film without a poster is fine when it has one.
      const cover = imageUrl ?? movie.poster_path;
      return cover ? [{ id: movie.id, title: movie.title, poster_path: movie.poster_path, release_date: movie.release_date, cover }] : [];
    }),
    utcDay(),
    DAILY_PICKS,
  );
}
