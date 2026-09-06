const CACHE_NAME = "motionframe-static-v1";
const scope = self.registration.scope;
const asset = (path) => new URL(path, scope).href;
const PRECACHE = [
  asset("./"),
  asset("./index.html"),
  asset("./assets/styles.css"),
  asset("./assets/app.js"),
  asset("./assets/demo/dashboard.svg"),
  asset("./assets/demo/detail.svg"),
  asset("./assets/demo/report.svg"),
  asset("./favicon.svg"),
  asset("./manifest.webmanifest")
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(
    fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match(asset("./index.html"))))
  );
});
