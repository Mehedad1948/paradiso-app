import imageHosts from "@/config/image-hosts.json";
import { gridPosters } from "@/config/posters";
import type { MoviePreview } from "@/features/movies/preview";
import type { LandingGridItem } from "@/types/curations";

const TMDB = process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL || "https://image.tmdb.org/t/p/";

type PosterKey = keyof typeof gridPosters;

/**
 * The stepped 6x6 grid. Each named cell is one slot, numbered row-major (0..26), which is how the
 * backend stores them; the names are the built-in frames shown while the backend is unreachable.
 * Green and blue flow into purple, red, then yellow.
 */
const layout: (PosterKey | null)[][] = [
  [null, null, "treeOfLife", "wingsOfDesire", "rearWindow", "laLaLand"],
  [null, "divingBell", "oceanHeaven", "walterMitty", "johnWick", "her"],
  ["matrix", "stalker", "parisTexas", "trumanShow", "goodTime", "colorsRed"],
  [null, "treeOfLife", "memento", "livesOfOthers", "vertigo", "amelie"],
  [null, null, "stalag17", "dune", "fantasticMrFox", "killBill"],
  [null, null, null, "taxiDriver", "twelveAngryMen", "fantasticMrFox"],
];

const slots = layout.flatMap((columns, row) =>
  columns.flatMap((poster, column) => (poster ? [{ row: row + 1, column: column + 1, poster }] : [])),
);

export const GRID_SLOTS = slots.length;

export type GridCell = {
  slot: number;
  row: number;
  column: number;
  /** Absent for a slot the admin left empty: the frame stays, without art or a film. */
  art?: { title: string; src: string; position: string; optimizable: boolean };
  /** The library film the frame opens. */
  movie?: MoviePreview;
  /** Built-in frames only: the film to add to the library when it has no library copy at hand. */
  tmdbId?: number;
};

/** True when next/image may optimize `src`: a local file or one of the configured hosts. */
function optimizable(src: string) {
  if (src.startsWith("/")) return true;
  try {
    return (imageHosts as string[]).includes(new URL(src).hostname);
  } catch {
    return false;
  }
}

function posterUrl(path: string) {
  return /^https?:\/\//.test(path) ? path : `${TMDB}w342${path}`;
}

/**
 * The grid's cells from the stored curation, or the built-in frames when there is none (`null`:
 * the backend could not be read). Unknown slots are ignored; a cell without any image stays empty.
 */
export function gridCells(items: readonly LandingGridItem[] | null): GridCell[] {
  if (!items) {
    return slots.map(({ row, column, poster }, slot) => {
      const film = gridPosters[poster];
      return {
        slot,
        row,
        column,
        art: { title: film.title, src: film.image, position: film.position, optimizable: true },
        tmdbId: film.tmdbId,
      };
    });
  }
  const bySlot = new Map(items.map((item) => [item.slot, item]));
  return slots.map(({ row, column }, slot) => {
    const item = bySlot.get(slot);
    const src = item?.imageUrl || (item?.movie.poster_path ? posterUrl(item.movie.poster_path) : null);
    if (!item || !src) return { slot, row, column };
    const { movie } = item;
    return {
      slot,
      row,
      column,
      art: {
        title: movie.title,
        src,
        position: item.objectPosition || "center",
        optimizable: optimizable(src),
      },
      movie: {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
      },
    };
  });
}
