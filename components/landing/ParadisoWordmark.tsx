"use client";

import type { CSSProperties, SyntheticEvent } from "react";
import { gridPosters } from "@/config/posters";

const letters = [
  { letter: "P", image: gridPosters.parisTexas.image, position: "35%" },
  { letter: "A", image: gridPosters.dune.image, position: "20%" },
  { letter: "R", image: gridPosters.cinemaParadiso.image, position: "65%" },
  { letter: "A", image: gridPosters.walterMitty.image, position: "75%" },
  { letter: "D", image: gridPosters.ilPostino.image, position: "50%" },
  { letter: "I", image: gridPosters.divingBell.image, position: "45%" },
  { letter: "S", image: gridPosters.trumanShow.image, position: "75%" },
  { letter: "O", image: gridPosters.twelveAngryMen.image, position: "60%" },
];

function startReveal(event: SyntheticEvent<HTMLButtonElement>) {
  const artwork = event.currentTarget.querySelector<HTMLElement>("[data-letter-artwork]");
  if (!artwork) return;
  if (artwork.getAnimations().some((animation) => animation.playState === "running")) return;

  artwork.classList.remove("animate-cinema-letter-reveal");
  void artwork.offsetWidth;
  artwork.classList.add("animate-cinema-letter-reveal");
}

export default function ParadisoWordmark() {
  return (
    <div
      className="grid w-full grid-cols-4 content-center [container-type:inline-size] font-[Arial,Helvetica,sans-serif] font-black leading-[0.95]"
      role="group"
      aria-label="Interactive Paradiso lettering"
    >
      {letters.map(({ letter, image, position }, index) => (
        <button
          key={index}
          type="button"
          className={`group relative min-w-0 cursor-pointer touch-manipulation bg-transparent py-[0.035em] text-[32cqi] [font-weight:inherit] leading-[inherit] focus-visible:z-[1] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${index === 5 ? "text-accent" : "text-ink"}`}
          aria-label={`Reveal cinematic artwork in letter ${letter}, ${index + 1} of 8`}
          onPointerEnter={startReveal}
          onFocus={startReveal}
          onClick={startReveal}
          style={{
            "--letter-image": `url("${image}")`,
            "--image-position": position,
          } as CSSProperties}
        >
          <span
            className="block"
            aria-hidden="true"
          >
            {letter}
          </span>
          <span
            data-letter-artwork
            className="absolute inset-0 [padding:inherit] bg-[image:var(--letter-image)] [background-size:auto_130%] [background-position:var(--image-position)_45%] bg-clip-text text-transparent [clip-path:inset(0_100%_0_0)] motion-reduce:group-hover:[clip-path:inset(0_0_0_0)] motion-reduce:group-focus-visible:[clip-path:inset(0_0_0_0)] motion-reduce:animate-none"
            aria-hidden="true"
          >
            {letter}
          </span>
        </button>
      ))}
    </div>
  );
}
