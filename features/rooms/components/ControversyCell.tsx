const BARS = 5;
/** Real room ratings rarely spread past ~1.5 points, so the meter fills there, not at the 0-10 extreme. */
const FULL_SPREAD = 1.6;

const TIERS = [
  { max: 0.001, label: "Unanimous", tone: "text-success" },
  { max: 0.5, label: "In sync", tone: "text-success" },
  { max: 0.9, label: "Mixed", tone: "text-warning" },
  { max: 1.3, label: "Divided", tone: "text-orange-400" },
  { max: Infinity, label: "Polarizing", tone: "text-danger" },
];

/**
 * How much the room disagrees about a film. The backend sends population variance
 * (squared rating units); the standard deviation reads as "points apart".
 * `null` means fewer than two ratings, which is not the same as agreement.
 */
export default function ControversyCell({ variance }: { variance: number | null }) {
  if (variance == null) {
    return (
      <span
        className="text-muted"
        title="Needs at least 2 ratings in this room"
        aria-label="Not enough ratings yet"
      >
        -
      </span>
    );
  }
  const spread = Math.sqrt(Math.max(0, Number(variance)));
  const tier = TIERS.find((item) => spread < item.max || item.max === Infinity)!;
  const filled = spread === 0 ? 1 : Math.max(1, Math.ceil((spread / FULL_SPREAD) * BARS));
  const hint = `Ratings are about ${spread.toFixed(1)} points apart on average`;
  return (
    <span className="inline-flex items-center gap-2.5" title={hint}>
      <span className={`flex h-[18px] items-end gap-[3px] ${tier.tone}`} aria-hidden="true">
        {Array.from({ length: BARS }, (_, index) => (
          <span
            key={index}
            style={{ height: `${40 + index * 15}%` }}
            className={`w-[3px] rounded-full bg-current transition-opacity ${
              index < filled ? "opacity-100" : "opacity-20"
            }`}
          />
        ))}
      </span>
      <span className="flex flex-col leading-tight">
        <span className={`text-[13px] font-semibold ${tier.tone}`}>{tier.label}</span>
        <span className="text-xs font-normal text-muted">±{spread.toFixed(1)} pts</span>
      </span>
      <span className="sr-only">{hint}</span>
    </span>
  );
}
