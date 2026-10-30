import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import roomsServices from ".";

/** One tag for every page of the list; any change to a public room or its members expires them all. */
export const publicRoomsTag = "public-rooms";

/**
 * The list is the same for every visitor. Room, membership and invitation changes expire it on
 * demand through the tag; the lifetime only covers what nothing signals, such as a member
 * renaming themselves. An outage throws so it never lands in the cache.
 */
async function cachedPublicRooms(page: number, limit: number) {
  "use cache";
  cacheTag(publicRoomsTag);
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  const result = await roomsServices.getPublicRooms({ page, limit });
  if (!result.response.ok) throw new Error(result.error ?? "Public rooms unavailable");
  return result;
}

export async function publicRooms(page: number, limit: number, signal?: AbortSignal) {
  try {
    return await cachedPublicRooms(page, limit);
  } catch {
    // Ask once more outside the cache so the caller gets the real failure.
    return roomsServices.getPublicRooms({ page, limit, signal });
  }
}
