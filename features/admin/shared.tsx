"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { MagnifierIcon } from "@solar-icons/react/linear";
import { useDebounce } from "use-debounce";
import { useImportFilm, useTmdbSearch } from "@/hooks/queries/useAdminQueries";
import { useLibrarySearch } from "@/hooks/queries/useCurationQueries";
import type { CuratedMovie } from "@/types/curations";

const TMDB = process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL || "https://image.tmdb.org/t/p/";

/** A TMDb path at a width, or a full URL as it is. */
export function imageSrc(path: string | null | undefined, size: "w92" | "w185" | "w342" | "w500" = "w185") {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : `${TMDB}${size}${path}`;
}

/** Admin screens show many small remote images and never need next/image's optimizer. */
export function Thumb({
  src,
  alt,
  className = "",
  position,
}: {
  src: string | null;
  alt: string;
  className?: string;
  position?: string | null;
}) {
  if (!src) return <div aria-hidden className={`bg-surface ${className}`} />;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      draggable={false}
      className={`object-cover ${className}`}
      style={position ? { objectPosition: position } : undefined}
    />
  );
}

export function year(date: string | null | undefined) {
  return date ? date.slice(0, 4) : "";
}

/* ------------------------------------------------------------------ unsaved changes */

let dirtyFlag = false;
/** True while an editor holds changes that are not saved; the navigation checks it. */
export const hasUnsavedChanges = () => dirtyFlag;

/** Warns before the tab closes, and tells the admin navigation to confirm, while `dirty`. */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    dirtyFlag = dirty;
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      dirtyFlag = false;
    };
  }, [dirty]);
}

/** Ctrl/Cmd + S runs `save` while it is enabled. */
export function useSaveShortcut(save: () => void, enabled: boolean) {
  const latest = useRef(save);
  useEffect(() => {
    latest.current = save;
  });
  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        latest.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

/** The bar that keeps Save in reach while an editor scrolls. */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onDiscard,
  summary,
  problem,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  summary: ReactNode;
  /** Why saving is not possible right now. */
  problem?: string;
}) {
  return (
    <div className="sticky bottom-3 z-20 mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-elevated/95 p-3 shadow-lg backdrop-blur">
      <div className="min-w-0 flex-1 text-sm">
        <span className="font-medium">{summary}</span>
        <span className={`ml-3 ${dirty ? "text-warning" : "text-muted"}`} role="status">
          {problem ?? (dirty ? "Unsaved changes" : "All changes saved")}
        </span>
      </div>
      <Button size="md" variant="flat" isDisabled={!dirty || saving} onPress={onDiscard}>
        Discard
      </Button>
      <Button
        size="md"
        color="primary"
        isLoading={saving}
        isDisabled={!dirty || !!problem}
        onPress={onSave}
        endContent={<kbd className="hidden rounded bg-black/20 px-1 text-xs sm:inline">Ctrl S</kbd>}
      >
        Save
      </Button>
    </div>
  );
}

