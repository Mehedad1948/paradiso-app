"use client";
import { useRef, type ReactNode } from "react";

// Edge glow that leans toward the pointer (after reactbits BorderGlow): a lit
// border wedge plus a soft outer glow, both pointing at the cursor and fading
// with its distance from the edges. Colour comes from the --glow variable.
export default function BorderGlow({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - r.left - r.width / 2;
    const dy = e.clientY - r.top - r.height / 2;
    // 0 at the centre, 1 at the edge; only the last stretch lights up.
    const edge = Math.max(Math.abs(dx) / (r.width / 2), Math.abs(dy) / (r.height / 2));
    const prox = Math.min(1, Math.max(0, (edge - 0.55) / 0.35));
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    el.style.setProperty("--bg-angle", `${deg}deg`);
    el.style.setProperty("--bg-prox", String(prox));
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => ref.current?.style.setProperty("--bg-prox", "0")}
      className={`border-glow ${className}`}
    >
      <span aria-hidden="true" className="border-glow-halo">
        <span />
      </span>
      <span aria-hidden="true" className="border-glow-ring">
        <span />
      </span>
      {children}
    </div>
  );
}
