"use client";
import { useMemo } from "react";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Heart, Pencil, Plus, Star } from "lucide-react";
import QueryError from "@/components/ui/QueryError";
import { useFavorites, useSetFavoriteNote } from "@/hooks/queries/useFavoriteQueries";
import { useRecommendations } from "@/hooks/queries/useCommunityQueries";
import { MAX_FAVORITE_MOVIES } from "@/types/community";
import { useInfiniteSentinel } from "../hooks/useInfiniteSentinel";
import { formatRating, postHref, tone, verdict } from "../format";
import { GridEmpty, PosterGrid, PosterGridSkeleton, PosterTile } from "./PosterGrid";
import FavoriteNoteChip from "./FavoriteNoteChip";

const year = (date: string | null) => date?.slice(0, 4);

/** The member's ranked shelf of favorite films. */
export function FavoritesGrid({
  userId,
  name,
  self,
  onEdit,
}: {
  userId: number;
  name?: string;
  self: boolean;
  onEdit: () => void;
}) {
  const favorites = useFavorites(userId);
  const setNote = useSetFavoriteNote(userId);
  const list = favorites.data ?? [];

  if (favorites.isPending) return <PosterGridSkeleton />;
  if (favorites.isError) return <QueryError error={favorites.error} retry={() => favorites.refetch()} />;
  if (!list.length)
    return (
      <GridEmpty
        icon={<Heart size={26} strokeWidth={1.5} aria-hidden="true" />}
        title={self ? "Build your shelf" : "No favorites yet"}
        body={
          self
            ? `Pin up to ${MAX_FAVORITE_MOVIES} films that made you who you are. They greet everyone who visits.`
            : `When ${name ?? "they"} picks their favorite films, they'll hang here.`
        }
        action={
          self && (
            <Button
              onPress={onEdit}
              startContent={<Plus size={18} aria-hidden="true" />}
              className="mt-2 rounded-md bg-ink font-semibold text-canvas"
            >
              Add favorites
            </Button>
          )
        }
      />
    );

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="font-semibold tabular-nums text-ink">{list.length}</span>
          {self ? ` of ${MAX_FAVORITE_MOVIES} favorites` : list.length === 1 ? " favorite" : " favorites"}
        </p>
        {self && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <Pencil size={15} aria-hidden="true" /> Edit
          </button>
        )}
      </div>
      <PosterGrid label={self ? "Your favorite films" : `${name ?? "Their"} favorite films`}>
        {list.map((item, i) => (
          <PosterTile
            key={item.movie.id}
            index={i}
            movie={item.movie}
            title={item.movie.title}
            poster={item.movie.poster_path}
            caption={year(item.movie.release_date)}
            note={item.note}
            action={
              <FavoriteNoteChip
                item={item}
                name={name}
                onSave={self ? (note) => setNote.mutate({ movieId: item.movie.id, note }) : undefined}
              />
            }
            badge={
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-black/45 px-1.5 text-xs font-semibold tabular-nums text-white ring-1 ring-white/20 backdrop-blur-md sm:h-7 sm:min-w-7 sm:text-[13px]">
                <span className="sr-only">Number </span>
                {item.position}
              </span>
            }
          />
        ))}
        {self && list.length < MAX_FAVORITE_MOVIES && (
          <li className="motion-safe:animate-poster-in" style={{ animationDelay: `${list.length * 40}ms` }}>
            <button
              type="button"
              onClick={onEdit}
              className="group flex aspect-[2/3] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line text-muted transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent sm:rounded-lg"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-current transition-transform duration-300 group-hover:scale-110">
                <Plus size={20} aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold max-sm:text-xs">Add a film</span>
            </button>
          </li>
        )}
      </PosterGrid>
    </>
  );
}

/** Films the member rated 8 or higher, each opening the post that says so. */
export function RecommendsGrid({ userId, name, self }: { userId: number; name?: string; self: boolean }) {
  const recommendations = useRecommendations(userId);
  const list = useMemo(
    () => recommendations.data?.pages.flatMap((page) => page.data) ?? [],
    [recommendations.data],
  );
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = recommendations;
  const sentinel = useInfiniteSentinel(
    () => void (!isFetchingNextPage && !isError && fetchNextPage()),
    !!hasNextPage,
  );

  if (recommendations.isPending) return <PosterGridSkeleton />;
  if (isError && !list.length)
    return <QueryError error={recommendations.error} retry={() => recommendations.refetch()} />;
  if (!list.length)
    return (
      <GridEmpty
        icon={<Star size={26} strokeWidth={1.5} aria-hidden="true" />}
        title={self ? "Nothing recommended yet" : "No recommendations yet"}
        body={
          self
            ? "Rate a film 8 or higher in a post and it lands here."
            : `Films ${name ?? "they"} rate 8 or higher show up here.`
        }
      />
    );

  return (
    <>
      <PosterGrid label={self ? "Films you recommend" : `Films ${name ?? "they"} recommends`}>
        {list.map((item, i) => (
          <PosterTile
            key={item.id}
            index={i}
            href={postHref(item.id)}
            title={item.movie.title}
            poster={item.movie.poster_path}
            caption={verdict(item.rating)}
            corner={
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums shadow-[0_4px_14px_rgb(0_0_0_/_30%)] sm:text-[13px] ${tone(item.rating).badge}`}
              >
                <Star size={12} className="fill-current" aria-hidden="true" />
                <span className="sr-only">Rated </span>
                {formatRating(item.rating)}
              </span>
            }
          />
        ))}
      </PosterGrid>
      <div ref={sentinel} className="flex justify-center py-6">
        {isFetchingNextPage && <Spinner size="sm" />}
        {!isFetchingNextPage && isError && hasNextPage && (
          <button type="button" onClick={() => fetchNextPage()} className="text-sm font-semibold text-accent">
            Try again
          </button>
        )}
      </div>
    </>
  );
}
