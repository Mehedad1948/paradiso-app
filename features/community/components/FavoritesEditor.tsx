"use client";
import { useState } from "react";
import { Button } from "@heroui/button";
import clsx from "clsx";
import { AnimatePresence, motion, Reorder, useDragControls } from "framer-motion";
import { GripVertical, MessageSquareQuote, Popcorn, X } from "lucide-react";
import Sidebar, { useSidebar } from "@/components/ui/Sidebar";
import { normalizeNote, useSetFavorites } from "@/hooks/queries/useFavoriteQueries";
import { MAX_FAVORITE_MOVIES, type FavoriteMovie } from "@/types/community";
import type { Viewer } from "../hooks/useViewer";
import { imageSrc } from "../format";
import FilmPicker from "./FilmPicker";
import { NoteCounter, NoteInput } from "./FavoriteNote";

type Film = { id: string; title: string; poster_path: string | null; year?: string };

const filmOf = ({ movie }: FavoriteMovie): Film => ({
  id: movie.id,
  title: movie.title,
  poster_path: movie.poster_path,
  year: movie.release_date?.slice(0, 4),
});

const EASE = [0.22, 1, 0.36, 1] as const;
const reveal = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.28, ease: EASE },
};

function Row({
  film,
  rank,
  note,
  onNote,
  onMove,
  onRemove,
  disabled,
}: {
  film: Film;
  rank: number;
  note: string;
  onNote: (note: string) => void;
  onMove: (step: -1 | 1) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const controls = useDragControls();
  const src = imageSrc(film.poster_path, "w185");
  const [open, setOpen] = useState(false);
  const written = note.trim();
  return (
    <Reorder.Item
      value={film}
      dragListener={false}
      dragControls={controls}
      className="relative select-none rounded-lg border border-line bg-elevated"
      whileDrag={{ scale: 1.02, boxShadow: "0 18px 40px rgb(0 0 0 / 22%)", zIndex: 1 }}
    >
      <div className="flex items-center gap-3 p-2 pr-2.5">
        <button
          type="button"
          aria-label={`Move ${film.title}. Use the arrow keys to reorder.`}
          disabled={disabled}
          onPointerDown={(event) => controls.start(event)}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
              event.preventDefault();
              onMove(event.key === "ArrowUp" ? -1 : 1);
            }
          }}
          className="flex h-9 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted transition-colors hover:text-ink active:cursor-grabbing"
        >
          <GripVertical size={17} aria-hidden="true" />
        </button>
        <span className="w-5 shrink-0 text-center text-sm font-semibold tabular-nums text-accent">{rank}</span>
        {src ? (
          <img src={src} alt="" loading="lazy" className="h-[60px] w-10 shrink-0 rounded object-cover" />
        ) : (
          <span aria-hidden="true" className="flex h-[60px] w-10 shrink-0 items-center justify-center rounded bg-media text-media-foreground/60">
            <Popcorn size={15} />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-[15px] font-semibold leading-snug">{film.title}</span>
          {film.year && <span className="block text-sm text-muted">{film.year}</span>}
        </span>
        <button
          type="button"
          aria-label={written ? `Edit note on ${film.title}` : `Add a note to ${film.title}`}
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen((value) => !value)}
          className={clsx(
            "relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface",
            open || written ? "text-accent" : "text-muted hover:text-ink",
            open && "bg-accent/10",
          )}
        >
          <MessageSquareQuote size={17} aria-hidden="true" />
          {written && !open && (
            <span aria-hidden="true" className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-elevated" />
          )}
        </button>
        <button
          type="button"
          aria-label={`Remove ${film.title}`}
          disabled={disabled}
          onClick={onRemove}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-danger"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div key="edit" {...reveal} className="overflow-hidden">
            <div className="px-2.5 pb-2.5">
              <NoteInput
                autoFocus
                title={film.title}
                value={note}
                onChange={onNote}
                disabled={disabled}
                onSubmit={() => setOpen(false)}
                onCancel={() => setOpen(false)}
              />
              <div className="mt-1.5 flex items-center justify-between gap-3 pl-1">
                <span className="text-xs text-muted">Public · shown on your profile</span>
                <div className="flex items-center gap-2">
                  {written && (
                    <button
                      type="button"
                      onClick={() => onNote("")}
                      className="rounded-full px-2 py-1 text-xs font-semibold text-muted transition-colors hover:text-danger"
                    >
                      Clear
                    </button>
                  )}
                  <NoteCounter length={note.length} />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          written && (
            <motion.button
              key="preview"
              type="button"
              {...reveal}
              disabled={disabled}
              onClick={() => setOpen(true)}
              aria-label={`Edit note on ${film.title}`}
              className="group block w-full overflow-hidden text-left"
            >
              <span className="mx-2.5 mb-2.5 line-clamp-2 border-l-2 border-accent/50 pl-2.5 text-sm italic leading-relaxed text-muted transition-colors group-hover:text-ink">
                {written}
              </span>
            </motion.button>
          )
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

/** Pick, order, annotate and trim the films on your profile, then save it all at once. */
export default function FavoritesEditor({
  viewer,
  favorites,
  onClose,
}: {
  viewer: Viewer;
  favorites: FavoriteMovie[];
  onClose: () => void;
}) {
  const sidebar = useSidebar(onClose);
  const save = useSetFavorites(viewer.me!.id);
  const [films, setFilms] = useState(() => favorites.map(filmOf));
  // Kept apart from `films` so typing never hands Reorder new item identities.
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(favorites.map((item) => [item.movie.id, item.note ?? ""])),
  );
  // Remounts the picker after each pick so it opens blank for the next film.
  const [picks, setPicks] = useState(0);
  const full = films.length >= MAX_FAVORITE_MOVIES;
  const stored = new Map(favorites.map((item) => [item.movie.id, item.note]));
  // Only notes that differ from what's saved go out.
  const noteChanges: Record<string, string | null> = {};
  for (const film of films) {
    const note = normalizeNote(notes[film.id]);
    if (note !== (stored.get(film.id) ?? null)) noteChanges[film.id] = note;
  }
  const changed =
    films.length !== favorites.length ||
    films.some((film, i) => film.id !== favorites[i].movie.id) ||
    Object.keys(noteChanges).length > 0;
  const busy = save.isPending;

  const move = (from: number, step: -1 | 1) => {
    const to = from + step;
    if (to < 0 || to >= films.length) return;
    const next = [...films];
    [next[from], next[to]] = [next[to], next[from]];
    setFilms(next);
  };

  return (
    <Sidebar
      ref={sidebar.ref}
      title="Favorite films"
      description={`Up to ${MAX_FAVORITE_MOVIES} films, in the order you love them. Drag to reorder, and add a note to say why.`}
      onClose={onClose}
      busy={busy}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="text-sm tabular-nums text-muted">
            {films.length} / {MAX_FAVORITE_MOVIES}
          </span>
          <div className="flex gap-2">
            <Button variant="light" onPress={sidebar.close} isDisabled={busy} className="rounded-md font-semibold">
              Cancel
            </Button>
            <Button
              isDisabled={!changed}
              isLoading={busy}
              onPress={() =>
                save.mutate(
                  { movieIds: films.map((film) => film.id), notes: noteChanges },
                  { onSuccess: sidebar.close },
                )
              }
              className="rounded-md bg-ink font-semibold text-canvas"
            >
              Save
            </Button>
          </div>
        </div>
      }
    >
      {full ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-3 text-sm text-muted">
          Your shelf is full. Remove a film to make room for another.
        </p>
      ) : (
        <FilmPicker
          key={picks}
          viewer={viewer}
          value={null}
          disabled={busy}
          onChange={(movie) => {
            if (!movie) return;
            setFilms((list) =>
              list.some((film) => film.id === movie.id) || list.length >= MAX_FAVORITE_MOVIES
                ? list
                : [...list, { id: movie.id, title: movie.title, poster_path: movie.poster_path }],
            );
            setPicks((count) => count + 1);
          }}
        />
      )}

      <div className="mt-6">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Your shelf</p>
        {films.length ? (
          <Reorder.Group axis="y" values={films} onReorder={setFilms} className="flex flex-col gap-2">
            {films.map((film, i) => (
              <Row
                key={film.id}
                film={film}
                rank={i + 1}
                note={notes[film.id] ?? ""}
                onNote={(note) => setNotes((all) => ({ ...all, [film.id]: note }))}
                disabled={busy}
                onMove={(step) => move(i, step)}
                onRemove={() => setFilms((list) => list.filter((item) => item.id !== film.id))}
              />
            ))}
          </Reorder.Group>
        ) : (
          <p className="py-6 text-center text-sm text-muted">Search above to add your first favorite.</p>
        )}
      </div>
    </Sidebar>
  );
}
