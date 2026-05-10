const CACHE_NAME = 'portfel-pro-v1-1-etap49-wallet';
const APP_VERSION = '1.1';
const APP_SHELL = [
  './',
  './index.html',
  './index.html?v=112',
  './voice/index.html?v=112',
  './manifest.webmanifest?v=112',
  './manifest-voice.webmanifest?v=112',
  './src/styles.css?v=112',
  './src/config.js?v=112',
  './src/app.js?v=112',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/logo-portfel-pro.png',
  './icons/mic-192.png',
  './icons/mic-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => (key.startsWith('bilans-pwa-') || key.startsWith('portfel-pro-')) && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || (!response.ok && response.type !== 'opaque')) return response;

        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        if (event.request.mode === 'navigate') {
          if (requestUrl.pathname.endsWith('/voice/') || requestUrl.pathname.endsWith('/voice/index.html')) {
            return await caches.match('./voice/index.html?v=112') || await caches.match('./voice/index.html') || await caches.match('./index.html?v=112');
          }
          return await caches.match('./index.html?v=112') || await caches.match('./index.html');
        }

        return new Response('Brak połączenia i brak pliku w cache.', {
          status: 503,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
  );
});
