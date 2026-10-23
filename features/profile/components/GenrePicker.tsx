"use client";
import clsx from "clsx";
import { Check } from "lucide-react";
import { useGenres } from "@/hooks/queries/useMe";
import { MAX_FAVORITE_GENRES } from "@/types/user";

export default function GenrePicker({
  selected,
  onChange,
  disabled,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const genres = useGenres();
  const toggle = (id: string) =>
    onChange(
      selected.includes(id)
        ? selected.filter((value) => value !== id)
        : selected.length < MAX_FAVORITE_GENRES
          ? [...selected, id]
          : selected,
    );
  return (
    <section aria-labelledby="genres-label">
      <div className="flex items-baseline justify-between">
        <h2 id="genres-label" className="text-base font-semibold">
          Favorite genres
        </h2>
        <span className="text-sm tabular-nums text-muted" aria-live="polite">
          {selected.length}/{MAX_FAVORITE_GENRES}
        </span>
      </div>
      {genres.isPending ? (
        <div className="mt-3 flex flex-wrap gap-2" aria-hidden="true">
          {[72, 96, 64, 110, 84, 70, 92, 60].map((width, index) => (
            <span key={index} className="h-9 animate-pulse rounded-full bg-surface" style={{ width }} />
          ))}
        </div>
      ) : genres.isError ? (
        <p className="mt-3 text-sm text-muted">
          Genres are unavailable right now.{" "}
          <button type="button" className="text-accent underline-offset-2 hover:underline" onClick={() => genres.refetch()}>
            Try again
          </button>
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-labelledby="genres-label">
          {genres.data.map((genre) => {
            const active = selected.includes(genre.id);
            const full = !active && selected.length >= MAX_FAVORITE_GENRES;
            return (
              <button
                key={genre.id}
                type="button"
                aria-pressed={active}
                disabled={disabled || full}
                onClick={() => toggle(genre.id)}
                className={clsx(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed",
                  active
                    ? "border-ink bg-ink text-canvas"
                    : "border-line bg-surface text-ink hover:border-ink/40",
                  full && "opacity-40",
                )}
              >
                {active && <Check size={14} strokeWidth={2.5} aria-hidden="true" />}
                {genre.name}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
