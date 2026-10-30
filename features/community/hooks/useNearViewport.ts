"use client";
import { useEffect, useRef, useState } from "react";

// One observer for every card; a feed can hold hundreds.
const callbacks = new WeakMap<Element, () => void>();
let observer: IntersectionObserver | null = null;

function watch(element: Element, onNear: () => void) {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        callbacks.get(entry.target)?.();
        callbacks.delete(entry.target);
        observer!.unobserve(entry.target);
      }
    },
    { rootMargin: "600px 0px" },
  );
  callbacks.set(element, onNear);
  observer.observe(element);
  return () => {
    callbacks.delete(element);
    observer?.unobserve(element);
  };
}

/** Turns true once the element comes within a screen or so of the viewport, and stays true. */
export function useNearViewport<T extends Element>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (near || !element) return;
    return watch(element, () => setNear(true));
  }, [near]);
  return [ref, near] as const;
}
