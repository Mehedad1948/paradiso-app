"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Toast from "./Toast";
import { getServerSnapshot, getSnapshot, subscribe } from "./store";
import styles from "./toast.module.css";

/**
 * Mount once. The empty container doubles as a persistent live region (screen readers miss
 * announcements from regions inserted together with their text), and it is the only thing that
 * exists until the first toast fires.
 */
export default function ToastViewport() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ref = useRef<HTMLDivElement>(null);

  // A toast that expires while its tab is in the background would never be seen: freeze every fuse.
  useEffect(() => {
    const sync = () => ref.current?.toggleAttribute("data-hidden", document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return (
    // data-react-aria-top-layer: HeroUI modals treat a press on a toast as inside the dialog, so
    // acting on a toast never closes the dialog behind it.
    <div
      ref={ref}
      className={styles.viewport}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-relevant="additions"
      data-react-aria-top-layer="true"
    >
      {toasts.map((item) => (
        <Toast key={item.id} item={item} />
      ))}
    </div>
  );
}
