"use client";
import clsx from "clsx";
import { Star, X } from "lucide-react";
import ElasticSlider from "@/components/ui/ElasticSlider";
import { roundRating } from "@/lib/community/validation";
import { ratingHue } from "@/features/rooms/lib/ratingColor";
import { formatRating, verdict } from "../format";

/** 0–10 in tenths, on the same elastic slider rooms use for rating a film. */
export default function RatingInput({
  value,
  onChange,
  onRemove,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  /** Shown as a remove button when the rating is optional. */
  onRemove?: () => void;
  disabled?: boolean;
}) {
  const perfect = value >= 10;
  return (
    <div className="rounded-[10px] border border-line bg-surface/60 px-4 pb-4 pt-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Your rating</p>
          <div className="flex items-baseline gap-1.5">
            <span
              aria-live="polite"
              className={clsx("text-4xl font-semibold tabular-nums tracking-[-0.06em]", perfect && "rate-gold-text")}
            >
              {formatRating(value)}
            </span>
            <span className="text-base text-muted">/ 10</span>
          </div>
        </div>
        <div className="flex items-center gap-1 pb-1">
          <span
            className={clsx(
              "text-sm font-semibold uppercase tracking-[0.09em]",
              perfect ? "rate-gold-text" : "text-muted",
            )}
          >
            {verdict(value)}
          </span>
          {onRemove && (
            <button
              type="button"
              disabled={disabled}
              onClick={onRemove}
              aria-label="Remove rating"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-50"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <ElasticSlider
        className={clsx("mt-4 !w-full", perfect && "rate-gold")}
        value={value}
        onChange={(next) => onChange(roundRating(next))}
        startingValue={0}
        maxValue={10}
        isStepped
        stepSize={0.1}
        ticks
        valuePosition="bubble"
        thickness={14}
        activeThickness={22}
        restOpacity={0.85}
        maxStretch={40}
        rangeColor={
          perfect
            ? "linear-gradient(100deg, #b8860b, #ffd700 30%, #fff6c2 50%, #ffd700 70%, #b8860b)"
            : `hsl(${ratingHue(value)} 80% 55%)`
        }
        iconPlacement="inside"
        leftIcon={<Star size={16} aria-hidden="true" />}
        rightIcon={<Star size={16} className="fill-current" aria-hidden="true" />}
        disabled={disabled}
        ariaLabel="Your rating"
      />
    </div>
  );
}
