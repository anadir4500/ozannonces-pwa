// Service worker ÔZAnnonces
const CACHE = 'oz-app-v2';

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Ne gérer que notre propre domaine
  if (url.origin !== location.origin) return;

  // Notre application est dans /ozannonces-pwa/
  if (!url.pathname.startsWith('/ozannonces-pwa/')) return;

  // Page principale : réseau d'abord, cache hors ligne
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE)
              .then(cache => cache.put('index.html', copy));
          }

          return response;
        })
        .catch(() => caches.match('index.html'))
    );

    return;
  }

  // Manifest, icônes et autres fichiers statiques
  event.respondWith(
    caches.match(req)
      .then(cached => {
        if (cached) return cached;

        return fetch(req).then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE)
              .then(cache => cache.put(req, copy));
          }

          return response;
        });
      })
  );
});
