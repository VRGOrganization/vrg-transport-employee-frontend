// Service Worker — VRG Transport Servidores PWA

const CACHE_VERSION = 'v1';
const CACHE_NAME = `vrg-employee-${CACHE_VERSION}`;

const CRITICAL_ASSETS = [
  '/login',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const CACHE_PATTERNS = {
  static: /\.(js|css|woff2|png|jpg|jpeg|webp|svg|ico)$/i,
  api: /^\/api\//,
};

const SKIP_CACHE_PATTERNS = [
  /^\/api\/auth\//,
  /^\/_next\//,
];

const OFFLINE_FALLBACK_PATH = '/login';

// ═════════════════════════════════════════════════════════════════════════════
// INSTALL
// ═════════════════════════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CRITICAL_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[SW] Alguns assets não puderam ser cacheados:', err);
        return self.skipWaiting();
      })
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// ACTIVATE
// ═════════════════════════════════════════════════════════════════════════════

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// FETCH
// ═════════════════════════════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  if (SKIP_CACHE_PATTERNS.some((p) => p.test(path))) return;

  // Navegação: Network First com fallback em cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(request);
          if (cached) return cached;

          const fallback = await cache.match(OFFLINE_FALLBACK_PATH);
          if (fallback) return fallback;

          return new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // Arquivos estáticos: Cache First
  if (CACHE_PATTERNS.static.test(path)) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        if (cached) return cached;

        const response = await fetch(request);
        if (response.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }
        return response;
      }).catch(async () => {
        const fallback = await caches.match(OFFLINE_FALLBACK_PATH);
        return fallback || new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // API: Network First com fallback em cache
  if (CACHE_PATTERNS.api.test(path)) {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || new Response(
            JSON.stringify({ message: 'Você está offline. Tente novamente quando conectado.' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // Demais GETs: Network First
  event.respondWith(
    fetch(request)
      .then(async (response) => {
        if (response.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached || new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});
