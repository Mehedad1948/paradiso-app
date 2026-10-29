import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { FeaturedArtist } from "@/types/featured";
import { backendRequest } from "../backend";
import { personDetails } from "../people/details";
import { untilNextFeaturedDay } from "./ttl";

export const featuredArtistsTag = "featured-artists";

/** Plenty to fill two lines at any width; the section's CSS does the actual truncating. */
const GIST_CHARS = 400;

/** The start of today's artist's biography, from the person details the person page shares. */
export async function artistGist(personId: number) {
  const { result } = await personDetails(personId);
  const text = (result?.biography ?? "").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, GIST_CHARS) : null;
}

/** Today's pick and the ten days before it. */
const DAYS = 11;

/**
 * The same pick is shown to everyone, so one shared copy serves the whole site. It refreshes
 * in the background at least hourly (an admin change shows up without a deploy) and expires at
 * the UTC rollover. A failed call is remembered only briefly and throws nothing: the section
 * simply stays out of the page until the backend answers.
 */
export async function featuredArtists(): Promise<FeaturedArtist[]> {
  "use cache";
  cacheTag(featuredArtistsTag);
  const result = await backendRequest("/featured-artists", "get", {
    query: { limit: DAYS },
    withAuth: false,
  });
  if (!result.response.ok || !result.result) {
    cacheLife("minutes");
    return [];
  }
  cacheLife(untilNextFeaturedDay());
  return result.result.data;
}
