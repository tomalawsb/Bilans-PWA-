const CACHE_NAME = 'portfel-pro-v1-1-v155';
const APP_VERSION = '1.1-155';
const APP_SHELL = [
  './',
  './index.html',
  './index.html?v=155',
  './voice/index.html',
  './voice/index.html?v=155',
  './manifest.webmanifest?v=155',
  './manifest-voice.webmanifest?v=155',
  './src/styles.css?v=155',
  './src/config.js?v=155',
  './src/app.js?v=155',
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
      .then(keys => Promise.all(
        keys
          .filter(key => (key.startsWith('bilans-pwa-') || key.startsWith('portfel-pro-')) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function navigationFallback(requestUrl) {
  const cache = await caches.open(CACHE_NAME);
  if (requestUrl.pathname.endsWith('/voice/') || requestUrl.pathname.endsWith('/voice/index.html')) {
    return await cache.match('./voice/index.html?v=155', { ignoreSearch: true })
      || await cache.match('./index.html?v=155', { ignoreSearch: true });
  }
  return cache.match('./index.html?v=155', { ignoreSearch: true });
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request, { ignoreSearch: true });

    // Pliki programu i nawigacje otwieramy od razu z urządzenia. Aktualna
    // wersja jest jednocześnie pobierana w tle, gdy sieć jest dostępna.
    if (cached) {
      event.waitUntil(fetchAndCache(event.request).catch(() => undefined));
      return cached;
    }

    try {
      return await fetchAndCache(event.request);
    } catch (_) {
      if (event.request.mode === 'navigate') {
        const fallback = await navigationFallback(requestUrl);
        if (fallback) return fallback;
      }

      return new Response('Brak połączenia i brak pliku w pamięci aplikacji.', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
