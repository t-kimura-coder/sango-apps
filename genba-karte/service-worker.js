// キャッシュ対象を変更したら CACHE_VERSION を上げること
const CACHE_VERSION = 3;
const CACHE_NAME = `genba-karte-v${CACHE_VERSION}`;
const APP_SHELL = ['./', 'index.html', 'app.js?v=3', 'demo.js?v=3', 'style.css?v=3', 'manifest.webmanifest', 'icon-96.png?v=1', 'icon-180.png?v=1', 'icon-192.png?v=1', 'icon-512.png?v=1',
  'art/icon-96.png', 'art/hero.webp', 'art/deco.webp', 'art/empty.webp', 'art/note.webp', 'art/tile-hiku.webp', 'art/tile-genba.webp', 'art/tile-tasu.webp', 'art/tile-taisaku.webp',
  'art/kind-house.webp', 'art/kind-reform.webp', 'art/kind-shop.webp'];
// 事例カード・現場名などの社内データはアプリに含めない。カルテパック（JSON）を取り込んで IndexedDB に保存する

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('genba-karte-') && k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // 画面は新しい版を優先（オンラインならネット、だめならキャッシュ）。電波の無い現場でも開ける
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then((r) => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
  );
});
