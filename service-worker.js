// ═══════════════════════════════════════════════════
//  CotizaPro PWA — Service Worker
//  Versión: 2.2
// ═══════════════════════════════════════════════════

const CACHE_NAME = 'cotizapro-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/logo.png',
  './assets/firma.png',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

// ── Instalación: precachea los archivos core ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── Activación: limpia cachés viejas ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: Cache First, fallback a red ──
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin && !url.href.includes('fonts.googleapis') && !url.href.includes('fonts.gstatic')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
