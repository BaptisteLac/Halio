// Halio Service Worker
// Stratégie : Cache-first pour assets statiques, StaleWhileRevalidate pour API météo, CacheFirst pour tuiles carte

const CACHE_VERSION = 'v3';
const STATIC_CACHE  = `halio-static-${CACHE_VERSION}`;
const API_CACHE     = `halio-api-${CACHE_VERSION}`;
const TILES_CACHE   = `halio-tiles-${CACHE_VERSION}`;

const STATIC_ASSETS = ['/', '/carte', '/especes', '/journal', '/semaine', '/coach', '/moi'];

// ── Installation : pré-cache les pages principales ──────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activation : nettoyage des anciens caches ────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => (k.startsWith('halio-') || k.startsWith('pecheboard-')) && ![STATIC_CACHE, API_CACHE, TILES_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch : stratégie par type de ressource ──────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Tuiles OpenFreeMap → CacheFirst (contenu stable)
  if (url.hostname === 'tiles.openfreemap.org') {
    event.respondWith(cacheFirst(request, TILES_CACHE, 200));
    return;
  }

  // API météo/marine → StaleWhileRevalidate (fraîcheur si réseau, fallback cache)
  if (url.pathname.startsWith('/api/weather') || url.pathname.startsWith('/api/marine')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Autres requêtes → NetworkFirst (navigation, assets Next.js)
  if (request.method === 'GET') {
    event.respondWith(networkFirst(request, STATIC_CACHE));
  }
});

// ── Stratégies ───────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    // LRU : déplace l'entrée en fin de liste pour refléter l'accès récent
    if (maxEntries) {
      cache.delete(request).then(() => cache.put(request, cached.clone()));
    }
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Éviction LRU : keys[0] est désormais la moins récemment utilisée
      const keys = await cache.keys();
      if (maxEntries && keys.length >= maxEntries) {
        await cache.delete(keys[0]);
      }
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached ?? (await networkFetch) ?? new Response('Offline', { status: 503 });
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(cacheName);
    return (await cache.match(request)) ?? new Response('Offline', { status: 503 });
  }
}

// ── Push notifications ────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    return;
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: data.tag ?? 'halio-alert',
      renotify: true,
      data: { url: data.url ?? 'https://halioapp.com' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? 'https://halioapp.com';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url === url && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
