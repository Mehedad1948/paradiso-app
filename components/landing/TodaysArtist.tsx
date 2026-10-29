import { cacheLife } from "next/cache";
import { artistGist, featuredArtists } from "@/services/featured/artists";
import { untilNextFeaturedDay } from "@/services/featured/ttl";
import ArtistOfTheDay from "./ArtistOfTheDay";

/**
 * Today's artist with the start of their biography. Cached whole, so the biography lookup (which
 * retries outside the cache on failure) never makes the landing dynamic. It is dropped at the UTC
 * rollover; without an answer from the backend it retries within minutes.
 */
export default async function TodaysArtist() {
  "use cache";
  const artists = await featuredArtists();
  const gist = artists[0] ? await artistGist(artists[0].person.id) : null;
  if (artists.length) cacheLife(untilNextFeaturedDay());
  else cacheLife("minutes");
  return <ArtistOfTheDay artists={artists} gist={gist} />;
}
