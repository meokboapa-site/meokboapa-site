/* 먹보 아빠의 이유식노트 — 오프라인 캐싱용 서비스워커
   전략: HTML은 "네트워크 우선, 실패시 캐시"(항상 최신 버전 시도하되 오프라인이면 저장본 사용)
        나머지 정적 파일(아이콘 등)은 "캐시 우선"

   v2 변경: 예전 버전은 모든 HTML 응답을 './index.html' 자리에 덮어썼습니다.
   그래서 /재료/소고기/ 같은 별도 페이지를 한 번 열면 앱 본체 캐시가 그 페이지로 바뀌어,
   오프라인에서 앱을 열었을 때 엉뚱한 페이지가 뜨는 문제가 있었습니다.
   이제 앱 본체(루트)만 './index.html'로 저장하고, 나머지 페이지는 각자 주소로 저장합니다. */
const CACHE_NAME = 'meokbo-cache-v358';
/* 일러스트(/dogam/)는 버전이 바뀌어도 지우지 않는 별도 캐시 + "저장본 먼저 보여주고 뒤에서 갱신" 방식
   → 배포할 때마다 이미지를 다시 받지 않아 빠르고 데이터도 아낌 */
const IMG_CACHE = 'meokbo-img-v1';
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
      Promise.all(names.filter((n) => n !== CACHE_NAME && n !== IMG_CACHE).map((n) => caches.delete(n)))
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

  /* a2hs.js(안내 카드 스크립트)는 자주 바뀌므로 "네트워크 우선" — 옛 저장본이 계속 뜨는 문제 방지 */
  try {
    if (new URL(req.url).pathname === '/a2hs.js') {
      event.respondWith(
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(()=>{});
          return res;
        }).catch(() => caches.match(req, { ignoreSearch: true }))
      );
      return;
    }
  } catch (e) {}

  /* 가격 파일(/data/)은 하루 세 번 바뀌므로 네트워크 우선 */
  try {
    if (new URL(req.url).pathname.startsWith('/data/')) {
      event.respondWith(fetch(req).catch(() => caches.match(req, { ignoreSearch: true })));
      return;
    }
  } catch (e) {}

  let isDogamImg = false;
  try { isDogamImg = new URL(req.url).pathname.startsWith('/dogam/'); } catch (e) {}
  if (isDogamImg) {
    event.respondWith(
      caches.open(IMG_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const net = fetch(req).then((res) => { if (res && res.ok) cache.put(req, res.clone()).catch(()=>{}); return res; }).catch(() => cached);
          return cached || net;
        })
      )
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
