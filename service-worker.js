const CACHE = 'rise-above-wrestling-v1-5-2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/ecw-arena.jpg',
  './assets/raw-arena.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => Promise.all(ASSETS.map(asset => cache.add(asset).catch(err => console.warn("Optional asset not cached:", asset, err)))))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  if (
    event.request.method !== 'GET' ||
    new URL(event.request.url).origin !== self.location.origin
  ) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache =>
            cache.put(event.request, copy)
          );
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached =>
          cached || caches.match('./index.html')
        )
      )
  );
});
