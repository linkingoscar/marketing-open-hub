/**
 * MarTech Open Hub Service Worker
 *
 * Caching strategies:
 * - Static assets (JS/CSS/fonts): Cache-First (fast, immutable)
 * - Images: Cache-First with expiration
 * - Navigation (HTML pages): Network-First with offline fallback
 * - API calls (Semantic Scholar, etc.): Network-Only (don't cache)
 * - Project data JSON: Stale-While-Revalidate
 */

const CACHE_VERSION = "v2";
const STATIC_CACHE = `martech-static-${CACHE_VERSION}`;
const PAGES_CACHE = `martech-pages-${CACHE_VERSION}`;
const DATA_CACHE = `martech-data-${CACHE_VERSION}`;
const IMAGE_CACHE = `martech-images-${CACHE_VERSION}`;

// Max items per cache
const MAX_PAGES = 50;
const MAX_IMAGES = 100;
const MAX_DATA_AGE = 24 * 60 * 60 * 1000; // 24 hours

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/favicon.svg",
];

// Patterns for different resource types
const STATIC_PATTERN = /\.(js|css|woff2?|ttf|eot)(\?.*)?$/;
const IMAGE_PATTERN = /\.(png|jpg|jpeg|gif|svg|webp|ico)(\?.*)?$/;
const DATA_PATTERN = /\/data\/.*\.json$/;
const API_PATTERN = /api\.semanticscholar\.org|api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com/;
const EXTERNAL_PATTERN = /^https?:\/\/(?!martech-open-hub\.vercel\.app)/;

// ===== Install =====
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Pre-caching static assets");
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// ===== Activate =====
self.addEventListener("activate", (event) => {
  const currentCaches = [STATIC_CACHE, PAGES_CACHE, DATA_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ===== Fetch =====
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin API calls (don't cache LLM/Scholar API)
  if (API_PATTERN.test(request.url)) return;

  // Skip most cross-origin requests (let browser handle)
  if (EXTERNAL_PATTERN.test(request.url) && !IMAGE_PATTERN.test(request.url)) return;

  // Route to appropriate strategy
  if (STATIC_PATTERN.test(request.url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (IMAGE_PATTERN.test(request.url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  } else if (DATA_PATTERN.test(request.url)) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
  } else if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGES_CACHE));
  } else {
    event.respondWith(networkFirst(request, PAGES_CACHE));
  }
});

// ===== Strategies =====

/**
 * Cache-First: Fast, good for immutable assets
 * Check cache → fetch network → cache response
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

/**
 * Network-First: Fresh content, good for HTML pages
 * Try network → fallback to cache → offline page
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      // Trim cache size
      trimCache(cacheName, MAX_PAGES);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Offline fallback for navigation
    if (request.mode === "navigate") {
      return caches.match("/");
    }
    return new Response("Offline", { status: 503 });
  }
}

/**
 * Stale-While-Revalidate: Serve cached, update in background
 * Good for data that changes occasionally
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  // Return cached immediately if available, otherwise wait for network
  return cached || fetchPromise;
}

// ===== Cache Management =====

/**
 * Trim cache to max items (FIFO)
 */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await trimCache(cacheName, maxItems);
  }
}

// ===== Background Sync (future) =====
// self.addEventListener("sync", (event) => { ... });

// ===== Push Notifications (future) =====
// self.addEventListener("push", (event) => { ... });
