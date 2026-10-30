import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { BackendQuery } from "@/types/backend";
import communityServices from ".";

type FeedQuery = BackendQuery<"/community/posts", "get">;

/** One tag for every cached feed page and post; creating, editing, deleting or reposting expires them all. */
export const communityPostsTag = "community-posts";

/**
 * What a signed-out visitor sees is the same for everyone, so it is cached on the server. The
 * visitor's session is never sent, which is also what keeps viewer state (reactions, reposts,
 * watchlist) out of anything shared. Signed-in readers always go to the backend. Post changes
 * expire these through the tag; the lifetime covers what nothing signals, such as like counts.
 * An outage throws so it never lands in the cache.
 */
async function cachedFeed(limit: number | null, before: number | null, authorId: number | null, movieId: string | null) {
  "use cache";
  cacheTag(communityPostsTag);
  cacheLife({ stale: 30, revalidate: 60, expire: 900 });
  const result = await communityServices.publicFeed({
    limit: limit ?? undefined,
    before: before ?? undefined,
    authorId: authorId ?? undefined,
    movieId: movieId ?? undefined,
  });
  if (!result.response.ok) throw new Error(result.error ?? "Community feed unavailable");
  return result;
}

async function cachedPost(postId: number) {
  "use cache";
  cacheTag(communityPostsTag);
  cacheLife({ stale: 30, revalidate: 60, expire: 900 });
  const result = await communityServices.publicPost(postId);
  if (!result.response.ok) throw new Error(result.error ?? "Community post unavailable");
  return result;
}

export async function publicFeed(query: FeedQuery, signal?: AbortSignal) {
  try {
    return await cachedFeed(query.limit ?? null, query.before ?? null, query.authorId ?? null, query.movieId ?? null);
  } catch {
    // Ask once more outside the cache so the caller gets the real failure.
    return communityServices.publicFeed(query, signal);
  }
}

export async function publicPost(postId: number, signal?: AbortSignal) {
  try {
    return await cachedPost(postId);
  } catch {
    // A missing post lands here too; it is asked again rather than remembered.
    return communityServices.publicPost(postId, signal);
  }
}
