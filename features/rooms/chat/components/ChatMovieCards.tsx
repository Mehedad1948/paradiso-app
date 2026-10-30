"use client";
import { useState } from "react";
import clsx from "clsx";
import { Button } from "@heroui/button";
import { addToast } from "@/components/ui/toast";
import { AddIcon, CheckIcon, TicketIcon } from "@solar-icons/react/linear";
import { useAddMovie } from "@/hooks/queries/useRoomQueries";
import { BffError } from "@/lib/api/client";
import type { ChatMovieCard } from "@/types/chat";
import MovieLink from "@/features/movies/MovieLink";
import MoviePoster from "../../components/MoviePoster";
import { useChat } from "../ChatContext";

function MovieCard({ movie }: { movie: ChatMovieCard }) {
  const { roomId, showInWatchlist } = useChat();
  const [added, setAdded] = useState(false);
  const { execute, isPending } = useAddMovie(roomId, {
    onSuccess: () => {
      setAdded(true);
      addToast({ title: `${movie.title} is on the watchlist`, color: "success" });
    },
    onError: (error) => {
      if (error instanceof BffError && error.status === 409) {
        setAdded(true);
        addToast({ title: "This movie is already in the room", color: "default" });
      } else addToast({ title: error.message, color: "danger" });
    },
  });
  const inRoom = !!movie.movieId || added;
  const poster = (
    <MoviePoster
      path={movie.posterPath}
      title={movie.title}
      size="w92"
      width={56}
      height={84}
      className="h-[84px] w-14 shrink-0"
    />
  );
  // Films already in the room have details to open.
  const preview = movie.movieId ? { id: movie.movieId, title: movie.title, poster_path: movie.posterPath } : null;
  return (
    // A ticket stub: poster, perforation, then the details.
    <div className="relative flex w-[340px] max-w-full overflow-hidden rounded-lg border border-line bg-surface text-ink">
      {preview ? (
        <MovieLink movie={preview} aria-label={`${movie.title} details`} className="shrink-0 transition-opacity hover:opacity-85">
          {poster}
        </MovieLink>
      ) : (
        poster
      )}
      <span
        aria-hidden="true"
        className="relative w-0 border-l border-dashed border-line before:absolute before:-left-[7px] before:-top-[7px] before:size-3.5 before:rounded-full before:border before:border-line before:bg-elevated after:absolute after:-bottom-[7px] after:-left-[7px] after:size-3.5 after:rounded-full after:border after:border-line after:bg-elevated"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0">
          <p className="line-clamp-2 text-[15px] font-semibold leading-tight">
            {preview ? (
              <MovieLink movie={preview} className="underline-offset-4 hover:underline">
                {movie.title}
              </MovieLink>
            ) : (
              movie.title
            )}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {movie.year || "Year unknown"}
            <span aria-hidden="true"> · </span>
            {inRoom ? "On the watchlist" : "From TMDb"}
          </p>
        </div>
        {movie.movieId ? (
          <button
            type="button"
            onClick={() => showInWatchlist(movie.title)}
            className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-accent underline-offset-4 hover:underline"
          >
            <TicketIcon size={15} aria-hidden="true" /> See it in the room
          </button>
        ) : movie.tmdbId ? (
          <Button
            size="sm"
            className={clsx(
              "h-7 w-fit min-w-0 rounded-md px-2.5 text-sm font-semibold",
              added ? "bg-success/15 text-success" : "bg-ink text-canvas",
            )}
            startContent={
              added ? <CheckIcon size={14} aria-hidden="true" /> : <AddIcon size={14} aria-hidden="true" />
            }
            isLoading={isPending}
            isDisabled={added}
            onPress={() => execute({ roomId, dbId: movie.tmdbId! })}
          >
            {added ? "Added" : "Add to room"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function ChatMovieCards({
  movies,
  mine,
}: {
  movies: ChatMovieCard[];
  mine: boolean;
}) {
  if (!movies.length) return null;
  return (
    <div className={clsx("mt-1.5 flex w-full flex-col gap-2", mine && "items-end")}>
      {movies.map((movie, index) => (
        <MovieCard key={`${movie.movieId ?? movie.tmdbId ?? movie.title}-${index}`} movie={movie} />
      ))}
    </div>
  );
}
