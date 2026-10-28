import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { backendRequest } from "../backend";

export const personTag = (id: number) => `person:${id}`;

/**
 * A filmography barely changes, but each credit also says whether the film is in the library, and
 * that changes with every film added, so the shared copy lives for hours rather than days. A
 * missing person is remembered briefly; an outage throws so it never lands in the cache.
 */
async function cachedPerson(id: number) {
  "use cache";
  cacheTag(personTag(id));
  const result = await backendRequest("/people/{tmdbPersonId}", "get", {
    pathParams: { tmdbPersonId: id },
    withAuth: false,
  });
  if (result.response.ok) cacheLife("hours");
  else if (result.response.status === 404 || result.response.status === 400) cacheLife("minutes");
  else throw new Error(result.error ?? "Person unavailable");
  return result;
}

export async function personDetails(id: number) {
  try {
    return await cachedPerson(id);
  } catch {
    // Ask once more outside the cache so the caller gets the real failure.
    return backendRequest("/people/{tmdbPersonId}", "get", {
      pathParams: { tmdbPersonId: id },
      withAuth: false,
    });
  }
}
