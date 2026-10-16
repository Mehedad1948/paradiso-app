"use client";

import { useEffect, useRef, useState } from "react";
import type { FilmNegativesScene, FilmScene } from "./film-negatives-scene";

// Sixteen near-consecutive frames per scene, pre-graded and packed 4x4.
// Each movie lists one or more scenes; a strip shows one movie.
const MOVIES: string[][] = [
  // 2001: A Space Odyssey: the bone thrown skyward, cut to the satellite.
  ["space-odyssey"],
  // The Matrix: the bullet dodge.
  ["matrix"],
  // Pulp Fiction: the twist contest.
  ["pulp-fiction"],
  // Inception: Cobb spins the top.
  ["inception"],
];
const STRIP_COUNT = 3;

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

// A fresh line-up on every load: STRIP_COUNT different movies, one scene each.
function pickScenes(): FilmScene[] {
  const movies = [...MOVIES];
  for (let i = movies.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [movies[i], movies[j]] = [movies[j], movies[i]];
  }
  return movies.slice(0, STRIP_COUNT).map((scenes) => ({
    src: `/frames/scenes/${pick(scenes)}.webp`,
    frames: 16,
    columns: 4,
  }));
}

/** Strips of film negative threading behind the landing page. */
export default function FilmNegatives() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Picked once per mount, so React's development re-run of the effect
  // reuses the same line-up instead of downloading a second one.
  const scenesRef = useRef<FilmScene[] | null>(null);
  const [ready, setReady] = useState(false);

  // Three.js loads after the page renders so it stays off the critical path.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let scene: FilmNegativesScene | undefined;
    const controller = new AbortController();
    scenesRef.current ??= pickScenes();
    const scenes = scenesRef.current;

    import("./film-negatives-scene")
      .then(({ createFilmNegativesScene }) =>
        createFilmNegativesScene(canvas, scenes, controller.signal),
      )
      .then((created) => {
        if (controller.signal.aborted) return created.dispose();
        scene = created;
        setReady(true);
      })
      .catch(() => {
        // The page reads fine without its backdrop.
      });

    return () => {
      controller.abort();
      scene?.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 h-full w-full transition-opacity duration-[1600ms] ${ready ? "opacity-100" : "opacity-0"}`}
    />
  );
}
