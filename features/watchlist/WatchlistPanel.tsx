"use client";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Bookmark, Star } from "lucide-react";
import QueryError from "@/components/ui/QueryError";
import SwipeRow from "@/components/ui/SwipeRow";
import MoviePoster from "@/features/rooms/components/MoviePoster";
import { useRemoveFromWatchlist, useWatchlist } from "@/hooks/queries/useWatchlistQueries";
import type { WatchlistItem } from "@/types/watchlist";

const ROW_HEIGHT = 96;
const addedOn = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

function WatchlistRow({ item, onRemove }: { item: WatchlistItem; onRemove: (movieId: string) => void }) {
  const { movie } = item;
  const year = movie.release_date?.slice(0, 4);
  const rating = movie.vote_average ?? movie.imdbRate;
  const genres = movie.genres.slice(0, 2).map((genre) => genre.name);
  return (
    <SwipeRow
      label={movie.title}
      height={ROW_HEIGHT}
      radius={16}
      rowColor="hsl(var(--heroui-content2))"
      textColor="hsl(var(--heroui-foreground))"
      actionColor="#e5484d"
      drawerColor="#e5484d"
      actions={[{ id: "remove", label: "Remove" }]}
      onCommit={() => onRemove(movie.id)}
      className="mb-3 border-line"
    >
      <MoviePoster
        path={movie.poster_path}
        title={movie.title}
        size="w92"
        width={44}
        height={66}
        className="h-[66px] w-11 shrink-0 rounded-lg shadow-md"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold leading-tight tracking-[-0.02em]">{movie.title}</p>
        <p className="mt-1 flex items-center gap-2 text-sm font-normal text-muted">
          {year && <span>{year}</span>}
          {rating != null && rating > 0 && (
            <span className="flex items-center gap-1">
              <Star size={13} className="fill-warning-500 text-warning-500" aria-hidden="true" />
              {rating.toFixed(1)}
            </span>
          )}
        </p>
        <p className="mt-1 truncate text-xs font-normal text-muted">
          {[...genres, `Added ${addedOn.format(new Date(item.addedAt))}`].join(" · ")}
        </p>
      </div>
    </SwipeRow>
  );
}

/** The signed-in user's saved movies; swipe a row sideways to take it off the list. */
export default function WatchlistPanel() {
  const list = useWatchlist();
  const remove = useRemoveFromWatchlist();
  const items = list.data ?? [];

  if (list.isPending)
    return (
      <div className="flex justify-center py-16">
        <Spinner size="md" label="Loading your watchlist" classNames={{ label: "text-sm text-muted" }} />
      </div>
    );
  if (list.isError) return <QueryError error={list.error} retry={() => void list.refetch()} />;
  if (!items.length)
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="rounded-full bg-surface p-4 text-muted">
          <Bookmark size={28} aria-hidden="true" />
        </span>
        <p className="text-lg font-semibold tracking-[-0.03em]">Nothing saved yet</p>
        <p className="max-w-64 text-sm font-normal text-muted">
          Movies you add to your watchlist will show up here.
        </p>
      </div>
    );
  return (
    <section aria-label="Your watchlist">
      <p className="mb-3 text-sm font-normal text-muted">Swipe a movie left to remove it.</p>
      <ul>
        {items.map((item) => (
          <li key={item.movie.id}>
            <WatchlistRow item={item} onRemove={remove.mutate} />
          </li>
        ))}
      </ul>
      {list.hasNextPage && (
        <Button
          variant="flat"
          fullWidth
          isLoading={list.isFetchingNextPage}
          onPress={() => void list.fetchNextPage()}
        >
          Load more
        </Button>
      )}
    </section>
  );
}
