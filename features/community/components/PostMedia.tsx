import Link from "next/link";
import clsx from "clsx";
import { Popcorn } from "lucide-react";
import type { CommunityPost } from "@/types/community";
import RatingBadge from "./RatingBadge";
import { hasCustomImage, imageSrc, movieFeedHref } from "../format";

/**
 * The recommendation as a big image, the way a timeline shows photos. A custom
 * still fills the frame; a poster stands centered on a blurred wash of its own
 * colors. Title and score sit on a gradient along the bottom edge.
 */
export default function PostMedia({
  post,
  size = "md",
}: {
  post: Pick<CommunityPost, "imageUrl" | "movie" | "rating">;
  size?: "md" | "lg";
}) {
  const custom = hasCustomImage(post);
  const poster = imageSrc(post.movie.poster_path, "w500");
  const wash = imageSrc(post.movie.poster_path, "w185");
  const href = movieFeedHref(post.movie);

  return (
    <div className="relative mt-3 overflow-hidden rounded-2xl border border-line bg-media">
      {custom ? (
        <img
          src={post.imageUrl!}
          alt={`Still shared with the recommendation for ${post.movie.title}`}
          loading="lazy"
          decoding="async"
          className={clsx("w-full object-cover", size === "lg" ? "aspect-[16/10]" : "aspect-[16/9]")}
        />
      ) : poster ? (
        <div className={clsx("relative isolate", size === "lg" ? "h-[clamp(380px,62vw,560px)]" : "h-[clamp(320px,48vw,460px)]")}>
          <img
            src={wash!}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 -z-10 h-full w-full scale-125 object-cover opacity-90 blur-2xl saturate-150"
          />
          <span aria-hidden="true" className="absolute inset-0 -z-10 bg-black/15" />
          <img
            src={poster}
            alt={`${post.movie.title} poster`}
            loading="lazy"
            decoding="async"
            className="mx-auto h-full w-auto max-w-full object-contain shadow-[0_20px_60px_rgb(0_0_0_/_45%)]"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-primary-700 via-media to-media text-media-foreground/40">
          <Popcorn size={48} aria-hidden="true" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pb-3.5 pt-16 sm:px-5">
        <div className="pointer-events-auto min-w-0 text-white">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">Recommends</span>
          <Link
            href={href}
            className={clsx(
              "line-clamp-2 font-semibold leading-tight tracking-[-0.02em] drop-shadow hover:underline",
              size === "lg" ? "text-2xl sm:text-3xl" : "text-xl",
            )}
          >
            {post.movie.title}
          </Link>
        </div>
        <RatingBadge value={post.rating} size={size} className="pointer-events-auto" />
      </div>
    </div>
  );
}
