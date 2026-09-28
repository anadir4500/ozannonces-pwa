// Service worker ÔZAnnonces — met en cache uniquement la coque de l'app (/app/).
// Il ne touche JAMAIS aux appels api_*.php ni aux images : les données de session
// et les annonces restent toujours lues sur le serveur.
const CACHE = 'oz-app-v1'; // changez ce numéro pour forcer une mise à jour du cache
const SHELL = ['./', 'index.html', 'manifest.webmanifest',
               'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;        // sites tiers (geo.api.gouv.fr…)
  if (!url.pathname.startsWith('/app/')) return;     // api_*.php, images, site : jamais interceptés

  // Page de l'app : réseau d'abord (mises à jour immédiates), cache si hors ligne
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); }
          return res;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Icônes / manifeste : cache d'abord
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
