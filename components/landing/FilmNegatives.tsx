"use client";

import { useEffect, useRef, useState } from "react";
import { onLandingRevealed } from "./landing-ready";
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
  // The Truman Show: the bow on the stairs before the exit door.
  ["truman-show"],
];
const STRIP_COUNT = 2;

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

  // The backdrop is decoration, so it waits for the loading screen to lift
  // and for the browser to go idle; the wordmark gets the network and GPU first.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let scene: FilmNegativesScene | undefined;
    const controller = new AbortController();
    scenesRef.current ??= pickScenes();
    const scenes = scenesRef.current;

    const start = () => {
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
    };

    let cancelIdle = () => {};
    const stopWaiting = onLandingRevealed(() => {
      if (controller.signal.aborted) return;
      if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(start, { timeout: 1500 });
        cancelIdle = () => window.cancelIdleCallback(id);
      } else {
        const id = setTimeout(start, 300);
        cancelIdle = () => clearTimeout(id);
      }
    });

    return () => {
      controller.abort();
      stopWaiting();
      cancelIdle();
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
