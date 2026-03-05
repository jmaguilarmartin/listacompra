const CACHE_NAME = 'lista-compra-v1'
const OFFLINE_URL = '/offline.html'

// Archivos esenciales para cachear
const STATIC_CACHE = [
  '/',
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
]

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Instalando...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Cacheando archivos estáticos')
      return cache.addAll(STATIC_CACHE)
    })
  )
  // Activar inmediatamente
  self.skipWaiting()
})

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activando...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Eliminando caché antigua:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  // Tomar control inmediatamente
  self.clients.claim()
})

// Estrategia de caché: Network First, fallback a Cache
self.addEventListener('fetch', (event) => {
  // Solo manejar peticiones HTTP/HTTPS
  if (event.request.url.startsWith('http')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Si la respuesta es válida, clonarla y guardarla en caché
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          // Si falla la red, intentar servir desde caché
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            
            // Si es una navegación y no hay caché, mostrar página offline
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL)
            }
            
            // Para otros recursos, simplemente fallar
            return new Response('Contenido no disponible offline', {
              status: 503,
              statusText: 'Service Unavailable',
            })
          })
        })
    )
  }
})

// Manejo de sincronización en segundo plano (opcional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-shopping-list') {
    console.log('[ServiceWorker] Sincronizando lista de compra...')
    // Aquí podrías sincronizar datos pendientes con Supabase
  }
})

// Manejo de notificaciones push (opcional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '¡Tienes productos pendientes!',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Lista',
        icon: '/icon-72.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icon-72.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Lista de Compra', options)
  )
})

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
