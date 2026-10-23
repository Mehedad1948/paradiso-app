import { cacheLife } from "next/cache";
import { backendRequest } from "@/services/backend";
import { hasCustomImage, imageSrc } from "@/features/community/format";
import type { CommunityPost } from "@/types/community";
import ShowcaseCarousel, { type ShowcaseItem } from "./ShowcaseCarousel";

const MIN_CARDS = 3;

function toItem(post: CommunityPost): ShowcaseItem | null {
  const movie = post.movie;
  if (!movie) return null;
  const src = hasCustomImage(post)
    ? post.imageUrl
    : imageSrc(movie.poster_path, "w780");
  if (!src) return null;
  const quote = post.text.replace(/\s+/g, " ").trim();
  return {
    postId: post.id,
    src,
    alt: `${movie.title} — post by ${post.author.username}`,
    eyebrow: movie.title,
    title: post.author.username,
    subtitle: quote.length > 140 ? `${quote.slice(0, 137)}…` : quote,
  };
}

/** Latest public posts, fetched on the server so they are in the first paint. */
export default async function CommunityShowcase() {
  "use cache";
  cacheLife("minutes");

  // No session token: the cached result is shared by every visitor.
  const { result } = await backendRequest("/community/posts", "get", {
    query: { limit: 8 },
    withAuth: false,
  });
  const items = (result?.data ?? []).flatMap((post) => toItem(post) ?? []);

  return (
    <div
      className="h-[640px] w-full max-w-[720px] justify-self-end max-lg:h-[560px] max-sm:h-[460px] max-sm:max-w-none"
      role={items.length >= MIN_CARDS ? "region" : undefined}
      aria-label="Latest posts from the Paradiso community"
    >
      {items.length >= MIN_CARDS && <ShowcaseCarousel items={items} />}
    </div>
  );
}
