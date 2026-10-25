import type { ReactNode } from "react";
import type { Metadata } from "next";
import { pageMetadata } from "@/config/seo";
import { formatRating, imageSrc, verdict } from "@/features/community/format";
import communityServices from "@/services/community";

const fallback = pageMetadata(
  "Community post",
  "A conversation from the Paradiso film community.",
  { noIndex: true },
);

const clip = (value: string, max: number) => {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postId: string }>;
}): Promise<Metadata> {
  const { postId } = await params;
  const id = Number(postId);
  if (!Number.isSafeInteger(id) || id <= 0) return fallback;

  const { result } = await communityServices.post(id);
  if (!result) return fallback;

  // A repost has no content of its own; its link previews the original.
  const post =
    result.kind === "repost" && result.quotedPost
      ? { ...result, ...result.quotedPost }
      : result;
  const author = post.author.username;
  const film = post.movie?.title;

  const title = film
    ? `${author} on ${film}${post.rating != null ? ` · ${formatRating(post.rating)}/10` : ""}`
    : `${author} on Paradiso`;
  const body = clip(post.text, 200);
  const description = [
    post.rating != null ? `${verdict(post.rating)} — ${formatRating(post.rating)}/10.` : "",
    body,
  ]
    .filter(Boolean)
    .join(" ") || "A conversation from the Paradiso film community.";

  // The author's own image wins, then the film poster, then the shared card.
  const src = imageSrc(post.imageUrl, "w780") ?? imageSrc(post.movie?.poster_path, "w780");

  return pageMetadata(title, description, {
    noIndex: true,
    image: src ? { url: src, alt: film ? `${film} poster` : `Post by ${author}` } : undefined,
  });
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
