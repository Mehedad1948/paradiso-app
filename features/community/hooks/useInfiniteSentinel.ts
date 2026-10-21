"use client";
import { useEffect, useRef } from "react";

/** Calls `load` when the returned element scrolls within reach, well before the reader hits the end. */
export function useInfiniteSentinel(load: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef(load);
  latest.current = load;
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    const observer = new IntersectionObserver(
      (entries) => entries.some((entry) => entry.isIntersecting) && latest.current(),
      { rootMargin: "900px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled]);
  return ref;
}
