"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { EyeClosedIcon, EyeIcon } from "@solar-icons/react/linear";

const RevealContext = createContext<{ revealed: boolean; toggle: () => void } | null>(null);

/**
 * Owns the "show ratings I have not earned yet" switch. The masking itself is CSS
 * keyed on `data-reveal` here, and `children` keeps its element identity across
 * toggles, so flipping it re-renders only this wrapper and the toggle button.
 */
export function RatingRevealScope({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <RevealContext value={{ revealed, toggle: () => setRevealed((value) => !value) }}>
      <div className="rating-table" data-reveal={revealed}>
        {children}
      </div>
    </RevealContext>
  );
}

export function RevealToggle() {
  const reveal = useContext(RevealContext);
  if (!reveal) return null;
  const { revealed, toggle } = reveal;
  return (
    <button
      type="button"
      aria-pressed={revealed}
      onClick={toggle}
      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-sm font-semibold text-muted transition-colors hover:border-ink/30 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      {revealed ? (
        <EyeIcon size={15} aria-hidden="true" />
      ) : (
        <EyeClosedIcon size={15} aria-hidden="true" />
      )}
      {revealed ? "Hide unrated ratings" : "Show unrated ratings"}
    </button>
  );
}
