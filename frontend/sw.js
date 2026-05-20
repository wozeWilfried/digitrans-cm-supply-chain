/**
 * DIGITRANS-SCM — Service Worker (Offline-First)
 * Cache-First assets, Network-First API calls
 */
const CACHE_NAME = 'digitrans-scm-v1';
const API_CACHE_NAME = 'digitrans-api-v1';
const STATIC_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== API_CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
  } else if (request.method === 'GET') {
    event.respondWith(cacheFirst(request));
  }
});

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline', cached: false }), {
      status: 503, headers: { 'Content-Type': 'application/json', 'X-Offline': 'true' },
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, res.clone());
    return res;
  } catch {
    return new Response('Ressource indisponible hors ligne', { status: 503 });
  }
}
