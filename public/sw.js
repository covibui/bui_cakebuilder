// Offline support: saved cakes live in IndexedDB on the device; this caches the app itself
// so the build and cook mode open with no connection. Recipe links and the Claude handoff still need one.
const CACHE = 'cake-builder-v1';
const SHELL = ['/', '/project', '/logs', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  // Built assets never change at the same URL: cache first.
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })),
    );
    return;
  }

  // Pages: network first, fall back to the cached page (query string ignored, so any cake opens).
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req.mode === 'navigate' ? url.pathname : req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req.mode === 'navigate' ? url.pathname : req, { ignoreSearch: true }).then((hit) => hit || caches.match('/'))),
  );
});
