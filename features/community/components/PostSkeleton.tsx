/** Placeholder with the real card's proportions, so content lands without a jump. */
export default function PostSkeleton() {
  return (
    <div aria-hidden="true" className="px-3 py-4 sm:px-6 sm:py-5 motion-safe:[&_span]:animate-pulse">
      <div className="flex items-center gap-3">
        <span className="h-11 w-11 shrink-0 rounded-full bg-surface" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="block h-4 w-32 rounded bg-surface" />
          <span className="block h-3.5 w-12 rounded bg-surface" />
        </div>
      </div>
      <div className="mt-2 min-w-0">
        <span className="mt-1.5 block h-4 w-full rounded bg-surface" />
        <span className="mt-2 block h-4 w-4/5 rounded bg-surface" />
        <span className="mt-3 flex h-[clamp(320px,48vw,460px)] rounded-2xl bg-surface" />
      </div>
    </div>
  );
}
