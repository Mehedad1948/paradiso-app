"use client";
import { useEffect, useRef } from "react";
import { Spinner } from "@heroui/spinner";
export default function InfiniteScrollSentinel({
  hasMore,
  loading,
  onLoadMore,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const load = useRef(onLoadMore);
  load.current = onLoadMore;
  useEffect(() => {
    const node = ref.current;
    if (!node || !hasMore || loading) return;
    // Re-created after every page, so a short list that still fills the viewport keeps loading.
    const observer = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && load.current(),
      { rootMargin: "1600px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading]);
  if (!hasMore && !loading) return null;
  return (
    <div ref={ref} className="flex h-16 items-center justify-center">
      {loading && <Spinner size="sm" aria-label="Loading more movies" />}
    </div>
  );
}
