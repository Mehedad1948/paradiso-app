"use client";
import type { ReactNode } from "react";

/**
 * A quiet native range input. The track fills from `origin` to the value, so centred
 * adjustments read as "more" or "less" rather than as a level.
 */
export default function RangeSlider({
  label,
  value,
  min,
  max,
  step = 1,
  origin = min,
  onChange,
  disabled,
  start,
  end,
  valueLabel,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  origin?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  start?: ReactNode;
  end?: ReactNode;
  valueLabel?: string;
}) {
  const percent = (amount: number) => ((amount - min) / (max - min)) * 100;
  const from = Math.min(percent(origin), percent(value));
  const to = Math.max(percent(origin), percent(value));
  const fill = "hsl(var(--heroui-foreground))";
  const track = "hsl(var(--heroui-divider))";
  return (
    <div className="flex items-center gap-3 text-muted">
      {start}
      <input
        type="range"
        aria-label={label}
        aria-valuetext={valueLabel}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{
          background: `linear-gradient(to right, ${track} ${from}%, ${fill} ${from}%, ${fill} ${to}%, ${track} ${to}%)`,
        }}
        className="h-[3px] w-full cursor-pointer appearance-none rounded-full outline-none disabled:cursor-not-allowed disabled:opacity-50 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-canvas [&::-moz-range-thumb]:bg-ink [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-canvas [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgb(0_0_0_/_30%)] [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110 focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-accent"
      />
      {end}
    </div>
  );
}
