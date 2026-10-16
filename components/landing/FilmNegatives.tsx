"use client";

import { useEffect, useRef, useState } from "react";
import { gridPosters } from "@/config/posters";
import type { FilmNegativesScene } from "./film-negatives-scene";

// Sixteen light posters for the frames; the heaviest grid files are left out.
const FRAME_POSTERS = [
  gridPosters.amelie,
  gridPosters.wingsOfDesire,
  gridPosters.ilPostino,
  gridPosters.divingBell,
  gridPosters.stalker,
  gridPosters.colorsRed,
  gridPosters.fantasticMrFox,
  gridPosters.johnWick,
  gridPosters.cinemaParadiso,
  gridPosters.killBill,
  gridPosters.taxiDriver,
  gridPosters.twelveAngryMen,
  gridPosters.parisTexas,
  gridPosters.matrix,
  gridPosters.rearWindow,
  gridPosters.vertigo,
].map((poster) => poster.image);

/** Strips of film negative threading behind the landing page. */
export default function FilmNegatives() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  // Three.js loads after the page renders so it stays off the critical path.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let scene: FilmNegativesScene | undefined;
    let cancelled = false;

    import("./film-negatives-scene")
      .then(({ createFilmNegativesScene }) => createFilmNegativesScene(canvas, FRAME_POSTERS))
      .then((created) => {
        if (cancelled) return created.dispose();
        scene = created;
        setReady(true);
      })
      .catch(() => {
        // The page reads fine without its backdrop.
      });

    return () => {
      cancelled = true;
      scene?.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 h-full w-full transition-opacity duration-[1600ms] ${ready ? "opacity-30 dark:opacity-20" : "opacity-0"}`}
    />
  );
}
