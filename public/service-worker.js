const CACHE_NAME = 'lista-compra-v1'
const OFFLINE_URL = '/offline.html'

// Archivos esenciales para cachear (REDUCIDO)
const STATIC_CACHE = [
  '/',
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png',
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
  self.clients.claim()
})

// Estrategia OPTIMIZADA: Network Only para Supabase, Cache para estáticos
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // IMPORTANTE: NO cachear peticiones a Supabase
  if (url.hostname.includes('supabase.co')) {
    // Dejar pasar directo sin interceptar
    return
  }
  
  // Solo cachear GET requests
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    // Intentar red primero
    fetch(event.request)
      .then((response) => {
        // Solo cachear respuestas exitosas de recursos estáticos
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // Si falla la red, intentar caché
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          
          // Si es navegación y no hay caché, mostrar offline
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }
          
          return new Response('No disponible offline', {
            status: 503,
            statusText: 'Service Unavailable',
          })
        })
      })
  )
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
