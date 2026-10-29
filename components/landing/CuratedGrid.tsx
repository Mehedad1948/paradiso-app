import { gridCells } from "@/lib/curations/grid";
import { landingGrid } from "@/services/curations";
import CinemaGrid from "./CinemaGrid";

/** Bare frames: what the grid looks like before any art is revealed, so it holds the space. */
const frames = gridCells([]);

/** The admin-curated poster grid. */
export default async function CuratedGrid() {
  return <CinemaGrid cells={gridCells(await landingGrid())} />;
}

export function CuratedGridFallback() {
  return <CinemaGrid cells={frames} />;
}
