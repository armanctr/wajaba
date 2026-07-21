// WAJABA - service worker
// Network-first for HTML (so updates always reach users), cache-first for icons.
// Bump CACHE_NAME on every deploy that changes cached files, so old caches are cleared.

const CACHE_NAME = 'wajaba-shell-v2';
const SHELL_FILES = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Never cache API calls - always live data.
  if (url.includes('script.google.com')) return;

  // HTML pages: network-first, so new deploys are always picked up.
  // Falls back to cache only if the network is unavailable.
  if (event.request.mode === 'navigate' || url.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets (icons, manifest): cache-first for speed.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
