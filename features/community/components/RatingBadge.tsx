import clsx from "clsx";
import { StarIcon } from "@solar-icons/react/linear";
import { formatRating, tone, verdict } from "../format";

/** The personal score as a colored pill: star, number, verdict. */
export default function RatingBadge({
  value,
  size = "md",
  className,
}: {
  value: number;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={`Rated ${formatRating(value)} out of 10, ${verdict(value)}`}
      className={clsx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold shadow-[0_6px_20px_rgb(0_0_0_/_30%)]",
        tone(value).badge,
        size === "lg" ? "px-4 py-2 text-base" : "px-3 py-1.5 text-sm",
        className,
      )}
    >
      <StarIcon size={size === "lg" ? 17 : 15} className="fill-current" aria-hidden="true" />
      <span className="tabular-nums">{formatRating(value)}</span>
      <span className="font-medium opacity-80">/10</span>
      <span aria-hidden="true" className={clsx("border-l border-white/40 pl-1.5 font-medium", size === "md" && "max-[420px]:hidden")}>
        {verdict(value)}
      </span>
    </span>
  );
}
