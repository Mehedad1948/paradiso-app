"use client";
import { useMemo, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@heroui/spinner";
import { ArrowUpIcon, StarShineIcon } from "@solar-icons/react/linear";
import clsx from "clsx";
import QueryError from "@/components/ui/QueryError";
import { useFeed, useFeedHead } from "@/hooks/queries/useCommunityQueries";
import { communityKeys } from "@/lib/query/community-keys";
import type { FeedScope } from "@/types/community";
import { useInfiniteSentinel } from "../hooks/useInfiniteSentinel";
import type { Viewer } from "../hooks/useViewer";
import PostCard from "./PostCard";
import PostSkeleton from "./PostSkeleton";

/** An infinitely scrolling column of posts for one feed. */
export default function FeedList({
  scope,
  viewer,
  empty,
  bare = false,
  enabled = true,
}: {
  scope: FeedScope;
  viewer: Viewer;
  empty: ReactNode;
  /** Drops the outer frame, for feeds inside a panel. */
  bare?: boolean;
  enabled?: boolean;
}) {
  const client = useQueryClient();
  const feed = useFeed(scope, enabled);
  const posts = useMemo(() => feed.data?.pages.flatMap((page) => page.data) ?? [], [feed.data]);
  const fresh = useFeedHead(scope, posts[0]?.id, enabled && feed.isSuccess);
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = feed;
  const sentinel = useInfiniteSentinel(
    () => void (!isFetchingNextPage && !isError && fetchNextPage()),
    !!hasNextPage,
  );

  function showFresh() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Reset to a single fresh page rather than refetching every page loaded so far.
    void client.resetQueries({ queryKey: communityKeys.feed(scope), exact: true });
  }

  const frame = clsx(!bare && "overflow-hidden rounded-[10px] border border-line bg-elevated");

  if (feed.isPending)
    return (
      <div className={clsx(frame, "divide-y divide-line")} role="status" aria-label="Loading posts">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  if (feed.isError && !posts.length)
    return <QueryError error={feed.error} retry={() => feed.refetch()} />;
  if (!posts.length) return <div className={clsx(frame, "px-6 py-14 text-center")}>{empty}</div>;

  return (
    <div className="relative" aria-busy={feed.isFetching}>
      {!!fresh.data && (
        <div className="pointer-events-none sticky top-[150px] z-20 flex h-0 justify-center max-[480px]:top-[170px]">
          <button
            type="button"
            onClick={showFresh}
            className="pointer-events-auto -mt-3 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-on-accent shadow-[0_10px_30px_rgb(0_0_0_/_18%)] transition-transform hover:-translate-y-0.5 motion-safe:animate-community-rise"
          >
            <ArrowUpIcon size={16} aria-hidden="true" />
            {fresh.data >= 10 ? "10+" : fresh.data} new {fresh.data === 1 ? "recommendation" : "recommendations"}
          </button>
        </div>
      )}
      <div className={clsx(frame, "divide-y divide-line")}>
        {/* Cards rise in with CSS; a GSAP scroll trigger and blur filter per card got costly in long feeds. */}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} viewer={viewer} />
        ))}
      </div>
      <div ref={sentinel} className="flex min-h-[72px] items-center justify-center py-6 text-sm text-muted">
        {isFetchingNextPage ? (
          <Spinner size="sm" label="Loading more" classNames={{ label: "text-sm text-muted" }} />
        ) : isError ? (
          <button type="button" onClick={() => fetchNextPage()} className="font-semibold text-accent hover:underline">
            Couldn&apos;t load more. Try again
          </button>
        ) : hasNextPage ? (
          <button type="button" onClick={() => fetchNextPage()} className="font-semibold hover:text-ink">
            Load more
          </button>
        ) : (
          <span className="inline-flex items-center gap-2">
            <StarShineIcon size={15} className="text-accent" aria-hidden="true" />
            You&apos;re all caught up.
          </span>
        )}
      </div>
    </div>
  );
}
