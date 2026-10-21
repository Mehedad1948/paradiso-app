"use client";
import { useId, type CSSProperties } from "react";
import { roundRating } from "@/lib/community/validation";
import clsx from "clsx";
import { formatRating, tone, verdict } from "../format";

/** 0–10 in tenths: a slider for feel, arrow keys for precision, a verdict for meaning. */
export default function RatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const percent = value * 10;
  return (
    <div className="rounded-[10px] border border-line bg-surface/60 px-4 pb-3.5 pt-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <label htmlFor={id} className="text-sm font-semibold">
            Your rating
          </label>
          <p className={clsx("text-sm font-semibold", tone(value).text)} aria-live="polite">
            {verdict(value)}
          </p>
        </div>
        <output htmlFor={id} className={clsx("font-serif text-[40px] leading-none tracking-[-0.04em] transition-colors", tone(value).text)}>
          {formatRating(value)}
          <span className="ml-1 font-sans text-base tracking-normal text-muted">/10</span>
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={10}
        step={0.1}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(roundRating(Number(event.target.value)))}
        aria-valuetext={`${formatRating(value)} out of 10, ${verdict(value)}`}
        style={{ "--fill": `${percent}%`, "--tone": tone(value).fill } as CSSProperties}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-[linear-gradient(to_right,var(--tone)_var(--fill),hsl(var(--heroui-divider))_var(--fill))] disabled:cursor-not-allowed disabled:opacity-60 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-elevated [&::-moz-range-thumb]:bg-ink [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-elevated [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgb(0_0_0_/_25%)] [&::-webkit-slider-thumb]:transition-transform active:[&::-webkit-slider-thumb]:scale-110"
      />
      <div aria-hidden="true" className="mt-1.5 flex justify-between px-0.5 text-[11px] tabular-nums text-muted">
        {[0, 2, 4, 6, 8, 10].map((mark) => (
          <button
            key={mark}
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => onChange(mark)}
            className="rounded px-1 transition-colors hover:text-ink"
          >
            {mark}
          </button>
        ))}
      </div>
    </div>
  );
}
