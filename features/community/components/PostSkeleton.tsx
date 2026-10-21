/** Placeholder with the real card's proportions, so content lands without a jump. */
export default function PostSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-3.5 px-5 py-5 sm:px-6 motion-safe:[&_span]:animate-pulse">
      <span className="h-11 w-11 rounded-full bg-surface" />
      <div className="min-w-0">
        <span className="block h-4 w-40 rounded bg-surface" />
        <span className="mt-3 block h-3.5 w-full rounded bg-surface" />
        <span className="mt-2 block h-3.5 w-4/5 rounded bg-surface" />
        <span className="mt-3 flex h-[clamp(320px,48vw,460px)] rounded-2xl bg-surface" />
      </div>
    </div>
  );
}
