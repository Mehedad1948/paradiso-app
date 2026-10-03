"use client";

import { useState, type CSSProperties } from "react";
import { posters } from "@/config/posters";

const letters = [
  {
    letter: "P",
    image: posters.vertigo,
    position: "35%",
    tilt: "-5deg",
    lift: "-12px",
  },
  {
    letter: "A",
    image: posters.arrival,
    position: "20%",
    tilt: "4deg",
    lift: "8px",
  },
  {
    letter: "R",
    image: posters.fellowship,
    position: "65%",
    tilt: "-3deg",
    lift: "-8px",
  },
  {
    letter: "A",
    image: posters.dune,
    position: "75%",
    tilt: "5deg",
    lift: "-16px",
  },
  {
    letter: "D",
    image: posters.livesOfOthers,
    position: "50%",
    tilt: "-4deg",
    lift: "10px",
  },
  {
    letter: "I",
    image: posters.vertigo,
    position: "45%",
    tilt: "7deg",
    lift: "-14px",
  },
  {
    letter: "S",
    image: posters.fellowship,
    position: "75%",
    tilt: "-5deg",
    lift: "-6px",
  },
  {
    letter: "O",
    image: posters.arrival,
    position: "60%",
    tilt: "4deg",
    lift: "-12px",
  },
];

export default function ParadisoWordmark() {
  const [selected, setSelected] = useState<number | null>(0);

  return (
    <div
      className="flex flex-wrap items-start justify-start overflow-visible px-3 pb-6 pt-4.5 font-[Arial,Helvetica,sans-serif] text-[min(24.8vw,calc((100svh-190px)/2.32),430px)] font-extrabold leading-none tracking-normal max-sm:px-1.5 max-sm:pb-6 max-sm:pt-4 max-[480px]:text-[min(24.8vw,calc((100svh-220px)/2.32),430px)]"
      role="group"
      aria-label="Interactive Paradiso lettering"
    >
      {letters.map(({ letter, image, position, tilt, lift }, index) => (
        <button
          key={index}
          type="button"
          className="group relative block shrink-0 cursor-pointer touch-manipulation overflow-visible bg-transparent px-[0.015em] py-[0.08em] text-center text-ink transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] [transform:translateY(0)] focus-visible:z-[1] focus-visible:rounded-sm focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-accent focus-visible:[transform:translateY(var(--lift))_rotate(var(--tilt))_scale(1.035)] aria-pressed:z-[1] aria-pressed:[transform:translateY(var(--lift))_rotate(var(--tilt))_scale(1.035)] hover:z-[1] hover:[transform:translateY(var(--lift))_rotate(var(--tilt))_scale(1.035)] motion-reduce:transform-none motion-reduce:transition-none [&:nth-child(6)]:text-accent"
          aria-label={`Reveal cinematic artwork in letter ${letter}, ${index + 1} of 8`}
          aria-pressed={selected === index}
          onClick={() => setSelected(selected === index ? null : index)}
          style={
            {
              "--letter-image": `url("${image}")`,
              "--image-position": position,
              "--tilt": tilt,
              "--lift": lift,
            } as CSSProperties
          }
        >
          <span className="block transition-opacity duration-300 group-hover:opacity-0 group-focus-visible:opacity-0 group-aria-pressed:opacity-0 motion-reduce:transition-none" aria-hidden="true">
            {letter}
          </span>
          <span className="absolute inset-0 bg-[image:var(--letter-image)] bg-[length:auto_130%] bg-[position:var(--image-position)_45%] bg-clip-text px-[0.015em] py-[0.08em] text-transparent opacity-0 transition-[opacity,background-position] duration-[350ms] group-hover:bg-[position:var(--image-position)_65%] group-hover:opacity-100 group-focus-visible:bg-[position:var(--image-position)_65%] group-focus-visible:opacity-100 group-aria-pressed:bg-[position:var(--image-position)_65%] group-aria-pressed:opacity-100 motion-reduce:transition-none" aria-hidden="true">
            {letter}
          </span>
        </button>
      ))}
    </div>
  );
}
