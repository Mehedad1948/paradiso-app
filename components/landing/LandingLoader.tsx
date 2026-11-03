"use client";

import { useEffect, useState } from "react";
import {
  isLandingRevealed,
  markLandingRevealed,
  onLandingReady,
} from "./landing-ready";
import { fontIntertitle, fontLogo } from "@/config/fonts";
import styles from "./LandingLoader.module.css";

// If the scenes never report in (slow network, no WebGL), carry on anyway.
const MAX_WAIT = 8000;
// Even when everything is instant, show the reel long enough to be read.
const MIN_SHOW = 1400;
// "Showtime" holds before the screen dissolves.
const HOLD = 1000;
// The page starts its entrance while the screen is still dissolving.
const REVEAL_LEAD = 200;
const CLEAR = 1000;

type Phase = "loading" | "showtime" | "open" | "gone";

/**
 * Pure-CSS loading screen, server-rendered with the page so it paints before
 * any JavaScript arrives. Once the wordmark is interactive it announces
 * "Showtime", holds a beat, then dissolves into the page.
 */
export default function LandingLoader() {
  // Only the first load plays it; client navigations back here skip it.
  const [phase, setPhase] = useState<Phase>(() => (isLandingRevealed() ? "gone" : "loading"));

  useEffect(() => {
    if (phase === "gone") return;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";

    const shownAt = performance.now();
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      timers.add(window.setTimeout(fn, ms));
    };
    let started = false;

    const play = () => {
      if (started) return;
      started = true;
      setPhase("showtime");
      later(() => {
        setPhase("open");
        root.style.overflow = overflow;
        later(markLandingRevealed, REVEAL_LEAD);
        later(() => setPhase("gone"), CLEAR);
      }, HOLD);
    };

    const unsubscribe = onLandingReady(() =>
      later(play, Math.max(0, MIN_SHOW - (performance.now() - shownAt))),
    );
    later(play, MAX_WAIT);

    return () => {
      unsubscribe();
      timers.forEach((timer) => window.clearTimeout(timer));
      root.style.overflow = overflow;
    };
    // Runs once per mount: the phases drive themselves.
  }, []);

  if (phase === "gone") return null;

  const state = phase === "showtime" ? styles.showtime : phase === "open" ? `${styles.showtime} ${styles.open}` : "";

  return (
    <div
      className={`${fontIntertitle.variable} ${fontLogo.variable} ${styles.loader} ${state}`}
      role="status"
      aria-live="polite"
      aria-busy={phase === "loading"}
    >
      <div className={styles.card} aria-hidden="true" />
      <div className={styles.content}>
        <h2 className={styles.title}>
          <span className={styles.titleLead}>Cinema</span>
          <br />
          Paradiso
        </h2>
        <div className={styles.rule} aria-hidden="true">
          <i />
        </div>
        <div className={styles.captions}>
          <span className={styles.wait}>Loading the reel&hellip;</span>
          <span className={styles.show}>Showtime</span>
        </div>
      </div>
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />
      <i className={styles.scratch} aria-hidden="true" />
      <i className={styles.scratch} style={{ left: "63vw" }} aria-hidden="true" />
    </div>
  );
}
