const CACHE = 'logx-drive-v5_0';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/app.js',
  './js/config.js',
  './js/utils.js',
  './js/state.js',
  './js/drive.js',
  './js/auth.js',
  './js/ui/render.js',
  './js/ui/status.js',
  './js/ui/health.js',
  './js/ui/quick-log.js',
  './js/ui/type-modal.js',
  './js/ui/log-modal.js',
  './js/ui/recent.js',
  './js/ui/calendar.js',
  './js/ui/chart.js'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); });
self.addEventListener('fetch', e => {
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) return cached;
    try { return await fetch(e.request); }
    catch { return new Response('Offline'); }
  })());
});
