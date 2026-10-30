"use client";
import Link from "next/link";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { BookmarkCheckIcon, BookmarkPlusIcon, ChatRoundIcon, CloseIcon, DislikeIcon, LikeIcon, LinkRoundIcon, QuoteIcon, RepeatIcon, ShareIcon } from "@solar-icons/react/linear";
import { ShareIcon as ShareOutlineIcon } from "@solar-icons/react/outline";
import type { CommunityPost } from "@/types/community";
import { useReact, useRepost } from "@/hooks/queries/useCommunityQueries";
import { useInWatchlist, useToggleWatchlist } from "@/hooks/queries/useWatchlistQueries";
import BubbleMenu, { type BubbleItem } from "@/components/ui/BubbleMenu";
import { hoverTip } from "@/components/ui/hoverTips";
import { FacebookLogo, TelegramLogo, XLogo } from "@/components/ui/BrandIcons";
import type { Viewer } from "../hooks/useViewer";
import { postHref } from "../format";
import { copyPostLink } from "./PostMenu";
import { AuthGate, useAuthAction } from "@/components/auth/gate";

/** Short hint for an icon-only action. A shared listener draws it, so cards mount no tooltip components. */
function Tip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="inline-flex" {...hoverTip(label)}>
      {children}
    </span>
  );
}

const QuoteComposer = dynamic(() => import("./QuoteComposer"), { ssr: false });

const noSubscribe = () => () => {};
/**
 * Whether a post opens as an overlay here. Read without subscribing: usePathname would
 * re-render every card in the feed each time a post opens or closes.
 */
const useInCommunity = () =>
  useSyncExternalStore(noSubscribe, () => window.location.pathname.startsWith("/community"), () => false);

