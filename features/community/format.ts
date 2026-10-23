import { differenceInSeconds, format } from "date-fns";
import type { CommunityPost } from "@/types/community";

/** Compact feed timestamps: now, 5m, 3h, 4d, Oct 12, Oct 12, 2024. */
export function ago(value: string, now = new Date()) {
  const date = new Date(value);
  const seconds = Math.max(0, differenceInSeconds(now, date));
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 7 * 86_400) return `${Math.floor(seconds / 86_400)}d`;
  return format(date, date.getFullYear() === now.getFullYear() ? "MMM d" : "MMM d, yyyy");
}

export const fullDate = (value: string) => format(new Date(value), "h:mm a · MMM d, yyyy");

/** Creation and the first save can differ by a few milliseconds. */
export const isEdited = (item: { createdAt: string; updatedAt: string }) =>
  Date.parse(item.updatedAt) - Date.parse(item.createdAt) > 2000;

/** Absolute image URLs pass through; relative TMDb poster paths get the CDN base. */
export function imageSrc(path: string | null | undefined, size: "w185" | "w500" | "w780" = "w500") {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL}${size}${path}`;
}

/** True when the author attached their own still rather than the movie poster. */
export const hasCustomImage = (post: Pick<CommunityPost, "imageUrl" | "movie">) =>
  !!post.imageUrl && post.imageUrl !== post.movie?.poster_path && /^https:\/\//.test(post.imageUrl);

export const formatRating = (value: number) => (value === 10 ? "10" : value.toFixed(1));

/** A one-word verdict so a number reads as an opinion. */
export function verdict(value: number) {
  if (value >= 9.5) return "Masterpiece";
  if (value >= 8.5) return "Must watch";
  if (value >= 7) return "Recommended";
  if (value >= 5.5) return "Worth a look";
  if (value >= 3.5) return "Mixed feelings";
  return "Skip it";
}

export const postHref = (id: number) => `/community/posts/${id}`;
export const profileHref = (id: number) => `/community/users/${id}`;
export const movieFeedHref = (movie: { id: string; title: string }) =>
  `/community?${new URLSearchParams({ movie: movie.id, title: movie.title.slice(0, 200) })}`;

export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count.toLocaleString()} ${count === 1 ? one : many}`;

/** Score colors, high to low: the rating is the most colorful thing on a post. */
export function tone(value: number) {
  if (value >= 8.5) return { badge: "bg-emerald-500 text-white", text: "text-emerald-500", fill: "#10b981" };
  if (value >= 7) return { badge: "bg-teal-500 text-white", text: "text-teal-500", fill: "#14b8a6" };
  if (value >= 5.5) return { badge: "bg-amber-500 text-white", text: "text-amber-500", fill: "#f59e0b" };
  return { badge: "bg-rose-500 text-white", text: "text-rose-500", fill: "#f43f5e" };
}

/** A stable color per member, so faces are recognisable in a busy feed. */
export function userHue(id: number) {
  return (id * 137.508) % 360;
}
