/* Applied Commerce installation and offline recovery.
 * Never cache authenticated HTML, APIs, RSC payloads, answers or teacher guides.
 * Navigation responses always come from the network. Only this public recovery
 * page and app icons are stored; existing account-scoped learning saves own data.
 */
const CACHE_PREFIX = "applied-commerce-pwa-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const OFFLINE_URL = "/offline.html";
const PUBLIC_FILES = [OFFLINE_URL, "/pwa/icon-192.png", "/pwa/icon-512.png", "/pwa/icon-maskable-512.png", "/pwa/apple-touch-icon.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PUBLIC_FILES)));
  // A replacement waits until all old app windows close. Never reload a lesson
  // automatically while a learner is typing or a save is in flight.
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  // Auth redirects/callbacks and private endpoints must keep their real network
  // failures. In particular, an HTML fallback must never masquerade as API data.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth")) return;
  if (PUBLIC_FILES.includes(url.pathname) && !url.search) {
    event.respondWith(caches.open(CACHE_NAME).then(async cache => await cache.match(url.pathname) || fetch(request)));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(OFFLINE_URL) || Response.error();
    }));
  }
});
