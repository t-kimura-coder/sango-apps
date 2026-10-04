// キャッシュ対象を変更したら CACHE_VERSION を上げること
const CACHE_VERSION = 22;
const CACHE_NAME = `genba-viewer-v${CACHE_VERSION}`;
const APP_SHELL = ['./', 'index.html', 'app.js?v=20', 'demo.js?v=2', 'style.css?v=19', 'manifest.webmanifest', 'icon-96.png?v=2', 'icon-180.png?v=2', 'icon-192.png?v=2', 'icon-512.png?v=2', 'art/hero-frame.webp', 'art/hero-sky.webp', 'art/hero-icons.webp', 'art/character.webp', 'art/site-bg.webp', 'art/g1.webp', 'art/g2.webp', 'art/g3.webp', 'art/g4.webp', 'art/g5.webp', 'art/g6.webp', 'art/stage-1.webp', 'art/stage-2.webp', 'art/stage-3.webp', 'art/stage-4.webp', 'art/stage-5.webp', 'art/stage-6.webp', 'art/meeting.webp', 'art/staff.webp', 'art/weeks-head.webp'];
// 報告データ（社内データ）はキャッシュしない。PCの Box Drive フォルダから毎回読む

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // 画面は新しい版を優先（オンラインならネット、だめならキャッシュ）
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
  );
});
