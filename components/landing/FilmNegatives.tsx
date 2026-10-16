"use client";

import { useEffect, useRef, useState } from "react";
import type { FilmNegativesScene } from "./film-negatives-scene";

// Sixteen sequential frames from each of two Cinema Paradiso shots (Toto in
// the cinema at 0:19:30, and studying a frame by lamplight at 0:14:57),
// pre-graded and packed 4x4. The strips take turns with them.
const SHOTS = ["/frames/cinema-sequence.webp", "/frames/lamp-sequence.webp"];

/** Strips of film negative threading behind the landing page. */
export default function FilmNegatives() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  // Three.js loads after the page renders so it stays off the critical path.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let scene: FilmNegativesScene | undefined;
    const controller = new AbortController();

    import("./film-negatives-scene")
      .then(({ createFilmNegativesScene }) =>
        createFilmNegativesScene(canvas, SHOTS, controller.signal),
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
      className={`pointer-events-none fixed inset-0 -z-10 h-full w-full transition-opacity duration-[1600ms] ${ready ? "opacity-45 dark:opacity-35" : "opacity-0"}`}
    />
  );
}
