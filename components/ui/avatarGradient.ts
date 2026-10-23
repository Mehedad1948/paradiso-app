import type { CSSProperties } from "react";

/** Stable 32-bit hash so a given name always gets the same tint. */
function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const CORNERS = ["0% 0%", "100% 0%", "0% 100%", "100% 100%"];

/**
 * Per-name hue and glow corner for members without a photo. Pair with the
 * `.avatar-placeholder` class, which draws the theme-aware surface.
 */
export function avatarGradient(name?: string | null): CSSProperties {
  const h = hash((name ?? "").trim().toLowerCase() || "paradiso");
  return {
    "--av-hue": h % 360,
    "--av-spot": CORNERS[(h >>> 9) % CORNERS.length],
  } as CSSProperties;
}
