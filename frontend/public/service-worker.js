// frontend/public/service-worker.js
const CACHE_NAME = 'ecolojia-v3';
const RUNTIME_CACHE = 'ecolojia-runtime';
const OFFLINE_URL = '/offline.html';

// Assets Ã  mettre en cache lors de l'installation
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/static/css/main.css',
  '/static/js/main.js',
  '/images/logo.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-512x512.png',
  '/fonts/Inter-Regular.woff2',
  '/fonts/Inter-Bold.woff2'
];

// Patterns d'URL Ã  mettre en cache
const CACHE_PATTERNS = {
  // Images produits - cache 7 jours
  images: {
    pattern: /\.(jpg|jpeg|png|webp|svg)$/i,
    cache: RUNTIME_CACHE,
    maxAge: 7 * 24 * 60 * 60, // 7 jours
    maxEntries: 100
  },
  
  // API calls - cache 5 minutes pour les donnÃ©es non-critiques
  api: {
    pattern: /\/api\/v1\/(products|categories|trending)/,
    cache: RUNTIME_CACHE,
    maxAge: 5 * 60, // 5 minutes
    maxEntries: 50,
    networkFirst: true
  },
  
  // Analyses - cache 1 heure
  analyses: {
    pattern: /\/api\/v1\/analyses\/\w+$/,
    cache: RUNTIME_CACHE,
    maxAge: 60 * 60, // 1 heure
    maxEntries: 30
  },
  
  // Assets statiques - cache long terme
  static: {
    pattern: /\.(css|js|woff2?)$/i,
    cache: CACHE_NAME,
    maxAge: 30 * 24 * 60 * 60, // 30 jours
    maxEntries: 50
  }
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Ã‰VÃ‰NEMENTS DU SERVICE WORKER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// Installation
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => self.skipWaiting()) // Active immÃ©diatement
  );
});

// Activation
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    // Nettoyer les anciens caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // Prend le contrÃ´le immÃ©diatement
  );
});

// Interception des requÃªtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requÃªtes non-GET
  if (request.method !== 'GET') return;

  // Ignorer les requÃªtes cross-origin (sauf CDN autorisÃ©s)
  if (url.origin !== self.location.origin && 
      !url.origin.includes('cloudinary.com') &&
      !url.origin.includes('algolia.net')) {
    return;
  }

  // Ignorer les requÃªtes de dÃ©veloppement
  if (url.pathname.includes('hot-update')) return;

  // DÃ©terminer la stratÃ©gie de cache
  const cacheStrategy = getCacheStrategy(url, request);
  
  if (cacheStrategy) {
    event.respondWith(handleRequest(request, cacheStrategy));
  }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STRATÃ‰GIES DE CACHE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function getCacheStrategy(url, request) {
  // VÃ©rifier chaque pattern
  for (const [key, config] of Object.entries(CACHE_PATTERNS)) {
    if (config.pattern.test(url.pathname) || config.pattern.test(url.href)) {
      return config;
    }
  }
  
  // StratÃ©gie par dÃ©faut pour les pages HTML
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    return {
      cache: RUNTIME_CACHE,
      networkFirst: true,
      fallback: OFFLINE_URL
    };
  }
  
  return null;
}

