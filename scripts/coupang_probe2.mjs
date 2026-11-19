// 우리 장보기 상품(짧은 링크)이 쿠팡 검색 상위 10개에 잡히는지 확인 + 골드박스 육아 관련 품목 확인
import crypto from 'node:crypto'; import fs from 'node:fs';
const AK = process.env.COUPANG_ACCESS_KEY, SK = process.env.COUPANG_SECRET_KEY;
const HOST = 'https://api-gateway.coupang.com', P = '/v2/providers/affiliate_open_api/apis/openapi';
const auth = (m, path, q) => { const d = new Date().toISOString().replace(/[-:]/g, '').slice(2, 15) + 'Z'; return `CEA algorithm=HmacSHA256, access-key=${AK}, signed-date=${d}, signature=${crypto.createHmac('sha256', SK).update(d + m + path + q).digest('hex')}`; };
const get = async (path, q = '') => { const r = await fetch(HOST + path + (q ? '?' + q : ''), { headers: { Authorization: auth('GET', path, q) } }); return { s: r.status, j: await r.json().catch(() => null) }; };
const src = fs.readFileSync('app/index.html', 'utf8');
const items = []; const seen = new Set();
for (const m of src.matchAll(/"([^"]+)":\s*\[\{label:"([^"]+)",\s*url:"https:\/\/link\.coupang\.com\/a\/((?:iN9|iOa)[A-Za-z0-9]+)"/g)) { if (!seen.has(m[3])) { seen.add(m[3]); items.push({ key: m[1], label: m[2], id: m[3] }); } }
console.log('items', items.length);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let hit = 0;
for (const it of items) {
  const r = await fetch('https://link.coupang.com/a/' + it.id, { redirect: 'manual' });
  const pid = ((r.headers.get('location') || '').match(/products\/(\d+)/) || [])[1];
  const res = await get(P + '/products/search', 'keyword=' + encodeURIComponent(it.label) + '&limit=10');
  const list = (res.j && res.j.data && res.j.data.productData) || [];
  const f = list.find(x => String(x.productId) === pid);
  if (f) hit++;
  console.log(`${it.key}\t${it.label}\tpid ${pid}\t${res.s}\t${f ? 'FOUND rank ' + f.rank + ' price ' + f.productPrice : 'no (top: ' + (list[0] ? list[0].productPrice + ' ' + list[0].productName.slice(0, 30) : '-') + ')'}`);
  await sleep(1500);
}
console.log('hit', hit, '/', items.length);
const g = await get(P + '/products/goldbox');
const gl = (g.j && g.j.data) || [];
const cats = {}; gl.forEach(x => cats[x.categoryName] = (cats[x.categoryName] || 0) + 1);
console.log('\ngoldbox', gl.length, JSON.stringify(cats));
gl.filter(x => /출산|유아|아기|베이비|기저귀|분유|물티슈|이유식|키즈/.test(x.categoryName + x.productName)).forEach(x => console.log('BABY', x.categoryName, x.productPrice, x.productName.slice(0, 50)));
gl.filter(x => x.categoryName === '식품').slice(0, 8).forEach(x => console.log('FOOD', x.productPrice, x.productName.slice(0, 50)));
