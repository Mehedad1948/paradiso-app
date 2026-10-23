"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { MessageCircle, ThumbsDown, ThumbsUp, Share2 } from "lucide-react";
import type { CommunityPost } from "@/types/community";
import { useReact } from "@/hooks/queries/useCommunityQueries";
import type { Viewer } from "../hooks/useViewer";
import { postHref } from "../format";
import { copyPostLink } from "./PostMenu";
import { useSignInHref } from "./SignInLink";
import GlassSurface from "./GlassSurface";

async function sharePost(post: CommunityPost) {
  const url = `${window.location.origin}${postHref(post.id)}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: post.movie?.title, url });
      return;
    } catch (error) {
      if ((error as DOMException).name === "AbortError") return;
    }
  }
  copyPostLink(post.id);
}

const button =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm font-semibold tabular-nums transition-colors hover:bg-white/20 disabled:opacity-60";

/** Like, dislike and share, as a glass tab over the post image. */
export default function PostActions({
  post,
  viewer,
}: {
  post: CommunityPost;
  viewer: Viewer;
}) {
  const router = useRouter();
  const overlay = usePathname().startsWith("/community");
  const signIn = useSignInHref();
  const react = useReact();
  // Reacting in a room needs membership; the backend enforces it, this just hides the dead end.
  const canReact = !post.room || viewer.isMember(post.room.id);

  function toggle(value: 1 | -1) {
    if (!viewer.signedIn) return router.push(signIn);
    react.mutate({ postId: post.id, value: post.myReaction === value ? null : value });
  }

  return (
    <GlassSurface
      width="auto"
      height={44}
      borderRadius={22}
      distortionScale={-120}
      displace={0.5}
      backgroundOpacity={0.1}
      className="text-white"
    >
      <div className="flex items-center gap-0.5 px-1.5">
        {canReact && (
          <>
            <button
              type="button"
              onClick={() => toggle(1)}
              aria-pressed={post.myReaction === 1}
              aria-label={`Like, ${post.likeCount} likes`}
              className={clsx(button, post.myReaction === 1 && "text-emerald-300")}
            >
              <ThumbsUp size={18} aria-hidden="true" fill={post.myReaction === 1 ? "currentColor" : "none"} />
              {post.likeCount > 0 && <span>{post.likeCount.toLocaleString()}</span>}
            </button>
            <button
              type="button"
              onClick={() => toggle(-1)}
              aria-pressed={post.myReaction === -1}
              aria-label={`Dislike, ${post.dislikeCount} dislikes`}
              className={clsx(button, post.myReaction === -1 && "text-rose-300")}
            >
              <ThumbsDown size={18} aria-hidden="true" fill={post.myReaction === -1 ? "currentColor" : "none"} />
              {post.dislikeCount > 0 && <span>{post.dislikeCount.toLocaleString()}</span>}
            </button>
          </>
        )}
        <Link
          href={`${postHref(post.id)}#comments`}
          scroll={!overlay}
          aria-label={`${post.commentCount} comments`}
          className={button}
        >
          <MessageCircle size={18} aria-hidden="true" />
          {post.commentCount > 0 && <span>{post.commentCount.toLocaleString()}</span>}
        </Link>
        <button
          type="button"
          onClick={() => sharePost(post)}
          aria-label="Share post"
          className={clsx(button, "w-9 px-0")}
        >
          <Share2 size={18} aria-hidden="true" />
        </button>
      </div>
    </GlassSurface>
  );
}
