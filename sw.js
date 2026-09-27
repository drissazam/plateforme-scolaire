/* Public application assets only; reports and pupil lists are never cached here. */
const CACHE_PREFIX = 'gs-mon-ecole-' + new URL(self.registration.scope).pathname;
const CACHE = CACHE_PREFIX + '-release-20260927-1';
const ASSETS = ["./", "index.html", "manifest.webmanifest", "assets/css/cairo.css", "assets/css/style-main.css", "assets/fonts/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hAc5W1Q.ttf", "assets/fonts/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hD45W1Q.ttf", "assets/fonts/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hGA5W1Q.ttf", "assets/fonts/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hL4-W1Q.ttf", "assets/fonts/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hOA-W1Q.ttf", "assets/img/apple-touch-icon.png", "assets/img/icon-192.png", "assets/img/icon-512.png", "assets/img/icon.svg", "assets/img/ministry-logo.png", "assets/img/og-preview.png", "assets/img/school-logo.png", "assets/js/app-main.js", "assets/js/logos-data.js", "assets/js/vendor/chart.umd.min.js", "assets/js/vendor/html2pdf.bundle.min.js", "assets/js/vendor/xlsx.full.min.js"];
const urls = new Set(ASSETS.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([...urls])));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(new URL('index.html', self.registration.scope).href)));
  } else if (urls.has(url.href)) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
  }
});
