// キャッシュ対象を変更したら CACHE_VERSION を上げること
const CACHE_VERSION = 4;
const CACHE_NAME = `sango-support-v${CACHE_VERSION}`;
// 絵(art/)は無くても動くので、ここには入れず初回表示時に取得してキャッシュする
const APP_SHELL = ['./', 'index.html', 'app.js?v=4', 'style.css?v=2', 'icon-96.png?v=2', 'icon-180.png?v=2', 'icon-512.png'];
// 業者データなどの社内データはアプリに含めず、JSONで取り込んでIndexedDBに保存する

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
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
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
