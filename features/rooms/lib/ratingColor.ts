/**
 * Hue for a 0–10 rating. Real ratings cluster high, so everything up to 4 is
 * red and the scale only warms through orange and yellow to green above that.
 */
export function ratingHue(rate: number) {
  const t = Math.min(1, Math.max(0, (rate - 4) / 5));
  return Math.round(t ** 1.6 * 125);
}
