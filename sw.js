const CACHE_NAME = 'serviacpro-v1';
const urlsToCache = [
  './login.html',
  './admin.html',
  './tecnico.html',
  './css/main.css',
  './js/auth.js',
  './js/api.js'
];

// Instalar el Service Worker y guardar en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar peticiones (Modo sin conexión básico)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve el archivo del caché si existe, si no, lo busca en internet
        return response || fetch(event.request);
      })
  );
});