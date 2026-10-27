"use client";
import { useMe } from "@/hooks/queries/useMe";
import WatchlistPanel from "./WatchlistPanel";

/** Every movie the signed-in user has saved. */
export default function WatchlistPage() {
  // From `/me`: already loaded, and it moves the moment a movie is removed below.
  const total = useMe().data?.stats.watchlistCount;
  return (
    <div>
      <div className="mb-10 flex items-end justify-between gap-6 border-b border-line pb-9 max-sm:mb-7 max-sm:flex-col max-sm:items-start max-sm:pb-7">
        <div>
          <h1 className="mb-4 break-words text-[clamp(36px,4.8vw,68px)] tracking-[-0.06em] [&_em]:font-serif [&_em]:font-normal max-sm:text-[38px]">
            Saved for
            <br />
            <em>later.</em>
          </h1>
          <p className="max-w-[540px] text-base text-muted">
            Every film you&apos;ve bookmarked, waiting for the right night.
          </p>
        </div>
        {total !== undefined && (
          <p className="flex shrink-0 items-baseline gap-2" aria-live="polite">
            <span className="font-serif text-[clamp(44px,5vw,72px)] leading-none tracking-[-0.04em] tabular-nums">
              {total}
            </span>
            <span className="text-sm font-semibold text-muted">{total === 1 ? "film" : "films"} saved</span>
          </p>
        )}
      </div>
      <div className="max-w-3xl">
        <WatchlistPanel />
      </div>
    </div>
  );
}
