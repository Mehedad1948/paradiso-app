"use client";
import { useMemo, useState, type ReactNode } from "react";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Popcorn, SearchIcon, X } from "lucide-react";
import { useDebounce } from "use-debounce";
import { useMovieSearch, useRoom } from "@/hooks/queries/useRoomQueries";
import { useResolveMovie } from "@/hooks/queries/useCommunityQueries";
import type { ResolvedMovie } from "@/types/community";
import type { Viewer } from "../hooks/useViewer";
import { imageSrc } from "../format";

type Local = { id: string; title: string; poster_path: string | null; detail: string };

function Thumb({ path }: { path: string | null }) {
  const src = imageSrc(path, "w185");
  return src ? (
    <img src={src} alt="" loading="lazy" className="h-[54px] w-9 shrink-0 rounded object-cover" />
  ) : (
    <span aria-hidden="true" className="flex h-[54px] w-9 shrink-0 items-center justify-center rounded bg-media text-media-foreground/60">
      <Popcorn size={15} />
    </span>
  );
}

function Row({
  title,
  detail,
  poster,
  busy,
  disabled,
  onSelect,
}: {
  title: string;
  detail: string;
  poster: string | null;
  busy?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface focus-visible:bg-surface disabled:opacity-50"
    >
      <Thumb path={poster} />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 text-[15px] font-semibold">{title}</span>
        <span className="block text-sm text-muted">{detail}</span>
      </span>
      {busy && <Spinner size="sm" />}
    </button>
  );
}

const Heading = ({ children }: { children: ReactNode }) => (
  <p className="flex items-center gap-2 px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
    {children}
  </p>
);

/**
 * Local films are picked by id straight away; a TMDb pick is first saved to
 * the library so the post can reference its local id.
 */
export default function FilmPicker({
  roomId,
  viewer,
  value,
  onChange,
  locked = false,
  disabled = false,
}: {
  roomId?: number;
  viewer: Viewer;
  value: ResolvedMovie | null;
  onChange: (movie: ResolvedMovie | null) => void;
  /** Editing: the film can't change. */
  locked?: boolean;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [debounced] = useDebounce(query, 350);
  const [resolving, setResolving] = useState<number | null>(null);
  const room = useRoom(roomId ? String(roomId) : "");
  const search = useMovieSearch(debounced, !value);
  const resolve = useResolveMovie();
  const term = query.trim().toLowerCase();

  const local = useMemo(() => {
    const seen = new Set<string>();
    const films: Local[] = [];
    const add = (film: Local) => {
      if (seen.has(film.id)) return;
      seen.add(film.id);
      films.push(film);
    };
    room.data?.movies.forEach((movie) =>
      add({ ...movie, detail: `On the ${room.data!.name} watchlist` }),
    );
    viewer.rooms.forEach((item) =>
      item.movies.forEach((movie) =>
        add({ id: movie.id, title: movie.title, poster_path: null, detail: `From ${item.name}` }),
      ),
    );
    return films;
  }, [room.data, viewer.rooms]);
  const localMatches = (term ? local.filter((film) => film.title.toLowerCase().includes(term)) : local).slice(0, term ? 8 : 5);
  const tmdb = (search.data?.results ?? []).slice(0, 8);

  if (value)
    return (
      <div className="flex items-center gap-3 rounded-[10px] border border-line bg-surface/60 p-2.5">
        <Thumb path={value.poster_path} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">About</p>
          <p className="line-clamp-1 text-lg font-semibold leading-tight">{value.title}</p>
        </div>
        {!locked && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(null)}
            aria-label="Choose a different film"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-50"
          >
            <X size={18} />
          </button>
        )}
      </div>
    );

  return (
    <div>
      <Input
        autoFocus
        aria-label="Search for a film"
        placeholder="Which film is it about?"
        value={query}
        onValueChange={setQuery}
        isDisabled={disabled}
        classNames={{ inputWrapper: "min-h-[48px] border border-line bg-surface shadow-none", input: "text-base" }}
        startContent={<SearchIcon size={19} className="text-default-400" />}
        endContent={search.isFetching && <Spinner size="sm" />}
      />
      <div className="mt-2 max-h-[300px] overflow-y-auto overscroll-contain">
        {localMatches.length > 0 && (
          <>
            <Heading>{roomId && room.data ? "From the watchlist" : "From your rooms"}</Heading>
            {localMatches.map((film) => (
              <Row
                key={film.id}
                title={film.title}
                detail={film.detail}
                poster={film.poster_path}
                disabled={disabled || resolving !== null}
                onSelect={() => onChange({ id: film.id, title: film.title, poster_path: film.poster_path, dbId: null })}
              />
            ))}
          </>
        )}
        {term.length >= 2 && debounced.trim().length >= 2 && (
          <>
            <Heading>From TMDb</Heading>
            {tmdb.map((movie) => (
              <Row
                key={movie.id}
                title={movie.title}
                detail={movie.release_date?.slice(0, 4) || "TMDb"}
                poster={movie.poster_path ?? null}
                busy={resolving === movie.id}
                disabled={disabled || resolving !== null}
                onSelect={() => {
                  setResolving(movie.id);
                  resolve.mutate(movie.id, {
                    onSuccess: onChange,
                    onSettled: () => setResolving(null),
                  });
                }}
              />
            ))}
            {search.isSuccess && !search.isFetching && tmdb.length === 0 && (
              <p className="px-2 py-3 text-sm text-muted">Nothing on TMDb for &ldquo;{query.trim()}&rdquo;.</p>
            )}
            {search.isError && <p className="px-2 py-3 text-sm text-danger">{search.error.message}</p>}
          </>
        )}
        {!localMatches.length && term.length < 2 && (
          <p className="px-2 py-3 text-sm text-muted">Start typing a title to search every film on TMDb.</p>
        )}
      </div>
    </div>
  );
}
