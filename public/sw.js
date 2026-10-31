// Offline support: cache the app as it loads, serve from cache when the network is gone.
// Pages go network-first (so updates arrive); hashed assets, audio and icons go cache-first.
const CACHE = 'swalpa-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// The page sends the URLs it already loaded before this worker took control, so they work offline too.
self.addEventListener('message', (e) => {
  if (e.data?.type === 'cache' && Array.isArray(e.data.urls)) e.waitUntil(caches.open(CACHE).then((c) => c.addAll(e.data.urls).catch(() => {})));
});

/**
 * A page that differs from the cached one means a new deploy: drop the old build's hashed files
 * (under /assets/) before the new page asks for its own, so the cache doesn't grow every release.
 */
async function freshPage(res) {
  const c = await caches.open(CACHE);
  const old = await c.match('./index.html', { ignoreVary: true });
  if (old && (await old.text()) !== (await res.clone().text()))
    for (const req of await c.keys()) if (new URL(req.url).pathname.startsWith('/assets/')) await c.delete(req);
  await c.put('./index.html', res.clone());
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => (res.ok ? freshPage(res) : res))
        .catch(() => caches.match('./index.html', { ignoreVary: true })),
    );
    return;
  }
  e.respondWith(
    // ignoreVary: module scripts are requested with an Origin header the cached copies may lack.
    caches.match(req, { ignoreVary: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
