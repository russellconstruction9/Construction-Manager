const CACHE_NAME = 'construction-manager-v1';
const DYNAMIC_CACHE = 'construction-manager-dynamic-v1';
const STATIC_CACHE = 'construction-manager-static-v1';
const IMAGE_CACHE = 'construction-manager-images-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Dynamic assets patterns
const API_PATTERNS = [
  /\/api\//,
  /\/data\//
];

const IMAGE_PATTERNS = [
  /\.(?:png|gif|jpg|jpeg|svg|webp)$/,
  /\/photos\//,
  /\/images\//
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Create offline fallback page
      createOfflinePage()
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== STATIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages
      self.clients.claim()
    ])
  );
});

// Fetch event - implement different caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests with appropriate strategies
  if (request.method === 'GET') {
    if (isStaticAsset(url)) {
      // Static assets: Cache first
      event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (isImageRequest(url)) {
      // Images: Cache first with fallback
      event.respondWith(cacheFirstWithFallback(request, IMAGE_CACHE));
    } else if (isAPIRequest(url)) {
      // API requests: Network first with background sync
      event.respondWith(networkFirstWithSync(request));
    } else {
      // Other requests: Stale while revalidate
      event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    }
  } else {
    // POST, PUT, DELETE requests: Handle with background sync
    event.respondWith(handleMutatingRequest(request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'background-sync-projects') {
    event.waitUntil(syncProjects());
  } else if (event.tag === 'background-sync-tasks') {
    event.waitUntil(syncTasks());
  } else if (event.tag === 'background-sync-photos') {
    event.waitUntil(syncPhotos());
  }
});

// Push notification handling
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'construction-manager-notification',
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-dismiss.png'
      }
    ]
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'Construction Manager';
    options.data = data;
  }

  event.waitUntil(
    self.registration.showNotification(options.title || 'Construction Manager', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/') // Open the app
    );
  }
});

// Helper functions
function isStaticAsset(url) {
  return url.pathname.includes('/static/') || 
         url.pathname.includes('/assets/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.html');
}

function isImageRequest(url) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isAPIRequest(url) {
  return API_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('Service Worker: Network failed, serving offline page');
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

// Cache-first with fallback
async function cacheFirstWithFallback(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return a placeholder image for failed image requests
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" dy=".3em">Image not available</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Network-first with background sync
async function networkFirstWithSync(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Service Worker: Network failed, checking cache');
    
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This request failed because you are offline.',
        timestamp: Date.now()
      }),
      { 
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

// Handle mutating requests (POST, PUT, DELETE)
async function handleMutatingRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('Service Worker: Mutating request failed, queueing for background sync');
    
    // Store the request for background sync
    await queueRequestForSync(request);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        queued: true,
        message: 'Request queued for when you are back online.'
      }),
      { 
        status: 202,
        statusText: 'Accepted',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Queue request for background sync
async function queueRequestForSync(request) {
  const db = await openSyncDB();
  const transaction = db.transaction(['requests'], 'readwrite');
  const store = transaction.objectStore('requests');
  
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now()
  };
  
  store.add(requestData);
  
  // Register for background sync
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    const registration = await self.registration;
    await registration.sync.register('background-sync-requests');
  }
}

// Background sync functions
async function syncProjects() {
  console.log('Service Worker: Syncing projects...');
  // Implementation for syncing project data
}

async function syncTasks() {
  console.log('Service Worker: Syncing tasks...');
  // Implementation for syncing task data
}

async function syncPhotos() {
  console.log('Service Worker: Syncing photos...');
  // Implementation for syncing photo uploads
}

// Create offline page
async function createOfflinePage() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Construction Manager - Offline</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 50px; }
        .offline-icon { font-size: 64px; margin-bottom: 20px; }
        h1 { color: #333; }
        p { color: #666; margin-bottom: 30px; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="offline-icon">📱</div>
      <h1>You're Offline</h1>
      <p>Construction Manager is not available right now, but you can still view cached content.</p>
      <button onclick="window.location.reload()">Try Again</button>
    </body>
    </html>
  `;
  
  const cache = await caches.open(STATIC_CACHE);
  await cache.put('/offline.html', new Response(offlineHTML, {
    headers: { 'Content-Type': 'text/html' }
  }));
}

// IndexedDB helper for sync queue
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sync-queue', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('requests')) {
        const store = db.createObjectStore('requests', { autoIncrement: true });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}
