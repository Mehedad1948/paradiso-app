"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { FeaturedArtist } from "@/types/featured";
import ArtistCard from "./ArtistCard";

// The stack's engine stays out of the landing bundle until the section is near.
const CardSwap = dynamic(() => import("./CardSwap"), { ssr: false });

const CARD = { width: 360, height: 500 };
const STACK = { cardDistance: 0, verticalDistance: 42, depth: 100, skewAmount: 0, visibleCards: 4 };
// The stage CardSwap draws for the sizes above, so the space is held before the engine loads.
const RATIO = "424 / 608";

/**
 * Today's artist on top of a tower of the days before. Drag or fling the front card away, or
 * click one behind it, to bring an earlier day forward. It never advances on its own: the card
 * on top should be today's until someone chooses otherwise.
 */
export default function ArtistStack({ artists }: { artists: FeaturedArtist[] }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [front, setFront] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setNear(true);
      },
      { rootMargin: "500px 0px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="relative mx-auto w-full max-w-[424px]" style={{ aspectRatio: RATIO }}>
      {near && (
        <CardSwap
          {...CARD}
          {...STACK}
          autoplay={false}
          cardRadius={20}
          dim={0.55}
          bounce={0.3}
          label="The featured artist of the day and the days before. Use the arrow keys to browse."
          onChange={setFront}
        >
          {artists.map((artist, index) => (
            <ArtistCard key={artist.date} artist={artist} active={index === front} eager={index < STACK.visibleCards} />
          ))}
        </CardSwap>
      )}
      <p className="sr-only" aria-live="polite">
        {near ? `Showing ${artists[front]?.person.name}` : ""}
      </p>
    </div>
  );
}
