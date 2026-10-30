"use client";

import { useEffect } from "react";

const SW_URL = "/sw.js";
/** Background check while the app stays open; installed PWAs can run for days without a reload. */
const POLL_INTERVAL = 30 * 60 * 1000;
/** Minimum gap between checks triggered by refocusing the app or reconnecting. */
const MIN_CHECK_GAP = 5 * 60 * 1000;

/**
 * Registers the service worker in production and keeps it current silently.
 * The worker only caches content-addressed build output, images and the offline page, and pages
 * always come from the network, so a new worker never changes what the user sees. It activates
 * on its own (see sw/service-worker.js) and no "new version" prompt is needed.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;

    if (process.env.NODE_ENV !== "production") {
      // A worker left over from a production run would serve stale dev chunks.
      void sw.getRegistrations().then((registrations) =>
        registrations
          .filter((registration) => registration.active?.scriptURL.endsWith(SW_URL))
          .forEach((registration) => void registration.unregister()),
      );
      return;
    }

    let cancelled = false;
    let lastCheck = Date.now();
    let registration: ServiceWorkerRegistration | undefined;

    const checkForUpdate = (force = false) => {
      if (!registration || !navigator.onLine) return;
      if (!force && Date.now() - lastCheck < MIN_CHECK_GAP) return;
      lastCheck = Date.now();
      void registration.update().catch(() => undefined);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };
    const onOnline = () => checkForUpdate();
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") checkForUpdate(true);
    }, POLL_INTERVAL);

    async function register() {
      try {
        const next = await sw.register(SW_URL, { scope: "/", updateViaCache: "none" });
        if (!cancelled) registration = next;
      } catch {
        // Private mode or blocked storage: the app works without it.
      }
    }

    // Stay off the critical path: wait for load, then for an idle moment.
    const schedule = () => {
      // Safari < 16.4 lacks requestIdleCallback.
      if (typeof window.requestIdleCallback === "function")
        window.requestIdleCallback(() => void register(), { timeout: 5000 });
      else setTimeout(() => void register(), 1500);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.removeEventListener("load", schedule);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