async function handleRequest(request, strategy) {
  const cache = await caches.open(strategy.cache);
  
  // Network First Strategy
  if (strategy.networkFirst) {
    try {
      const response = await fetchWithTimeout(request, 5000);
      
      // Mettre en cache si succÃ¨s
      if (response && response.status === 200) {
        const responseToCache = response.clone();
        cache.put(request, responseToCache);
      }
      
      return response;
    } catch (error) {
      console.log('[ServiceWorker] Network failed, falling back to cache:', error);
      
      // Fallback sur le cache
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Si page HTML, retourner la page offline
      if (strategy.fallback && request.mode === 'navigate') {
        return cache.match(strategy.fallback);
      }
      
      throw error;
    }
  }
  
  // Cache First Strategy (par dÃ©faut)
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // VÃ©rifier l'Ã¢ge du cache
    const cachedDate = new Date(cachedResponse.headers.get('date'));
    const age = (Date.now() - cachedDate.getTime()) / 1000;
    
    if (!strategy.maxAge || age < strategy.maxAge) {
      // RafraÃ®chir en arriÃ¨re-plan si > 50% du maxAge
      if (strategy.maxAge && age > strategy.maxAge * 0.5) {
        refreshCache(request, cache);
      }
      return cachedResponse;
    }
  }
  
  // Pas de cache ou expirÃ© - fetch network
  try {
    const response = await fetchWithTimeout(request, 5000);
    
    if (response && response.status === 200) {
      const responseToCache = response.clone();
      
      // Nettoyer le cache si trop d'entrÃ©es
      if (strategy.maxEntries) {
        await cleanCache(strategy.cache, strategy.maxEntries);
      }
      
      cache.put(request, responseToCache);
    }
    
    return response;
  } catch (error) {
    // Si Ã©chec et cache disponible (mÃªme expirÃ©), l'utiliser
    if (cachedResponse) {
      console.log('[ServiceWorker] Using stale cache after network failure');
      return cachedResponse;
    }
    
    throw error;
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// UTILITAIRES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function fetchWithTimeout(request, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeout);
    
    fetch(request)
      .then(response => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function refreshCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response);
    }
  } catch (error) {
    console.log('[ServiceWorker] Background refresh failed:', error);
  }
}

async function cleanCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  
  if (requests.length > maxEntries) {
    // Supprimer les plus anciennes entrÃ©es
    const toDelete = requests.slice(0, requests.length - maxEntries);
    await Promise.all(toDelete.map(request => cache.delete(request)));
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SYNC EN ARRIÃˆRE-PLAN
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// Background Sync pour envoyer les analyses hors ligne
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Sync event:', event.tag);
  
  if (event.tag === 'sync-analyses') {
    event.waitUntil(syncPendingAnalyses());
  }
});

async function syncPendingAnalyses() {
  const db = await openIndexedDB();
  const tx = db.transaction('pending_analyses', 'readwrite');
  const store = tx.objectStore('pending_analyses');
  const analyses = await store.getAll();
  
  for (const analysis of analyses) {
    try {
      const response = await fetch('/api/v1/analyses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${analysis.token}`
        },
        body: JSON.stringify(analysis.data)
      });
      
      if (response.ok) {
        // Supprimer de la queue
        await store.delete(analysis.id);
        
        // Notifier l'utilisateur
        self.registration.showNotification('Analyse synchronisÃ©e', {
          body: `L'analyse de ${analysis.data.productName} a Ã©tÃ© envoyÃ©e`,
          icon: '/images/icons/icon-192x192.png',
          badge: '/images/icons/badge-72x72.png'
        });
      }
    } catch (error) {
      console.error('[ServiceWorker] Sync failed for analysis:', analysis.id);
    }
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PUSH NOTIFICATIONS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'ECOLOJIA', body: event.data.text() };
    }
  }
  
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: data.icon || '/images/icons/icon-192x192.png',
    badge: '/images/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id || 1,
      url: data.url || '/'
    },
    actions: data.actions || [
      { action: 'view', title: 'Voir', icon: '/images/icons/check.png' },
      { action: 'close', title: 'Fermer', icon: '/images/icons/close.png' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'ECOLOJIA', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click:', event.action);
  event.notification.close();
  
  if (event.action === 'close') return;
  
  const url = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si une fenÃªtre est dÃ©jÃ  ouverte, focus
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon ouvrir une nouvelle fenÃªtre
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MESSAGE HANDLING
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      })
    );
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      cacheUrls(event.data.urls).then(() => {
        event.ports[0].postMessage({ type: 'URLS_CACHED' });
      })
    );
  }
});

async function cacheUrls(urls) {
  const cache = await caches.open(RUNTIME_CACHE);
  await cache.addAll(urls);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// INDEXEDDB POUR STOCKAGE OFFLINE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ecolojia-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store pour les analyses en attente
      if (!db.objectStoreNames.contains('pending_analyses')) {
        const store = db.createObjectStore('pending_analyses', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp');
      }
      
      // Store pour les produits favoris (offline)
      if (!db.objectStoreNames.contains('favorite_products')) {
        const store = db.createObjectStore('favorite_products', { 
          keyPath: 'barcode' 
        });
        store.createIndex('name', 'name');
      }
    };
  });
}