function shareItems(post: CommunityPost): BubbleItem[] {
  const url = `${window.location.origin}${postHref(post.id)}`;
  const text = post.movie
    ? `${post.author.username} recommends ${post.movie.title}`
    : post.text.slice(0, 120);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  const items: BubbleItem[] = [
    { key: "copy", label: "Copy link", icon: <LinkRoundIcon size={18} />, onSelect: () => copyPostLink(post.id), className: "hover:text-emerald-500" },
    { key: "x", label: "Share on X", icon: <XLogo />, href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { key: "facebook", label: "Share on Facebook", icon: <FacebookLogo />, href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, className: "hover:text-[#1877f2]" },
    { key: "telegram", label: "Share on Telegram", icon: <TelegramLogo />, href: `https://t.me/share/url?url=${u}&text=${t}`, className: "hover:text-[#229ed9]" },
  ];
  // Desktop share sheets are thin; on phones the native one reaches every app.
  if (typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches) {
    items.push({
      key: "more",
      label: "More options",
      icon: <ShareIcon size={18} />,
      onSelect: () => navigator.share({ title: text, url }).catch(() => {}),
    });
  }
  return items;
}

type Tone = "media" | "surface";

// Over an image the bar is smoked glass lit along its top edge; on the page it has no chrome at all.
const bar: Record<Tone, string> = {
  media:
    "rounded-full p-1 bg-black/35 text-white/90 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgb(255_255_255_/_14%),0_12px_32px_-12px_rgb(0_0_0_/_60%)]",
  // Spread evenly across the row so every action keeps its slot, with or without counts.
  surface: "-ml-2 w-full max-w-[26rem] justify-between text-muted",
};

// The share bubbles float, so they keep a soft shadow but no outline.
const bubble: Record<Tone, string> = {
  media:
    "bg-black/55 text-white backdrop-blur-xl shadow-[inset_0_1px_0_rgb(255_255_255_/_16%),0_10px_24px_-8px_rgb(0_0_0_/_60%)]",
  surface:
    "bg-elevated text-ink shadow-[0_2px_4px_rgb(0_0_0_/_5%),0_10px_24px_-8px_rgb(0_0_0_/_25%)] dark:bg-surface",
};

// Over the image the bar sits in the top-right corner, so the bubbles fan down and left, clear of it.
const arc: Record<Tone, { startAngle: number; endAngle: number }> = {
  media: { startAngle: 90, endAngle: 155 },
  surface: { startAngle: 200, endAngle: 340 },
};

// Repost and quote are just two bubbles, straight above (or below, over an image) the trigger.
const repostArc: Record<Tone, { startAngle: number; endAngle: number }> = {
  media: { startAngle: 60, endAngle: 120 },
  surface: { startAngle: 240, endAngle: 300 },
};

const button =
  "relative inline-flex h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-2 text-[13px] font-medium tracking-wide tabular-nums transition-colors duration-200 disabled:opacity-60 [&_svg]:transition-transform [&_svg]:duration-300 [&_svg]:ease-out hover:[&_svg]:scale-110 active:[&_svg]:scale-90";

// Each action takes its own color on hover and when it's yours.
const hues = {
  like: {
    media: { hover: "hover:bg-white/10 hover:text-emerald-300", on: "text-emerald-300" },
    surface: { hover: "hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400", on: "text-emerald-600 dark:text-emerald-400" },
  },
  dislike: {
    media: { hover: "hover:bg-white/10 hover:text-rose-300", on: "text-rose-300" },
    surface: { hover: "hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400", on: "text-rose-600 dark:text-rose-400" },
  },
  comment: {
    media: { hover: "hover:bg-white/10 hover:text-sky-300" },
    surface: { hover: "hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400" },
  },
  repost: {
    media: { hover: "hover:bg-white/10 hover:text-lime-300", on: "text-lime-300" },
    surface: { hover: "hover:bg-lime-500/10 hover:text-lime-600 dark:hover:text-lime-400", on: "text-lime-600 dark:text-lime-400" },
  },
  watchlist: {
    media: { hover: "hover:bg-white/10 hover:text-amber-300", on: "text-amber-300" },
    surface: { hover: "hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400", on: "text-amber-600 dark:text-amber-400" },
  },
  share: {
    media: { hover: "hover:bg-white/10 hover:text-white" },
    surface: { hover: "hover:bg-accent/10 hover:text-accent" },
  },
} as const;

/** Pops its icon when the reaction is switched on. */
function Pop({ on, children }: { on: boolean; children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [was, setWas] = useState(on);
  if (on !== was) {
    setWas(on);
    if (on) setCount((c) => c + 1);
  }
  // A new key restarts the CSS animation; nothing animates on first render.
  return (
    <span key={count} className={clsx("inline-flex", count > 0 && "motion-safe:animate-community-pop")}>
      {children}
    </span>
  );
}

/** Saves the recommended movie to the viewer's own watchlist. */
function WatchlistButton({
  movie,
  viewer,
  tone,
}: {
  movie: NonNullable<CommunityPost["movie"]>;
  viewer: Viewer;
  tone: Tone;
}) {
  // The post already says whether the film is saved, so the card asks for nothing.
  const saved = useInWatchlist(movie.id, viewer.signedIn, movie.inWatchlist).data === true;
  const toggle = useToggleWatchlist(movie.id, movie.title);
  const toggleSaved = useAuthAction(() => toggle.mutate(!saved), { reason: "Sign in to save films to your watchlist" });
  const label = saved ? "Remove from watchlist" : "Add to watchlist";
  return (
    <Tip label={label}>
    <button
      type="button"
      aria-pressed={saved}
      aria-label={label}
      disabled={toggle.isPending}
      onClick={toggleSaved}
      className={clsx(button, hues.watchlist[tone].hover, saved && hues.watchlist[tone].on)}
    >
      <Pop on={saved}>
        {saved ? (
          <BookmarkCheckIcon size={18} strokeWidth={1.75} aria-hidden="true" fill="currentColor" fillOpacity={0.2} />
        ) : (
          <BookmarkPlusIcon size={18} strokeWidth={1.75} aria-hidden="true" />
        )}
      </Pop>
    </button>
    </Tip>
  );
}

/** Like, dislike, discuss and share as one pill: over the post image, or under the text when there is none. */
export default function PostActions({
  post,
  viewer,
  tone = "surface",
}: {
  post: CommunityPost;
  viewer: Viewer;
  tone?: Tone;
}) {
  const overlay = useInCommunity();
  const react = useReact();
  const repost = useRepost();
  const [quoting, setQuoting] = useState(false);
  // Reacting in a room needs membership; the backend enforces it, this just hides the dead end.
  const canReact = !post.room || viewer.isMember(post.room.id);
  const liked = post.myReaction === 1;
  const disliked = post.myReaction === -1;

  const shared = post.repostCount + post.quoteCount;
  const repostItems: BubbleItem[] = [
    {
      key: "repost",
      label: post.reposted ? "Undo repost" : "Repost",
      icon: <RepeatIcon size={18} />,
      onSelect: () => repost.mutate({ postId: post.id, on: !post.reposted, me: viewer.me!.id }),
      className: post.reposted ? hues.repost[tone].on : hues.repost[tone].hover,
    },
    { key: "quote", label: "Quote", icon: <QuoteIcon size={16} />, onSelect: () => setQuoting(true) },
  ];
  const repostIcon = (
    <>
      <Pop on={post.reposted}>
        <RepeatIcon size={19} strokeWidth={1.75} aria-hidden="true" />
      </Pop>
      {shared > 0 && <span>{shared.toLocaleString()}</span>}
    </>
  );
  const repostClass = clsx(button, hues.repost[tone].hover, post.reposted && hues.repost[tone].on);

  const toggle = useAuthAction(
    (value: 1 | -1) => react.mutate({ postId: post.id, value: post.myReaction === value ? null : value }),
    { reason: "Sign in to react to posts" },
  );

  return (
    <div
      role="group"
      aria-label="Post actions"
      className={clsx("inline-flex items-center gap-0.5", bar[tone])}
    >
      {canReact && (
        <>
          <Tip label={liked ? "Remove like" : "Like"}>
          <button
            type="button"
            onClick={() => toggle(1)}
            aria-pressed={liked}
            aria-label={`Like, ${post.likeCount} likes`}
            className={clsx(button, hues.like[tone].hover, liked && hues.like[tone].on)}
          >
            <Pop on={liked}>
              <LikeIcon size={18} strokeWidth={1.75} aria-hidden="true" fill={liked ? "currentColor" : "none"} />
            </Pop>
            {post.likeCount > 0 && <span>{post.likeCount.toLocaleString()}</span>}
          </button>
          </Tip>
          <Tip label={disliked ? "Remove dislike" : "Dislike"}>
          <button
            type="button"
            onClick={() => toggle(-1)}
            aria-pressed={disliked}
            aria-label={`Dislike, ${post.dislikeCount} dislikes`}
            className={clsx(button, hues.dislike[tone].hover, disliked && hues.dislike[tone].on)}
          >
            <Pop on={disliked}>
              <DislikeIcon size={18} strokeWidth={1.75} aria-hidden="true" fill={disliked ? "currentColor" : "none"} />
            </Pop>
            {post.dislikeCount > 0 && <span>{post.dislikeCount.toLocaleString()}</span>}
          </button>
          </Tip>
          <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-current opacity-30" />
        </>
      )}
      <Tip label="View comments">
      <Link
        href={`${postHref(post.id)}#comments`}
        scroll={!overlay}
        aria-label={`${post.commentCount} comments`}
        className={clsx(button, hues.comment[tone].hover)}
      >
        <ChatRoundIcon size={18} strokeWidth={1.75} aria-hidden="true" />
        {post.commentCount > 0 && <span>{post.commentCount.toLocaleString()}</span>}
      </Link>
      </Tip>
      {canReact &&
        (
          <Tip label="Repost or quote">
          {viewer.signedIn ? (
          <BubbleMenu
            label={`Repost or quote, ${post.repostCount} reposts, ${post.quoteCount} quotes`}
            items={repostItems}
            triggerClassName={repostClass}
            bubbleClassName={clsx(bubble[tone], "transition-colors")}
            {...repostArc[tone]}
          >
            {repostIcon}
          </BubbleMenu>
        ) : (
          <AuthGate reason="Sign in to repost or quote">
            <button type="button" aria-label="Repost or quote" className={repostClass}>
              {repostIcon}
            </button>
          </AuthGate>
          )}
          </Tip>
        )}
      {post.movie && <WatchlistButton movie={post.movie} viewer={viewer} tone={tone} />}
      <Tip label="Share">
      <BubbleMenu
        label="Share post"
        items={typeof window === "undefined" ? [] : shareItems(post)}
        triggerClassName={clsx(button, "px-0", hues.share[tone].hover)}
        bubbleClassName={clsx(bubble[tone], "transition-colors [&_svg]:h-[17px] [&_svg]:w-[17px]")}
        {...arc[tone]}
      >
        {(open) =>
          open ? (
            <CloseIcon size={18} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <ShareOutlineIcon size={18} strokeWidth={1.75} aria-hidden="true" />
          )
        }
      </BubbleMenu>
      </Tip>
      {quoting && <QuoteComposer post={post} onClose={() => setQuoting(false)} />}
    </div>
  );
}
