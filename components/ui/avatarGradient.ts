import type { CSSProperties } from "react";

/** Stable 32-bit hash so a given name always gets the same gradient. */
function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Soft two-tone gradient, derived from the name, for members without a photo. */
export function avatarGradient(name?: string | null): CSSProperties {
  const h = hash((name ?? "").trim().toLowerCase() || "paradiso");
  const hue = h % 360;
  const shift = 35 + ((h >>> 9) % 40);
  const angle = 125 + ((h >>> 17) % 50);
  return {
    backgroundImage: `linear-gradient(${angle}deg, hsl(${hue} 62% 58%), hsl(${(hue + shift) % 360} 58% 38%))`,
    color: "#fff",
    textShadow: "0 1px 2px rgb(0 0 0 / 0.25)",
  };
}
