"use client";
import { motion, useReducedMotion } from "framer-motion";
import { tone, verdict } from "@/features/community/format";
import { scoreLabel } from "../format";

const RADIUS = 21;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A score out of ten as a ring that fills on arrival, tinted like ratings across the app. */
export default function ScoreRing({ value, source, href }: { value: number; source: string; href?: string | null }) {
  const reduce = useReducedMotion();
  const fill = tone(value).fill;
  const offset = CIRCUMFERENCE * (1 - Math.min(Math.max(value, 0), 10) / 10);
  const body = (
    <>
      <span aria-hidden="true" className="relative grid size-[52px] shrink-0 place-items-center">
        <svg viewBox="0 0 52 52" className="absolute inset-0 -rotate-90">
          <circle cx="26" cy="26" r={RADIUS} fill="none" strokeWidth="4" className="stroke-line" />
          <motion.circle
            cx="26"
            cy="26"
            r={RADIUS}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            stroke={fill}
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: reduce ? offset : CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 5px ${fill}80)` }}
          />
        </svg>
        <span className="text-[15px] font-semibold tabular-nums tracking-[-0.02em]">{scoreLabel(value)}</span>
      </span>
      <span aria-hidden="true" className="flex flex-col leading-tight">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{source}</span>
        <span className="text-sm font-semibold">{verdict(value)}</span>
      </span>
      <span className="sr-only">
        {source} score {scoreLabel(value)} out of 10
      </span>
    </>
  );
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="-m-1.5 flex items-center gap-2.5 rounded-full p-1.5 pr-3 transition-colors hover:bg-surface"
    >
      {body}
    </a>
  ) : (
    <div className="flex items-center gap-2.5">{body}</div>
  );
}
