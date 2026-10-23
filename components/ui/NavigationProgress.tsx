"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NAVIGATION_START_EVENT } from "@/lib/navigation-events";

type Phase = "idle" | "loading" | "done";

// Never hang at the top forever if a navigation is aborted or silently fails.
const SAFETY_TIMEOUT_MS = 10_000;
// Shortest time the bar stays up, so instant (prefetched) navigations still show.
const MIN_VISIBLE_MS = 450;

function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const phaseRef = useRef<Phase>("idle");
  const trickle = useRef<ReturnType<typeof setInterval>>(undefined);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    clearInterval(trickle.current);
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const setBoth = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const startedAt = useRef(0);

  const complete = () => {
    clearTimers();
    setProgress(1);
    setBoth("done");
    timers.current.push(
      setTimeout(() => {
        setBoth("idle");
        setProgress(0);
      }, 700),
    );
  };

  const finish = () => {
    if (phaseRef.current !== "loading") return;
    // Prefetched routes commit almost instantly; keep the reel on screen long
    // enough to be seen instead of starting and ending in the same frame.
    const remaining = MIN_VISIBLE_MS - (performance.now() - startedAt.current);
    if (remaining <= 0) return complete();
    setProgress((p) => Math.max(p, 0.6));
    clearInterval(trickle.current);
    timers.current.push(setTimeout(complete, remaining));
  };

  const start = (url: string) => {
    const target = new URL(url, window.location.href);
    const same =
      target.origin === window.location.origin &&
      target.pathname === window.location.pathname &&
      target.search === window.location.search;
    if (same || phaseRef.current === "loading") return;

    clearTimers();
    startedAt.current = performance.now();
    setProgress(0.12);
    setBoth("loading");
    // Ease toward 92% — fast at first, slower the longer the page takes.
    trickle.current = setInterval(() => {
      setProgress((p) => Math.min(0.92, p + (0.92 - p) * 0.09 + 0.004));
    }, 180);
    timers.current.push(setTimeout(complete, SAFETY_TIMEOUT_MS));
  };

  const startRef = useRef(start);
  startRef.current = start;

  useEffect(() => {
    const onStart = (e: Event) => startRef.current((e as CustomEvent<string>).detail);

    // Internal <a>/<Link> clicks — covers navigations even before the
    // instrumentation hook is picked up (it only loads on dev-server start).
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.origin !== window.location.origin) return;
      startRef.current(anchor.href);
    };

    window.addEventListener(NAVIGATION_START_EVENT, onStart);
    // Capture phase: next/link calls preventDefault before a bubble listener runs.
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener(NAVIGATION_START_EVENT, onStart);
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
  }, []);

  // The new route has committed — complete the reel.
  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => {
    finishRef.current();
  }, [routeKey]);

  return (
    <div
      aria-hidden
      className="nav-progress"
      data-phase={phase}
      style={{ "--nav-progress": progress } as React.CSSProperties}
    >
      <div className="nav-progress-bar">
        <span className="nav-progress-sheen" />
        <span className="nav-progress-head" />
      </div>
      <div className="nav-progress-film" />
    </div>
  );
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
