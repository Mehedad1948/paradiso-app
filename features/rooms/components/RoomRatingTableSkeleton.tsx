const ROWS = 6;

/** Placeholder shaped like the ratings table (poster, title, rating pills), lit by one soft sweep of light. */
export default function RoomRatingTableSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading room movies"
      className="skeleton-sweep relative overflow-hidden rounded-[10px] border border-line bg-elevated/60"
    >
      <span className="sr-only">Loading room movies</span>
      <div aria-hidden="true" className="flex items-center gap-6 border-b border-line px-5 py-4">
        <span className="block h-3 w-16 rounded bg-surface" />
        <span className="ml-auto block h-3 w-14 rounded bg-surface max-sm:hidden" />
        <span className="block h-3 w-14 rounded bg-surface" />
        <span className="block h-3 w-14 rounded bg-surface max-sm:hidden" />
      </div>
      {Array.from({ length: ROWS }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0"
          style={{ opacity: 1 - i * 0.12 }}
        >
          <span className="block h-[72px] w-12 shrink-0 rounded-lg bg-surface" />
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <span className="block h-4 w-2/5 rounded bg-surface max-sm:w-3/5" />
            <span className="block h-3 w-1/4 rounded bg-surface/70" />
          </div>
          <span className="block h-8 w-14 rounded-full bg-surface max-sm:hidden" />
          <span className="block h-8 w-14 rounded-full bg-surface" />
          <span className="block h-8 w-14 rounded-full bg-surface max-sm:hidden" />
        </div>
      ))}
    </div>
  );
}
