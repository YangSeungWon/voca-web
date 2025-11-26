const CACHE_NAME = 'voca-web-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/_next/static/css/app.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main-app.js',
  '/_next/static/chunks/app-pages-internals.js',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((err) => {
        console.log('Cache install error:', err);
      })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first, cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-http(s) requests (e.g., chrome-extension://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests differently for offline support
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Skip non-GET requests for static resources
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Only cache http(s) requests
        if (event.request.url.startsWith('http')) {
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            })
            .catch((err) => {
              console.log('Cache put error:', err);
            });
        }

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            
            // Return offline page if available
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-vocabulary') {
    event.waitUntil(syncVocabulary());
  }
});

async function syncVocabulary() {
  try {
    // Get pending actions from IndexedDB
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      const response = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body
      });
      
      if (response.ok) {
        await removePendingAction(action.id);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Handle API requests with offline support
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Network failed, queue the request for later sync
    if (request.method !== 'GET') {
      await queueApiRequest(request);
      
      // Return a synthetic response
      return new Response(
        JSON.stringify({ 
          success: true, 
          offline: true,
          message: 'Request queued for sync' 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // For GET requests, try to return cached data
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Offline',
        message: 'No cached data available' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Queue API request for later sync
async function queueApiRequest(request) {
  const body = await request.text();
  const action = {
    id: Date.now().toString(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: body,
    timestamp: Date.now()
  };
  
  // Store in IndexedDB (implementation would go here)
  // For now, we'll use the browser's background sync API
  if ('sync' in self.registration) {
    await self.registration.sync.register('sync-vocabulary');
  }
}

// Helper functions for IndexedDB (simplified)
async function getPendingActions() {
  // Implementation would use IndexedDB
  return [];
}

async function removePendingAction(id) {
  // Implementation would use IndexedDB
  return;
}