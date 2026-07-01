const CACHE_NAME = 'serviacpro-v2'; // Le cambiamos el nombre a v2 para forzar la actualización
const urlsToCache = [
  './login.html',
  './admin.html',
  './tecnico.html',
  './css/main.css',
  './js/auth.js',
  './js/api.js',
  './js/admin.js'
];

// Instalar y forzar activación inmediata
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Borrar el caché viejo (el de la v1)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Estrategia: Red Primero (Network First)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si hay internet y responde bien, actualiza el caché con la versión más fresca
        if(response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        }
        return response;
      })
      .catch(() => {
        // Si falla (no hay internet), busca en el caché
        return caches.match(event.request);
      })
  );
});