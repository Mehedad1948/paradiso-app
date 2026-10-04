"use client";

import { useState, type CSSProperties } from "react";
import { landingPosters } from "@/config/posters";

const letters = [
  { letter: "P", image: landingPosters[0].image, position: "35%" },
  { letter: "A", image: landingPosters[1].image, position: "20%" },
  { letter: "R", image: landingPosters[2].image, position: "65%" },
  { letter: "A", image: landingPosters[3].image, position: "75%" },
  { letter: "D", image: landingPosters[4].image, position: "50%" },
  { letter: "I", image: landingPosters[0].image, position: "45%" },
  { letter: "S", image: landingPosters[2].image, position: "75%" },
  { letter: "O", image: landingPosters[1].image, position: "60%" },
];

export default function ParadisoWordmark() {
  const [selected, setSelected] = useState<number | null>(null);

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
          aria-pressed={selected === index}
          onClick={() => setSelected(selected === index ? null : index)}
          style={{
            "--letter-image": `url("${image}")`,
            "--image-position": position,
          } as CSSProperties}
        >
          <span
            className="block transition-opacity duration-[700ms] ease-[ease] group-hover:opacity-0 group-hover:duration-[350ms] group-focus-visible:opacity-0 group-focus-visible:duration-[350ms] group-aria-[pressed=true]:opacity-0 group-aria-[pressed=true]:duration-[350ms] motion-reduce:transition-none"
            aria-hidden="true"
          >
            {letter}
          </span>
          <span
            className="absolute inset-0 [padding:inherit] bg-[image:var(--letter-image)] [background-size:auto_130%] [background-position:var(--image-position)_45%] bg-clip-text text-transparent opacity-0 transition-[opacity,background-position] duration-[700ms,900ms] ease-[ease] group-hover:[background-position:var(--image-position)_65%] group-hover:opacity-100 group-hover:duration-[350ms,900ms] group-focus-visible:[background-position:var(--image-position)_65%] group-focus-visible:opacity-100 group-focus-visible:duration-[350ms,900ms] group-aria-[pressed=true]:[background-position:var(--image-position)_65%] group-aria-[pressed=true]:opacity-100 group-aria-[pressed=true]:duration-[350ms,900ms] motion-reduce:transition-none"
            aria-hidden="true"
          >
            {letter}
          </span>
        </button>
      ))}
    </div>
  );
}
