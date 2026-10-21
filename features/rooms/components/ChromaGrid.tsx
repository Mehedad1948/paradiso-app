"use client";
import { useRef, type ReactNode } from "react";

// Spotlight grid (after reactbits ChromaGrid): everything is desaturated
// except a circle around the pointer, and each card glows in its own colour.
export default function ChromaGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const root = ref.current;
    if (!root) return;
    const box = root.getBoundingClientRect();
    root.style.setProperty("--chroma-x", `${e.clientX - box.left}px`);
    root.style.setProperty("--chroma-y", `${e.clientY - box.top}px`);
    root.style.setProperty("--chroma-on", "1");
    for (const card of Array.from(root.children) as HTMLElement[]) {
      if (!card.classList.contains("chroma-card")) continue;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    }
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => ref.current?.style.setProperty("--chroma-on", "0")}
      className={`chroma-grid relative ${className}`}
    >
      {children}
      <div aria-hidden="true" className="chroma-overlay" />
    </div>
  );
}