export function Panel({ title, hint, children }: { title?: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-elevated p-4">
      {title ? (
        <header className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {hint ? <span className="text-sm text-muted">{hint}</span> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {children ? <p className="mt-1 max-w-3xl text-sm text-muted">{children}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ film picker */

/**
 * Finds a library film by title. Arrow keys move through the results and Enter picks, so a
 * list can be filled without leaving the keyboard. A second tab adds a film from TMDb first.
 */
export function MoviePicker({
  onPick,
  isPicked,
  requirePoster = false,
  autoFocus = false,
}: {
  onPick: (movie: CuratedMovie) => void;
  isPicked?: (id: string) => boolean;
  requirePoster?: boolean;
  autoFocus?: boolean;
}) {
  const [term, setTerm] = useState("");
  const [source, setSource] = useState<"library" | "tmdb">("library");
  const [active, setActive] = useState(0);
  const [debounced] = useDebounce(term, 250);
  const library = useLibrarySearch(debounced);
  const tmdb = useTmdbSearch(debounced, source === "tmdb");
  const importer = useImportFilm({
    onError: (error) => addToast({ title: error.message, color: "danger" }),
  });
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);

  const films: CuratedMovie[] = library.data ?? [];
  const blocked = (film: CuratedMovie) => isPicked?.(film.id) || (requirePoster && !film.poster_path);
  const pick = (film: CuratedMovie) => {
    if (blocked(film)) return;
    onPick(film);
    setTerm("");
    input.current?.focus();
  };

  const importFilm = async (film: { tmdbId: number; title: string; poster_path: string | null; release_date: string | null }) => {
    if (requirePoster && !film.poster_path) return;
    try {
      const { id } = await importer.executeAsync(film.tmdbId);
      pick({ id, dbId: film.tmdbId, title: film.title, poster_path: film.poster_path, release_date: film.release_date });
    } catch {
      /* the error toast already says why */
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (source !== "library" || !films.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, films.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const film = films[Math.min(active, films.length - 1)];
      if (film) pick(film);
    }
  };

  const searching = debounced.trim().length >= 2;
  const loading = source === "library" ? library.isFetching : tmdb.isFetching;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2" role="tablist" aria-label="Where to look">
        {(["library", "tmdb"] as const).map((value) => (
          <Button
            key={value}
            size="md"
            role="tab"
            aria-selected={source === value}
            variant={source === value ? "solid" : "light"}
            color={source === value ? "primary" : "default"}
            onPress={() => setSource(value)}
          >
            {value === "library" ? "In library" : "Add from TMDb"}
          </Button>
        ))}
      </div>
      <Input
        ref={input}
        size="lg"
        value={term}
        onValueChange={(value) => {
          setTerm(value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        placeholder={source === "library" ? "Search the library by title…" : "Search TMDb by title…"}
        aria-label="Film title"
        maxLength={100}
        startContent={<MagnifierIcon size={18} className="text-muted" aria-hidden />}
        endContent={loading ? <Spinner size="sm" /> : null}
        isClearable
        onClear={() => setTerm("")}
      />
      <ul className="flex max-h-[26rem] flex-col gap-2 overflow-y-auto" aria-label="Results">
        {source === "library"
          ? films.map((film, index) => (
              <li key={film.id}>
                <button
                  type="button"
                  disabled={blocked(film)}
                  onClick={() => pick(film)}
                  onMouseMove={() => setActive(index)}
                  className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors disabled:opacity-50 ${
                    index === active && !blocked(film) ? "bg-surface" : "hover:bg-surface/60"
                  }`}
                >
                  <Thumb src={imageSrc(film.poster_path, "w92")} alt="" className="h-14 w-10 shrink-0 rounded" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{film.title}</span>
                    <span className="block text-sm text-muted">{year(film.release_date) || "Unknown year"}</span>
                  </span>
                  {isPicked?.(film.id) ? (
                    <Chip size="md" variant="flat">Added</Chip>
                  ) : requirePoster && !film.poster_path ? (
                    <Chip size="md" variant="flat" color="warning">No poster</Chip>
                  ) : null}
                </button>
              </li>
            ))
          : (tmdb.data ?? []).map((film) => (
              <li key={film.tmdbId}>
                <button
                  type="button"
                  disabled={importer.isPending || (requirePoster && !film.poster_path)}
                  onClick={() => importFilm(film)}
                  className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-surface/60 disabled:opacity-50"
                >
                  <Thumb src={imageSrc(film.poster_path, "w92")} alt="" className="h-14 w-10 shrink-0 rounded" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{film.title}</span>
                    <span className="block text-sm text-muted">{year(film.release_date) || "Unknown year"}</span>
                  </span>
                  <Chip size="md" variant="flat" color="primary">Import</Chip>
                </button>
              </li>
            ))}
      </ul>
      {searching && !loading && source === "library" && !films.length ? (
        <p className="text-sm text-muted">
          Nothing in the library.{" "}
          <button type="button" className="underline" onClick={() => setSource("tmdb")}>
            Look it up on TMDb
          </button>
        </p>
      ) : null}
      {searching && !loading && source === "tmdb" && !(tmdb.data ?? []).length ? (
        <p className="text-sm text-muted">TMDb has nothing for that title.</p>
      ) : null}
      {!searching ? <p className="text-sm text-muted">Type at least two letters.</p> : null}
      {library.error && source === "library" ? <p className="text-sm text-danger">{library.error.message}</p> : null}
    </div>
  );
}
