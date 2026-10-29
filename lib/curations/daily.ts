/** The UTC calendar day, "YYYY-MM-DD", that the landing's daily picks are drawn for. */
export function utcDay(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

/** A 32-bit seed from a string (FNV-1a), so the same day always draws the same order. */
function seedFrom(text: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Mulberry32: a tiny, well-spread PRNG over [0, 1). */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * `count` items of `pool` for `day`, in a shuffled order. The draw depends only on the day and the
 * pool, so every server and every cache refill agrees on it until the next UTC day; a pool no
 * larger than `count` is shown whole, shuffled all the same.
 */
export function dailyPicks<T>(pool: readonly T[], day: string, count: number): T[] {
  const items = [...pool];
  const next = random(seedFrom(day));
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items.slice(0, Math.max(0, count));
}
