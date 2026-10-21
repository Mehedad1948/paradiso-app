"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const SIZES = "(max-width: 700px) 100vw, 70vw";

export default function JuryReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const topRef = useRef<HTMLImageElement>(null);
  const bottomRef = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const topImg = topRef.current;
    const bottomImg = bottomRef.current;
    if (!container || !canvas || !topImg || !bottomImg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    // This panel sits below the fold: Three.js and the WebGL context are only
    // fetched when it is about to scroll into view.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        import("./jury-scene")
          .then(async ({ loadSource, startJuryReveal }) => {
            const [topSource, bottomSource] = await Promise.all([
              loadSource(topImg),
              loadSource(bottomImg),
            ]);
            if (cancelled) return;
            cleanup = startJuryReveal(container, canvas, topSource, bottomSource);
            setReady(true);
          })
          .catch(() => {
            // Keep the CSS crossfade fallback when images or WebGL fail.
          });
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="group relative min-h-[350px] overflow-hidden bg-media after:pointer-events-none after:absolute after:inset-0 after:bg-gradient-to-b after:from-transparent after:from-40% after:to-black/75 max-sm:min-h-[280px]"
    >
      <div className="absolute inset-0 transition-transform duration-[1200ms] ease-in-out group-hover:scale-[1.04] motion-reduce:transition-none">
        <Image
          ref={bottomRef}
          src="/12-angry.jpg"
          alt=""
          aria-hidden="true"
          fill
          sizes={SIZES}
          className="object-cover object-[center_40%]"
        />
        <Image
          ref={topRef}
          src="/12-angry-men-matched-2.png"
          alt="A scene from 12 Angry Men, with the jury gathered around a table"
          fill
          sizes={SIZES}
          className="object-cover object-[center_40%] transition-opacity duration-700 group-hover:opacity-0 motion-reduce:transition-none"
        />
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
        />
      </div>
    </div>
  );
}
