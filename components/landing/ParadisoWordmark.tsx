"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, SyntheticEvent } from "react";
import { fontDisplay } from "@/config/fonts";
import { gridPosters } from "@/config/posters";
import type { WordmarkScene } from "./wordmark-scene";

type Letter = {
  letter: string;
  image: string;
  position: string;
  // Cut-out collage: heavy grotesk mixed with black italic serif, each letter
  // at its own size (cqi), baseline shift (em), tilt (deg) and overlap (em).
  serif?: boolean;
  size: number;
  y: number;
  rotate: number;
  overlap: number;
};

const rows: Letter[][] = [
  [
    { letter: "P", image: gridPosters.parisTexas.image, position: "35%", size: 32, y: 0.02, rotate: -3, overlap: 0 },
    { letter: "A", image: gridPosters.dune.image, position: "20%", size: 33, y: -0.04, rotate: 2, overlap: -0.05 },
    { letter: "R", image: gridPosters.cinemaParadiso.image, position: "65%", serif: true, size: 32, y: 0.04, rotate: -2, overlap: -0.03 },
    { letter: "A", image: gridPosters.walterMitty.image, position: "75%", size: 31, y: -0.02, rotate: 3, overlap: -0.04 },
  ],
  [
    { letter: "D", image: gridPosters.ilPostino.image, position: "50%", serif: true, size: 32, y: 0, rotate: -2, overlap: 0 },
    { letter: "I", image: gridPosters.divingBell.image, position: "45%", size: 33, y: -0.04, rotate: 4, overlap: 0 },
    { letter: "S", image: gridPosters.trumanShow.image, position: "75%", serif: true, size: 34, y: 0.03, rotate: -3, overlap: -0.03 },
    { letter: "O", image: gridPosters.twelveAngryMen.image, position: "60%", size: 31, y: -0.06, rotate: 2, overlap: -0.03 },
  ],
];
const letters = rows.flat();
const ACCENT_INDEX = 5;

// CSS fallback for reduced motion or when WebGL is unavailable.
function startReveal(event: SyntheticEvent<HTMLButtonElement>) {
  const artwork = event.currentTarget.querySelector<HTMLElement>("[data-letter-artwork]");
  if (!artwork) return;
  if (artwork.getAnimations().some((animation) => animation.playState === "running")) return;

  artwork.classList.remove("animate-cinema-letter-reveal");
  void artwork.offsetWidth;
  artwork.classList.add("animate-cinema-letter-reveal");
}

export default function ParadisoWordmark() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<WordmarkScene | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const controller = new AbortController();
    import("./wordmark-scene")
      .then(({ createWordmarkScene }) =>
        createWordmarkScene(container, canvas, letters, controller.signal),
      )
      .then((scene) => {
        if (controller.signal.aborted) return scene.dispose();
        sceneRef.current = scene;
        setReady(true);
      })
      .catch(() => {
        // Keep the CSS reveal when images or WebGL fail.
      });

    return () => {
      controller.abort();
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Keyboard users get the ripple from the letter itself; pointers are
  // handled inside the scene.
  const pulseFromLetter = (button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    sceneRef.current?.pulseAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  const handleFocus = (event: SyntheticEvent<HTMLButtonElement>) => {
    if (!sceneRef.current) return startReveal(event);
    if (event.currentTarget.matches(":focus-visible")) pulseFromLetter(event.currentTarget);
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!sceneRef.current) return startReveal(event);
    if (event.detail === 0) pulseFromLetter(event.currentTarget);
  };

  return (
    <div
      ref={containerRef}
      className={`${fontDisplay.variable} relative w-full select-none py-[3cqi] [container-type:inline-size]`}
      role="group"
      aria-label="Interactive Paradiso lettering"
    >
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`flex items-end ${rowIndex === 1 ? "-mt-[2cqi] pl-[8cqi]" : ""}`}
        >
          {row.map(({ letter, image, position, serif, size, y, rotate, overlap }, column) => {
            const order = rowIndex * row.length + column;
            return (
              <button
                key={order}
                type="button"
                className={`group relative min-w-0 shrink-0 cursor-pointer touch-manipulation bg-transparent leading-[0.86] focus-visible:z-[1] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${serif ? "font-[family-name:var(--font-display)] font-black italic" : "font-sans font-black"} ${order === ACCENT_INDEX ? "text-accent" : "text-ink"}`}
                aria-label={`Reveal cinematic artwork in letter ${letter}, ${order + 1} of 8`}
                onPointerEnter={ready ? undefined : startReveal}
                onFocus={handleFocus}
                onClick={handleClick}
                style={{
                  fontSize: `${size}cqi`,
                  marginLeft: `${overlap}em`,
                  transform: `translateY(${y}em) rotate(${rotate}deg)`,
                  "--letter-image": `url("${image}")`,
                  "--image-position": position,
                } as CSSProperties}
              >
                <span
                  data-letter-glyph
                  className={`block px-[0.02em] transition-opacity duration-500 ${ready ? "opacity-0" : ""}`}
                  aria-hidden="true"
                >
                  {letter}
                </span>
                {!ready && (
                  <span
                    data-letter-artwork
                    className="absolute inset-0 px-[0.02em] bg-[image:var(--letter-image)] [background-size:auto_130%] [background-position:var(--image-position)_45%] bg-clip-text text-transparent [clip-path:inset(0_100%_0_0)] motion-reduce:group-hover:[clip-path:inset(0_0_0_0)] motion-reduce:group-focus-visible:[clip-path:inset(0_0_0_0)] motion-reduce:animate-none"
                    aria-hidden="true"
                  >
                    {letter}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
