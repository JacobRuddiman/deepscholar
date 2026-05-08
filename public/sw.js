// DeepScholar Service Worker
// Version 1.0.0

const CACHE_VERSION = 'v1';
const CACHE_NAME = `deepscholar-${CACHE_VERSION}`;

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/explore',
  '/briefs',
  '/offline',
  '/manifest.json',
];

// Routes to cache with network-first strategy (excludes sensitive routes)
const NETWORK_FIRST_ROUTES = [
  '/api/',
  '/dashboard',
];

// SECURITY: Never cache auth-related or sensitive API routes
const NO_CACHE_ROUTES = [
  '/api/auth/',
  '/api/admin/',
  '/api/settings/',
  '/api/export/',
  '/api/cron/',
];

// Routes to cache with cache-first strategy
const CACHE_FIRST_ROUTES = [
  '/icons/',
  '/images/',
  '/_next/static/',
];

// Maximum cache age (1 hour for API routes, 7 days for static assets)
const MAX_CACHE_AGE = 60 * 60 * 1000;

/**
 * Install event - precache essential assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
    .then(() => self.skipWaiting())
  );
});

/**
 * Activate event - cleanup old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

/**
 * Fetch event - handle requests with appropriate strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // SECURITY: Skip caching entirely for auth/sensitive routes
  if (NO_CACHE_ROUTES.some((route) => url.pathname.startsWith(route))) {
    return;
  }

  // Determine caching strategy
  if (shouldCacheFirst(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else if (shouldNetworkFirst(url.pathname)) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

/**
 * Cache-first strategy
 * Returns cached response if available, otherwise fetches from network
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network-first strategy
 * Fetches from network, falls back to cache if offline
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, using cache:', request.url);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await cache.match('/offline');
      if (offlinePage) return offlinePage;
    }

    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Stale-while-revalidate strategy
 * Returns cached response immediately, updates cache in background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached || fetchPromise;
}

/**
 * Check if route should use cache-first strategy
 */
function shouldCacheFirst(pathname) {
  return CACHE_FIRST_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if route should use network-first strategy
 */
function shouldNetworkFirst(pathname) {
  return NETWORK_FIRST_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Background sync event - retry failed requests
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'sync-briefs') {
    event.waitUntil(syncBriefs());
  }
});

async function syncBriefs() {
  // Implement background sync logic for failed brief operations
  console.log('[SW] Syncing briefs...');
}

/**
 * Push notification event
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push event');

  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icons/check.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.png',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('DeepScholar', options)
  );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/explore')
    );
  }
});

/**
 * Message event - handle messages from clients
 * SECURITY: Validate message source before processing
 */
self.addEventListener('message', (event) => {
  // SECURITY: Only accept messages from same-origin clients
  if (!event.source || (event.origin && event.origin !== self.location.origin)) {
    console.warn('[SW] Rejected message from untrusted origin:', event.origin);
    return;
  }

  console.log('[SW] Message event:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    // SECURITY: Validate URLs are same-origin before caching
    const urls = event.data.urls;
    if (!Array.isArray(urls) || urls.length > 50) {
      console.warn('[SW] Rejected CACHE_URLS: invalid or too many URLs');
      return;
    }
    const safeUrls = urls.filter((url) => {
      try {
        const parsed = new URL(url, self.location.origin);
        return parsed.origin === self.location.origin;
      } catch {
        return false;
      }
    });
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(safeUrls);
      })
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        return caches.open(CACHE_NAME);
      })
    );
  }
});

/**
 * Periodic background sync (experimental)
 */
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag);

  if (event.tag === 'update-briefs') {
    event.waitUntil(updateBriefs());
  }
});

async function updateBriefs() {
  // Implement periodic background update logic
  console.log('[SW] Updating briefs in background...');
}

/**
 * Cleanup old cache entries
 */
async function cleanupCache() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  const now = Date.now();

  for (const request of requests) {
    const response = await cache.match(request);
    if (!response) continue;

    const dateHeader = response.headers.get('date');
    if (!dateHeader) continue;

    const age = now - new Date(dateHeader).getTime();
    if (age > MAX_CACHE_AGE) {
      console.log('[SW] Removing old cache entry:', request.url);
      await cache.delete(request);
    }
  }
}

// Run cleanup periodically
setInterval(cleanupCache, 24 * 60 * 60 * 1000); // Once per day
