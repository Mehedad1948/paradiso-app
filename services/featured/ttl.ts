const DAY_SECONDS = 86_400;
/** Below this `expire`, Next.js leaves the entry out of prerenders. */
const MIN_EXPIRE = 300;
const MAX_REVALIDATE = 3600;

/** Whole seconds from `now` to the next 00:00 UTC, the moment the featured artist changes. */
export function secondsUntilUtcMidnight(now = Date.now()) {
  const sinceMidnight = Math.floor(now / 1000) % DAY_SECONDS;
  return DAY_SECONDS - sinceMidnight;
}

/**
 * A cache lifetime that never outlives today's pick. The copy refreshes in the background at
 * least hourly, and is dropped outright at the UTC rollover so nobody is served yesterday's
 * artist as today's.
 */
export function untilNextFeaturedDay(now = Date.now()) {
  const left = secondsUntilUtcMidnight(now);
  const expire = Math.max(left, MIN_EXPIRE);
  return { stale: MIN_EXPIRE, revalidate: Math.min(MAX_REVALIDATE, expire), expire };
}
