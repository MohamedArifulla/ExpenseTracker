const CACHE_NAME = 'expense-tracker-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/firebase-init.js',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js' // Cache Chart.js
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});