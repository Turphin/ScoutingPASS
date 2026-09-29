
    const CACHE_NAME = 'scoutingpass-v1';

    const APP_SHELL = [
        './',
        'index.html',
        'pit.html',
        'manifest.json',
        'favicon.ico',
        'service-worker.js',
        'resources/css/scoutingPASS.css',
        'resources/js/easy.qrcode.min.js',
        'resources/js/TBAInterface.js',
        'resources/js/googleSheets.js',
        'resources/js/scoutingPASS.js',
        'resources/images/field_location_key.png',
        'resources/fonts/alex.woff',
        'resources/fonts/alexisv3.ttf',
        '2025/reefscape_config.js',
        '2025/reefscape_pit_scouting.js',
        '2025/field_image.png',
        '2025/half_field.png',
        '2025/reef.png',
        '2026/rebuilt_config.js',
        '2026/rebuilt_pit_scouting.js',
        '2026/half_field.png',
        '2026/2026 REBUILT Clickable Image Map.png',
        'archive/2020/IR_config.js',
        'archive/2020/field_image.png',
        'archive/2022/RR_config.js',
        'archive/2022/RR_GS_config.js',
        'archive/2022/field_image.png',
        'archive/2023/CU_config.js',
        'archive/2023/CU_GS_config.js',
        'archive/2023/CU_Pit_config.js',
        'archive/2023/field_image.png',
        'archive/2023/grid_image.png',
        'archive/2023/grid_image_alt.png',
        'archive/2024/crescendo_config.js',
        'archive/2024/crescendo_pit_config.js',
        'archive/2024/field_image.png'
    ];

    self.addEventListener('install', event => {
        event.waitUntil((async () => {
            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(APP_SHELL);
            await self.skipWaiting();
        })());
    });

    self.addEventListener('activate', event => {
        event.waitUntil((async () => {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(cacheName => {
                if (cacheName !== CACHE_NAME) {
                    return caches.delete(cacheName);
                }
                return Promise.resolve();
            }));
            await self.clients.claim();
        })());
    });

    self.addEventListener('fetch', event => {
        if (event.request.method !== 'GET') {
            return;
        }

        const requestUrl = new URL(event.request.url);

        if (requestUrl.origin === self.location.origin) {
            event.respondWith((async () => {
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(event.request, { ignoreSearch: true });

                if (cachedResponse) {
                    return cachedResponse;
                }

                try {
                    const networkResponse = await fetch(event.request);

                    if (networkResponse && networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }

                    return networkResponse;
                } catch (error) {
                    const fallback = await cache.match('./') || await cache.match('index.html') || await cache.match('pit.html');
                    if (fallback) {
                        return fallback;
                    }
                    throw error;
                }
            })());
            return;
        }

        if (requestUrl.hostname === 'fonts.gstatic.com' || requestUrl.hostname === 'fonts.googleapis.com' || requestUrl.hostname === 'cdn.jsdelivr.net') {
            event.respondWith((async () => {
                const cached = await caches.match(event.request);

                if (cached) {
                    return cached;
                }

                const response = await fetch(event.request, { cache: 'no-store' });
                const cache = await caches.open(CACHE_NAME);

                if (response && response.ok) {
                    cache.put(event.request, response.clone());
                }

                return response;
            })());
        }
    });
