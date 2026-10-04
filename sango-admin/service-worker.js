// キャッシュ対象を変更したら CACHE_VERSION を上げること
const CACHE_VERSION = 5;
const CACHE_NAME = `sango-admin-v${CACHE_VERSION}`;
const APP_SHELL = ['./', 'index.html', 'app.js?v=4', 'demo.js?v=1', 'style.css?v=1', 'manifest.webmanifest', 'icon-96.png?v=2', 'icon-180.png?v=2', 'icon-192.png?v=2', 'icon-512.png?v=2'];
// 症例データ（社内データ）はキャッシュしない。PCの Box Drive フォルダから毎回読む。絵(art/)は初回表示時に取得してキャッシュする

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then((res) => { if (res.ok) { const c = res.clone(); caches.open(CACHE_NAME).then((ca) => ca.put(req, c)); } return res; }).catch(() => caches.match(req).then((r) => r || caches.match('index.html'))));
    return;
  }
  event.respondWith(caches.match(req).then((cached) => cached || fetch(req).then((res) => { if (res.ok) { const c = res.clone(); caches.open(CACHE_NAME).then((ca) => ca.put(req, c)); } return res; })));
});
