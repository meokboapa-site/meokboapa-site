/* 먹보 아빠의 이유식노트 — 오프라인 캐싱용 서비스워커
   전략: HTML은 "네트워크 우선, 실패시 캐시"(항상 최신 버전 시도하되 오프라인이면 저장본 사용)
        나머지 정적 파일(아이콘 등)은 "캐시 우선"

   v2 변경: 예전 버전은 모든 HTML 응답을 './index.html' 자리에 덮어썼습니다.
   그래서 /재료/소고기/ 같은 별도 페이지를 한 번 열면 앱 본체 캐시가 그 페이지로 바뀌어,
   오프라인에서 앱을 열었을 때 엉뚱한 페이지가 뜨는 문제가 있었습니다.
   이제 앱 본체(루트)만 './index.html'로 저장하고, 나머지 페이지는 각자 주소로 저장합니다. */
const CACHE_NAME = 'meokbo-cache-v316';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isHtml = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHtml) {
    let isAppShell = false;
    try {
      const p = new URL(req.url).pathname;
      isAppShell = (p === '/' || p === '/index.html');
    } catch (e) { isAppShell = false; }

    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(isAppShell ? './index.html' : req, copy))
            .catch(()=>{});
          return res;
        })
        // 오프라인: 그 페이지의 저장본을 먼저 찾고, 없으면 앱 본체로 보냄
        .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(()=>{});
      return res;
    }).catch(() => cached))
  );
});
