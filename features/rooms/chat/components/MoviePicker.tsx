"use client";
import { useMemo, useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { CheckIcon, MagnifierIcon } from "@solar-icons/react/linear";
import { useDebounce } from "use-debounce";
import { useMovieSearch } from "@/hooks/queries/useRoomQueries";
import type { ChatMovieMention } from "@/types/chat";
import MoviePoster from "../../components/MoviePoster";
import { useChat } from "../ChatContext";

export type Attachment = {
  key: string;
  mention: ChatMovieMention;
  title: string;
  posterPath: string | null;
};

function Row({
  title,
  detail,
  posterPath,
  selected,
  disabled,
  onSelect,
}: {
  title: string;
  detail: string;
  posterPath: string | null;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled && !selected}
      aria-pressed={selected}
      className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface disabled:opacity-40"
    >
      <MoviePoster path={posterPath} size="w92" width={28} height={42} className="h-[42px] w-7 shrink-0 rounded" />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 text-[15px] font-medium">{title}</span>
        <span className="block text-xs text-muted">{detail}</span>
      </span>
      {selected && <CheckIcon size={16} className="shrink-0 text-accent" aria-label="Attached" />}
    </button>
  );
}

/** Attach room movies, or any TMDb title, as cards on the next message. */
export default function MoviePicker({
  selected,
  max,
  onToggle,
  children,
}: {
  selected: Attachment[];
  max: number;
  onToggle: (attachment: Attachment) => void;
  children: ReactNode;
}) {
  const { roomMovies } = useChat();
  const [query, setQuery] = useState("");
  const [debounced] = useDebounce(query, 400);
  const search = useMovieSearch(debounced);
  const keys = new Set(selected.map((item) => item.key));
  const full = selected.length >= max;
  const term = query.trim().toLowerCase();
  const inRoom = useMemo(
    () =>
      Array.from(roomMovies.values())
        .filter((movie) => movie.title.toLowerCase().includes(term))
        .slice(0, term ? 20 : 6),
    [roomMovies, term],
  );
  const tmdb = (search.data?.results ?? []).slice(0, 8);

  return (
    <Popover
      placement="top-start"
      offset={10}
      onOpenChange={(open) => !open && setQuery("")}
      classNames={{
        content: "rounded-[10px] border border-line bg-elevated p-0 text-ink shadow-[0_18px_50px_rgb(0_0_0_/_18%)]",
      }}
    >
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent aria-label="Share a film">
        <div className="flex w-[min(340px,calc(100vw-32px))] flex-col">
          <div className="border-b border-line p-3">
            <p className="mb-2 text-sm font-semibold">Share a film {full && <span className="font-normal text-muted">· {max} max</span>}</p>
            <Input
              autoFocus
              size="sm"
              aria-label="Search films"
              placeholder="Search the room or TMDb..."
              value={query}
              onValueChange={setQuery}
              classNames={{ inputWrapper: "border border-line bg-surface shadow-none", input: "text-[15px]" }}
              startContent={<MagnifierIcon size={16} className="text-default-400" />}
            />
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {inRoom.length > 0 && (
              <>
                <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">In this room</p>
                {inRoom.map((movie) => (
                  <Row
                    key={movie.id}
                    title={movie.title}
                    detail="On the watchlist"
                    posterPath={movie.poster_path ?? null}
                    selected={keys.has(`room:${movie.id}`)}
                    disabled={full}
                    onSelect={() =>
                      onToggle({
                        key: `room:${movie.id}`,
                        mention: { movieId: movie.id },
                        title: movie.title,
                        posterPath: movie.poster_path ?? null,
                      })
                    }
                  />
                ))}
              </>
            )}
            {term.length >= 2 && (
              <>
                <p className="flex items-center gap-2 px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
                  From TMDb {search.isFetching && <Spinner size="sm" />}
                </p>
                {tmdb.map((movie) => (
                  <Row
                    key={movie.id}
                    title={movie.title}
                    detail={movie.release_date?.slice(0, 4) || "TMDb"}
                    posterPath={movie.poster_path ?? null}
                    selected={keys.has(`tmdb:${movie.id}`)}
                    disabled={full}
                    onSelect={() =>
                      onToggle({
                        key: `tmdb:${movie.id}`,
                        mention: { tmdbId: movie.id },
                        title: movie.title,
                        posterPath: movie.poster_path ?? null,
                      })
                    }
                  />
                ))}
                {search.isSuccess && !search.isFetching && tmdb.length === 0 && (
                  <p className="px-2 py-3 text-sm text-muted">No TMDb results for &ldquo;{query.trim()}&rdquo;.</p>
                )}
                {search.isError && <p className="px-2 py-3 text-sm text-danger">{search.error.message}</p>}
              </>
            )}
            {!inRoom.length && term.length < 2 && (
              <p className="px-2 py-3 text-sm text-muted">Type a title to search TMDb.</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
