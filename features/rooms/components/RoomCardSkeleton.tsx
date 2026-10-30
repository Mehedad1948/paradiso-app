/** Placeholder with the real room card's proportions, so content lands without a jump. */
export default function RoomCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-[10px] border border-line bg-elevated motion-safe:[&_span]:animate-pulse"
    >
      <span className="block aspect-[16/10] w-full bg-surface" />
      <div className="flex items-center justify-between gap-4 p-5">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <span className="block h-3.5 w-28 rounded bg-surface" />
          <span className="block h-5 w-3/4 rounded bg-surface" />
        </div>
        <span className="block h-[46px] w-24 shrink-0 rounded-md bg-surface" />
      </div>
    </div>
  );
}
