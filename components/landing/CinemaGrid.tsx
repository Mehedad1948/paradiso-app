"use client";

import Image from "next/image";
import type { SyntheticEvent } from "react";
import { landingPosters } from "@/config/posters";

// A stepped silhouette leaves breathing room beside the lettering.
const rows = [
  [3, 4, 5, 6],
  [2, 3, 4, 5, 6],
  [1, 2, 3, 4, 5, 6],
  [2, 3, 4, 5, 6],
  [3, 4, 5, 6],
  [4, 5, 6],
];
const cells = rows.flatMap((columns, row) =>
  columns.map((column) => ({ row: row + 1, column })),
);

function startReveal(event: SyntheticEvent<HTMLButtonElement>) {
  const artwork = event.currentTarget.querySelector("img");
  const number = event.currentTarget.querySelector("span");
  if (!artwork || !number) return;
  if (artwork.getAnimations().some((animation) => animation.playState === "running")) return;

  artwork.classList.remove("animate-cinema-reveal");
  number.classList.remove("animate-cinema-number");
  // Commit the reset so a new entry after the cycle restarts the animation.
  void artwork.offsetWidth;
  artwork.classList.add("animate-cinema-reveal");
  number.classList.add("animate-cinema-number");
}

export default function CinemaGrid() {
  return (
    <div
      className="grid aspect-square w-[86%] grid-cols-6 grid-rows-6 justify-self-end pl-px pt-px max-[640px]:w-[76%]"
      role="group"
      aria-label="Explore iconic cinema. Hover or focus to reveal a film."
    >
      {cells.map(({ row, column }, index) => {
        const film = landingPosters[index % landingPosters.length];
        return (
          <button
            key={`${row}-${column}`}
            type="button"
            className="group relative -ml-px -mt-px min-h-0 min-w-0 cursor-pointer touch-manipulation overflow-hidden border border-ink/20 bg-transparent focus-visible:z-[1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            style={{ gridRow: row, gridColumn: column }}
            aria-label={`Reveal ${film.title}, frame ${index + 1}`}
            onPointerEnter={startReveal}
            onFocus={startReveal}
          >
            <Image
              src={film.image}
              alt=""
              fill
              sizes="(max-width: 640px) 12vw, 7vw"
              className="-translate-x-full object-cover motion-reduce:group-hover:translate-x-0 motion-reduce:group-focus-visible:translate-x-0 motion-reduce:animate-none"
              style={{ objectPosition: film.position }}
            />
            <span
              className="absolute bottom-[7px] left-2 font-mono text-[9px] leading-none text-ink/30 motion-reduce:group-hover:invisible motion-reduce:group-focus-visible:invisible motion-reduce:animate-none"
              aria-hidden="true"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
