const CACHE_NAME = 'workout-generator-v2';
const ASSETS_TO_CACHE = [
    '/WorkoutGenerator/',
    '/WorkoutGenerator/index.html',
    '/WorkoutGenerator/pwa-manifest.json',
    '/WorkoutGenerator/workouts.json',
    '/WorkoutGenerator/css/style.css',
    '/WorkoutGenerator/js/app.js',
    '/WorkoutGenerator/js/api.js',
    '/WorkoutGenerator/js/storage.js',
    '/WorkoutGenerator/js/ui.js',
    '/WorkoutGenerator/assets/icons/icon-72.png',
    '/WorkoutGenerator/assets/icons/icon-96.png',
    '/WorkoutGenerator/assets/icons/icon-128.png',
    '/WorkoutGenerator/assets/icons/icon-144.png',
    '/WorkoutGenerator/assets/icons/icon-152.png',
    '/WorkoutGenerator/assets/icons/icon-192.png',
    '/WorkoutGenerator/assets/icons/icon-384.png',
    '/WorkoutGenerator/assets/icons/icon-512.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests except for GitHub
    if (!event.request.url.startsWith(self.location.origin) && 
        !event.request.url.includes('githubusercontent.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }

                return fetch(event.request).then((response) => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(() => {
                // Return offline fallback if needed
                return caches.match('/WorkoutGenerator/index.html');
            })
    );
});
