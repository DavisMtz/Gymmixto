// Service worker básico: cachea el shell para arranque rápido / uso offline ligero.
const CACHE = 'reto2026-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // No cachear llamadas a Firebase / APIs externas.
  if (url.origin !== self.location.origin) return;

  // Navegación: network-first con fallback a cache.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/')));
    return;
  }
  // Estáticos: cache-first.
  event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});
