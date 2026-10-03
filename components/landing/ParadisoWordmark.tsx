"use client";

import { useState, type CSSProperties } from "react";
import { landingPosters } from "@/config/posters";
import styles from "./CinemaHero.module.css";

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
    <div className={styles.wordmark} role="group" aria-label="Interactive Paradiso lettering">
      {letters.map(({ letter, image, position }, index) => (
        <button
          key={index}
          type="button"
          className={styles.letter}
          aria-label={`Reveal cinematic artwork in letter ${letter}, ${index + 1} of 8`}
          aria-pressed={selected === index}
          onClick={() => setSelected(selected === index ? null : index)}
          style={{
            "--letter-image": `url("${image}")`,
            "--image-position": position,
          } as CSSProperties}
        >
          <span className={styles.letterInk} aria-hidden="true">{letter}</span>
          <span className={styles.letterArtwork} aria-hidden="true">{letter}</span>
        </button>
      ))}
    </div>
  );
}
