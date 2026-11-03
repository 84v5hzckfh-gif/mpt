// MPT Persoon - service worker: app werkt offline.
// Nieuwe versie uitrollen? Verhoog VERSIE en upload opnieuw.
const VERSIE = "mpt-v9";
const BESTANDEN = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIE).then(c => c.addAll(BESTANDEN)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  // Alleen eigen oude caches wissen (mpt-v*); de instructie-app (map instructie/) heeft een eigen cache.
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("mpt-v") && k !== VERSIE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (new URL(req.url).pathname.includes("/instructie/")) return;   // instructie-app regelt zichzelf
  e.respondWith(caches.open(VERSIE).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === "navigate" ? await cache.match("./index.html") : null);
    const net = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || new Response("Offline", { status: 503 });
  }));
});
