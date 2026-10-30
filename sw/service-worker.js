/* Paradiso service worker.
 *
 * Caching is deliberately conservative: only content-addressed build output and images are
 * cached. HTML documents, RSC payloads, API/BFF calls and anything non-GET always go to the
 * network, so authenticated, per-user data is never stored or served stale. Offline document
 * loads fall back to /offline.html; offline soft navigations are retried by Next.js itself
 * (experimental.useOffline).
 */

/* global APP_VERSION -- injected by scripts/build-sw.mjs; a new value per build is what makes
   browsers detect an update after every deploy. */

// Bump only when the cache layout changes. Hashed chunks survive app releases untouched.
const CACHE_VERSION = "v1";
const STATIC_CACHE = `paradiso-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `paradiso-images-${CACHE_VERSION}`;
// The shell (offline page) is tied to the release so it never shows stale branding.
const SHELL_CACHE = `paradiso-shell-${APP_VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, IMAGE_CACHE, SHELL_CACHE];

const OFFLINE_URL = "/offline.html";
const SHELL_ASSETS = [OFFLINE_URL, "/icons/icon-192.png", "/manifest.webmanifest"];

const MAX_STATIC_ENTRIES = 400;
const MAX_IMAGE_ENTRIES = 250;
const IMAGE_HOSTS = new Set(["image.tmdb.org"]);
const LOCAL_IMAGE_PREFIXES = ["/_next/image", "/icons/", "/posters/", "/frames/", "/patterns/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS.map((url) => new Request(url, { cache: "reload" })))),
  );
  // Activate immediately: the worker only caches content-addressed chunks and images and never
  // serves documents, so swapping it mid-session is safe and needs no user prompt.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("paradiso-") && !CURRENT_CACHES.includes(key))
          .map((key) => caches.delete(key)),
      );
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const type = event.data && event.data.type;
  if (type === "GET_VERSION" && event.ports[0]) event.ports[0].postMessage({ version: APP_VERSION });
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.headers.has("range")) return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (url.origin === self.location.origin) {
    // RSC payloads, route handlers and the BFF carry per-user data: never cache them.
    if (url.pathname.startsWith("/api/") || url.searchParams.has("_rsc") || request.headers.get("RSC") === "1") return;

    if (url.pathname.startsWith("/_next/static/")) {
      event.respondWith(cacheFirst(request, STATIC_CACHE, MAX_STATIC_ENTRIES));
      return;
    }
    if (request.destination === "image" || LOCAL_IMAGE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
      event.respondWith(staleWhileRevalidate(event, IMAGE_CACHE, MAX_IMAGE_ENTRIES));
    }
    return;
  }

  if (IMAGE_HOSTS.has(url.hostname) && request.destination === "image") {
    event.respondWith(staleWhileRevalidate(event, IMAGE_CACHE, MAX_IMAGE_ENTRIES));
  }
});

async function handleNavigation(event) {
  try {
    const preloaded = await event.preloadResponse;
    if (preloaded) return preloaded;
    return await fetch(event.request);
  } catch {
    const offline = await caches.match(OFFLINE_URL, { cacheName: SHELL_CACHE });
    return offline || Response.error();
  }
}

/** Hashed build output never changes under the same URL, so the cache is authoritative. */
async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheable(response)) {
    await cache.put(request, response.clone());
    void trim(cache, maxEntries);
  }
  return response;
}

/** Serve the cached image instantly and refresh it in the background. */
async function staleWhileRevalidate(event, cacheName, maxEntries) {
  const { request } = event;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(async (response) => {
      if (isCacheable(response)) {
        await cache.put(request, response.clone());
        void trim(cache, maxEntries);
      }
      return response;
    })
    .catch((error) => {
      if (cached) return cached;
      throw error;
    });
  if (cached) {
    event.waitUntil(network.catch(() => undefined));
    return cached;
  }
  return network;
}

/** Opaque responses are skipped: their status is unknown and browsers pad their quota cost. */
function isCacheable(response) {
  if (!response || !response.ok || response.type === "opaque") return false;
  const cacheControl = response.headers.get("Cache-Control") || "";
  return !/no-store|private/i.test(cacheControl);
}

/** Cache keys come back in insertion order, so dropping from the front evicts the oldest. */
async function trim(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}
