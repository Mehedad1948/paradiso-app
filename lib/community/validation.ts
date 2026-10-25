import { COMMUNITY_LIMITS } from "@/types/community";

// Mirrors the backend rules so the composer can explain a problem before sending.

export function postTextError(value: string) {
  const length = value.trim().length;
  if (!length) return "Write something before posting.";
  if (length > COMMUNITY_LIMITS.text)
    return `Keep it under ${COMMUNITY_LIMITS.text.toLocaleString()} characters.`;
}

export function commentTextError(value: string) {
  const length = value.trim().length;
  if (!length) return "Write something first.";
  if (length > COMMUNITY_LIMITS.comment)
    return `Keep it under ${COMMUNITY_LIMITS.comment.toLocaleString()} characters.`;
}

export function ratingError(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 10)
    return "Rate it from 0 to 10.";
  // Floating point: 7.3 * 10 is 72.99999999999999.
  if (Math.abs(Math.round(value * 10) - value * 10) > 1e-9)
    return "Use at most one decimal place.";
}

export function imageUrlError(value: unknown) {
  if (typeof value !== "string" || value.length > COMMUNITY_LIMITS.imageUrl)
    return "Invalid image";
  try {
    if (new URL(value).protocol !== "https:") return "Images must use HTTPS.";
  } catch {
    return "Invalid image";
  }
}

/** Rounds a slider value to the one decimal the backend accepts. */
export const roundRating = (value: number) =>
  Math.min(10, Math.max(0, Math.round(value * 10) / 10));
