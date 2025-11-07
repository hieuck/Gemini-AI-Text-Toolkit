const CACHE_NAME = 'gemini-toolkit-v2'; // Version bump to ensure the new service worker activates
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  // Add the main CDN script to be pre-cached. Others will be cached on first use.
  'https://cdn.tailwindcss.com',
];

// Install event: open cache and add core files.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event: clean up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: serve from cache or fetch from network.
self.addEventListener('fetch', event => {
  // For non-GET requests (like API POST calls), do not cache, just fetch from the network.
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // For GET requests, use a "cache-first, then network" strategy.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // If the request is in the cache, return the cached response.
        if (cachedResponse) {
          return cachedResponse;
        }

        // If the request is not in the cache, fetch it from the network.
        return fetch(event.request.clone()).then(networkResponse => {
          // We'll cache the new response for future use.
          // Check for a valid response (status 200). We also check for 'cors' type for CDN assets.
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          // Return the network response.
          return networkResponse;
        });
      })
  );
});