"use client";

import Image from "next/image";
import { useState } from "react";
import { landingPosters } from "@/config/posters";
import styles from "./CinemaHero.module.css";

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

export default function CinemaGrid() {
  const [selected, setSelected] = useState(() => new Set<number>());

  function toggle(index: number) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className={styles.grid} role="group" aria-label="Explore iconic cinema. Hover or focus to reveal a film; tap to keep it visible.">
      {cells.map(({ row, column }, index) => {
        const film = landingPosters[index % landingPosters.length];
        return (
          <button
            key={`${row}-${column}`}
            type="button"
            className={styles.cell}
            style={{ gridRow: row, gridColumn: column }}
            aria-label={`Reveal ${film.title}, frame ${index + 1}`}
            aria-pressed={selected.has(index)}
            onClick={() => toggle(index)}
          >
            <Image
              src={film.image}
              alt=""
              fill
              sizes="(max-width: 640px) 12vw, 7vw"
              className={styles.frameArtwork}
              style={{ objectPosition: film.position }}
            />
            <span className={styles.frameNumber} aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
