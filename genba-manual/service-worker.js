// キャッシュ対象を変更したら CACHE_VERSION を上げること（APP_VERSIONと合わせなくてOK、SW側だけの独立カウンタ）
const CACHE_VERSION = 4;
const CACHE_NAME = `genba-photo-v${CACHE_VERSION}`;

const APP_SHELL = ['./', 'index.html', 'app.js?v=4', 'style.css?v=4', 'icon-96.png?v=2', 'icon-180.png?v=2', 'icon-512.png'];
// マニュアル（社内データ）はアプリに含めず、JSONで取り込んでIndexedDBに保存する

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((res) => res || caches.match('index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
