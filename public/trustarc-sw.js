/* TrustArc app shell service worker — static build assets only.
 * Never cache location telemetry, authentication responses, API data, bookings or payments.
 */
const STATIC_CACHE = "trustarc-v2-static-1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith("trustarc-v2-static-") && k !== STATIC_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || request.mode === "navigate" || request.credentials === "include") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith("/assets/")) return;
  if (!["script","style","font","image"].includes(request.destination)) return;
  event.respondWith((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const stored = await cache.match(request);
    if (stored) return stored;
    const response = await fetch(request);
    if (response.ok && response.type === "basic") await cache.put(request, response.clone());
    return response;
  })());
});
