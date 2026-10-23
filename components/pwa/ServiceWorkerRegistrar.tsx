"use client";

import { useEffect } from "react";
import { addToast } from "@heroui/toast";

const SW_URL = "/sw.js";
/** Background check while the app stays open; installed PWAs can run for days without a reload. */
const POLL_INTERVAL = 30 * 60 * 1000;
/** Minimum gap between checks triggered by refocusing the app or reconnecting. */
const MIN_CHECK_GAP = 5 * 60 * 1000;

// Set only when the user accepts an update; a first install's clients.claim() also fires
// controllerchange, and that must not reload the page.
let updateAccepted = false;
let promptedFor: ServiceWorker | null = null;

/** Asks a worker which release it carries (see GET_VERSION in sw/service-worker.js). */
function workerVersion(worker: ServiceWorker) {
  return new Promise<string | null>((resolve) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => resolve(null), 1000);
    channel.port1.onmessage = ({ data }) => {
      window.clearTimeout(timer);
      resolve(typeof data?.version === "string" ? data.version : null);
    };
    worker.postMessage({ type: "GET_VERSION" }, [channel.port2]);
  });
}

async function promptReload(worker: ServiceWorker) {
  if (promptedFor === worker) return;
  promptedFor = worker;
  const version = await workerVersion(worker);
  addToast({
    title: "A new version of Paradiso is ready",
    description: version
      ? `Reload to update to ${version.split("+")[0]}. It only takes a second.`
      : "Reload to get the latest updates. It only takes a second.",
    timeout: 0,
    endContent: (
      <button
        type="button"
        className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-on-accent"
        onClick={() => {
          updateAccepted = true;
          worker.postMessage({ type: "SKIP_WAITING" });
        }}
      >
        Reload
      </button>
    ),
  });
}

/**
 * Registers the service worker in production and delivers releases with one tap:
 * each deploy ships a newly stamped sw.js, the browser installs it in the background, and the
 * user gets a "Reload" toast instead of having the running tab swapped out from under them.
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
    const onControllerChange = () => {
      if (!updateAccepted) return;
      updateAccepted = false;
      window.location.reload();
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
        registration = await sw.register(SW_URL, { scope: "/", updateViaCache: "none" });
      } catch {
        return; // Private mode or blocked storage: the app works without it.
      }
      if (cancelled) return;
      // Only an *update* needs a prompt; the first install has no controller yet.
      if (registration.waiting && sw.controller) void promptReload(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const incoming = registration?.installing;
        incoming?.addEventListener("statechange", () => {
          if (incoming.state === "installed" && sw.controller) void promptReload(incoming);
        });
      });
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

    sw.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.removeEventListener("load", schedule);
      window.removeEventListener("online", onOnline);
      sw.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
