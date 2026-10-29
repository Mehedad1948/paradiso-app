"use client";
import { useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { Plus, Trash2 } from "lucide-react";
import QueryError from "@/components/ui/QueryError";
import { useAdminLandingGrid, useSaveLandingGrid } from "@/hooks/queries/useCurationQueries";
import { GRID_SLOTS, gridCells } from "@/lib/curations/grid";
import type { AdminLandingGrid, CuratedMovie, LandingGridItemInput } from "@/types/curations";
import {
  MoviePicker,
  PageTitle,
  Panel,
  SaveBar,
  Thumb,
  imageSrc,
  useSaveShortcut,
  useUnsavedGuard,
  year,
} from "./shared";

type Cell = { movie: CuratedMovie; imageUrl: string | null; objectPosition: string | null };
type Draft = (Cell | undefined)[];

/** Where each slot sits in the stepped grid; slots are numbered row-major. */
const FRAME = gridCells(null).map(({ slot, row, column }) => ({ slot, row, column }));

const toDraft = (grid: AdminLandingGrid): Draft => {
  const draft: Draft = Array.from({ length: GRID_SLOTS }, () => undefined);
  for (const item of grid.data) {
    if (item.slot < GRID_SLOTS)
      draft[item.slot] = { movie: item.movie, imageUrl: item.imageUrl, objectPosition: item.objectPosition };
  }
  return draft;
};

const toItems = (draft: Draft): LandingGridItemInput[] =>
  draft.flatMap((cell, slot) =>
    cell ? [{ slot, movieId: cell.movie.id, imageUrl: cell.imageUrl, objectPosition: cell.objectPosition }] : [],
  );

/** What the cell shows: the override image (a site path or https URL) or the film's poster. */
const cellImage = (cell: Cell, size: "w185" | "w342" = "w342") => cell.imageUrl || imageSrc(cell.movie.poster_path, size);

/** The vertical focus of "center 35%"; anything else the admin typed counts as the middle. */
const focusOf = (position: string | null) => {
  const match = position?.match(/^center (\d{1,3})%$/);
  return match ? Math.min(100, Number(match[1])) : 50;
};

/** The next empty slot after `from`, wrapping round; the following slot when none is empty. */
const nextSlot = (draft: Draft, from: number) => {
  for (let step = 1; step <= GRID_SLOTS; step += 1) {
    const slot = (from + step) % GRID_SLOTS;
    if (!draft[slot]) return slot;
  }
  return (from + 1) % GRID_SLOTS;
};

/** The same rule as the backend: an https URL or a site path, never a protocol-relative one. */
const badImage = (cell: Cell | undefined) =>
  !!cell?.imageUrl && !/^https:\/\//i.test(cell.imageUrl) && !/^\/(?!\/)/.test(cell.imageUrl);

/** The slot one step away on the drawn grid, for the arrow keys. */
function neighbour(from: number, key: string) {
  const here = FRAME[from];
  if (key === "ArrowLeft") return Math.max(0, from - 1);
  if (key === "ArrowRight") return Math.min(GRID_SLOTS - 1, from + 1);
  const rowStep = key === "ArrowUp" ? -1 : 1;
  const candidates = FRAME.filter((cell) => cell.row === here.row + rowStep);
  if (!candidates.length) return from;
  return candidates.reduce((best, cell) =>
    Math.abs(cell.column - here.column) < Math.abs(best.column - here.column) ? cell : best,
  ).slot;
}

export default function LandingGridEditor() {
  const query = useAdminLandingGrid();
  if (query.isPending)
    return <Spinner className="p-8" aria-label="Loading the grid" />;
  if (query.error || !query.data) return <QueryError error={query.error ?? new Error("Could not load the grid.")} retry={() => query.refetch()} />;
  // A fresh save has a new timestamp: the editor restarts from what the server stored.
  return <Editor key={query.data.updatedAt} grid={query.data} />;
}

function Editor({ grid }: { grid: AdminLandingGrid }) {
  const initial = useMemo(() => toDraft(grid), [grid]);
  const [draft, setDraft] = useState<Draft>(initial);
  const [selected, setSelected] = useState(() => Math.max(0, initial.findIndex((cell) => !cell)));
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const save = useSaveLandingGrid({
    onSuccess: () => addToast({ title: "Landing grid saved", color: "success" }),
  });

  const slot = selected;
  const cell = draft[slot];
  const filled = draft.filter(Boolean).length;
  const dirty = JSON.stringify(toItems(draft)) !== JSON.stringify(toItems(initial));
  useUnsavedGuard(dirty);
  const submit = () => dirty && !save.isPending && !draft.some(badImage) && save.execute(toItems(draft));
  useSaveShortcut(submit, dirty);

  const update = (index: number, next: Cell | undefined) =>
    setDraft((current) => current.map((value, i) => (i === index ? next : value)));
  const patch = (changes: Partial<Cell>) => cell && update(slot, { ...cell, ...changes });
  const swap = (from: number, to: number) => {
    if (from === to) return;
    setDraft((current) => {
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
    setSelected(to);
  };
  const assign = (movie: CuratedMovie) => {
    const next = draft.map((value, i) => (i === slot ? { movie, imageUrl: null, objectPosition: null } : value));
    setDraft(next);
    // Straight on to the next empty frame, so a whole grid can be filled by typing.
    setSelected(nextSlot(next, slot));
  };
  const clearAll = () => {
    if (filled && window.confirm("Empty every slot? Nothing is saved until you press Save.")) setDraft(initial.map(() => undefined));
  };

  const imageProblem = badImage(cell) ? "Use an https:// link or a path that starts with a single /." : undefined;
  const badSlot = draft.findIndex(badImage);

  return (
    <>
      <PageTitle title="Landing grid">
        The 27 frames on the home page. Pick a frame, then type a title and press Enter: the next empty frame is
        selected for you. Drag frames to swap them. Saving replaces the whole grid.
      </PageTitle>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel
          title="Frames"
          hint={grid.updatedBy ? `Last saved by ${grid.updatedBy.username}` : "Seeded list"}
        >
          <div
            className="mx-auto grid max-w-3xl grid-cols-6 gap-1.5 sm:gap-2"
            role="grid"
            aria-label="Landing grid frames"
          >
            {FRAME.map(({ slot: index, row, column }) => {
              const item = draft[index];
              const src = item ? cellImage(item) : null;
              return (
                <button
                  key={index}
                  type="button"
                  role="gridcell"
                  aria-selected={index === slot}
                  aria-label={item ? `Slot ${index + 1}: ${item.movie.title}` : `Slot ${index + 1}: empty`}
                  draggable={!!item}
                  onClick={() => setSelected(index)}
                  onDragStart={() => setDragging(index)}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setOver(index);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragging !== null) swap(dragging, index);
                    setDragging(null);
                    setOver(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key.startsWith("Arrow")) {
                      event.preventDefault();
                      const target = neighbour(index, event.key);
                      setSelected(target);
                      (event.currentTarget.parentElement?.children[target] as HTMLElement | undefined)?.focus();
                    } else if ((event.key === "Delete" || event.key === "Backspace") && item) {
                      event.preventDefault();
                      update(index, undefined);
                    }
                  }}
                  style={{ gridRow: row, gridColumn: column }}
                  className={`group relative aspect-[3/4] overflow-hidden rounded-lg border-2 outline-none transition ${
                    index === slot ? "border-primary ring-2 ring-primary/40" : "border-line hover:border-muted"
                  } ${over === index && dragging !== index ? "scale-95 border-primary" : ""} ${dragging === index ? "opacity-40" : ""} ${
                    item ? "" : "border-dashed bg-surface/40"
                  }`}
                >
                  {item ? (
                    <Thumb src={src} alt="" className="h-full w-full" position={item.objectPosition} />
                  ) : (
                    <Plus size={18} className="mx-auto text-muted" aria-hidden />
                  )}
                  <span className="absolute left-1 top-1 rounded bg-black/65 px-1 text-xs font-medium text-white">
                    {index + 1}
                  </span>
                  {item ? (
                    <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1 pb-1 pt-4 text-left text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      {item.movie.title}
                    </span>
                  ) : null}
                  {item && !src ? (
                    <span className="absolute inset-0 grid place-items-center bg-surface p-1 text-center text-xs text-muted">
                      No image · {item.movie.title}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            Arrow keys move between frames · Delete empties a frame · Drag to swap
          </p>
        </Panel>

        <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <Panel title={`Frame ${slot + 1}`} hint={cell ? "Edit" : "Empty"}>
            {cell ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Thumb src={imageSrc(cell.movie.poster_path, "w92")} alt="" className="h-16 w-11 shrink-0 rounded" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{cell.movie.title}</p>
                    <p className="text-sm text-muted">
                      {year(cell.movie.release_date) || "Unknown year"}
                      {cell.movie.poster_path ? "" : " · no poster"}
                    </p>
                  </div>
                  <Button
                    isIconOnly
                    size="md"
                    variant="flat"
                    color="danger"
                    aria-label="Empty this frame"
                    onPress={() => update(slot, undefined)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
                <Input
                  size="md"
                  label="Image override"
                  labelPlacement="outside"
                  placeholder="Empty shows the poster"
                  value={cell.imageUrl ?? ""}
                  onValueChange={(value) => patch({ imageUrl: value.trim() ? value : null })}
                  isInvalid={!!imageProblem}
                  errorMessage={imageProblem}
                  description="An https:// link or a site path like /posters/x.jpg."
                  maxLength={2048}
                />
                <label className="flex flex-col gap-2 text-sm">
                  <span className="flex items-center justify-between">
                    <span>Vertical focus</span>
                    <span className="text-muted">{cell.objectPosition ?? "center"}</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={focusOf(cell.objectPosition)}
                    onChange={(event) => patch({ objectPosition: `center ${event.target.value}%` })}
                    className="w-full accent-[hsl(var(--heroui-primary-500))]"
                    aria-label="Vertical focus of the image"
                  />
                  <span className="flex gap-2">
                    {[
                      ["Top", 0],
                      ["Middle", 50],
                      ["Bottom", 100],
                    ].map(([label, value]) => (
                      <Button
                        key={label}
                        size="md"
                        variant="flat"
                        className="h-9 min-w-0 flex-1 text-sm"
                        onPress={() => patch({ objectPosition: value === 50 ? null : `center ${value}%` })}
                      >
                        {label}
                      </Button>
                    ))}
                  </span>
                </label>
              </div>
            ) : (
              <p className="text-sm text-muted">Search below to put a film in this frame.</p>
            )}
          </Panel>
          <Panel title={cell ? "Replace the film" : "Choose a film"}>
            <MoviePicker key={slot} autoFocus onPick={assign} />
          </Panel>
        </div>
      </div>
      <SaveBar
        dirty={dirty}
        saving={save.isPending}
        onSave={submit}
        onDiscard={() => setDraft(initial)}
        summary={`${filled} of ${GRID_SLOTS} frames filled`}
        problem={badSlot >= 0 ? `Fix the image link of frame ${badSlot + 1}` : undefined}
      />
      <div className="mt-3 flex justify-end">
        <Button size="md" variant="light" color="danger" onPress={clearAll} isDisabled={!filled}>
          Empty the whole grid
        </Button>
      </div>
    </>
  );
}
