// 하루 세 번: 장보기 상품 가격 기록 → 7일 평균보다 5% 이상 싸면 '가격 내려감', 골드박스에서 육아 특가 골라내기
// 결과: data/prices.json (화면이 읽는 파일), data/price-history.json (기록)
import crypto from 'node:crypto'; import fs from 'node:fs';
const AK = process.env.COUPANG_ACCESS_KEY, SK = process.env.COUPANG_SECRET_KEY;
const HOST = 'https://api-gateway.coupang.com', P = '/v2/providers/affiliate_open_api/apis/openapi';
const auth = (m, path, q) => { const d = new Date().toISOString().replace(/[-:]/g, '').slice(2, 15) + 'Z'; return `CEA algorithm=HmacSHA256, access-key=${AK}, signed-date=${d}, signature=${crypto.createHmac('sha256', SK).update(d + m + path + q).digest('hex')}`; };
const get = async (path, q = '') => { const r = await fetch(HOST + path + (q ? '?' + q : ''), { headers: { Authorization: auth('GET', path, q) } }); if (r.status === 429) throw new Error('rate limit'); return r.ok ? r.json() : null; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync('data', { recursive: true });
const HIST = 'data/price-history.json';
const hist = fs.existsSync(HIST) ? JSON.parse(fs.readFileSync(HIST, 'utf8')) : {};
const now = Date.now(), kst = new Date(now + 9 * 3600e3), h = kst.getUTCHours();
const asof = h < 12 ? `오전 ${h}시` : (h < 18 ? `오후 ${h - 12}시` : `밤 ${h - 12}시`);

const src = fs.readFileSync('app/index.html', 'utf8');
const items = []; const seen = new Set();
for (const m of src.matchAll(/"([^"]+)":\s*\[\{label:"([^"]+)",\s*url:"https:\/\/link\.coupang\.com\/a\/((?:iN9|iOa)[A-Za-z0-9]+)"/g)) if (!seen.has(m[3])) { seen.add(m[3]); items.push({ label: m[2], id: m[3] }); }
items.splice(25);                                   // 시간당 호출 한도(약 30회) 아래로

const out = { asof, updated: new Date(now).toISOString(), items: {}, deals: [] };
for (const it of items) {
  try {
    const r = await fetch('https://link.coupang.com/a/' + it.id, { redirect: 'manual' });
    const pid = ((r.headers.get('location') || '').match(/products\/(\d+)/) || [])[1];
    const j = await get(P + '/products/search', 'keyword=' + encodeURIComponent(it.label) + '&limit=10');
    const f = pid && ((j && j.data && j.data.productData) || []).find(x => String(x.productId) === pid);
    if (f) {
      const rec = (hist[it.id] = (hist[it.id] || []).filter(x => now - x.t < 7 * 864e5));
      const past = rec.slice();                     // 이번 가격을 넣기 전 7일 기록
      rec.push({ t: now, p: f.productPrice });
      const days = past.length ? (now - past[0].t) / 864e5 : 0;
      const avg = past.length ? past.reduce((a, x) => a + x.p, 0) / past.length : 0;
      const o = { price: f.productPrice };
      if (days >= 6 && f.productPrice <= avg * 0.95) o.drop = Math.round((avg - f.productPrice) / 10) * 10;
      out.items[it.id] = o;
    }
  } catch (e) { console.log('skip', it.label, e.message); if (/rate/.test(e.message)) break; }
  await sleep(1500);
}
try {
  const g = await get(P + '/products/goldbox');
  out.deals = ((g && g.data) || []).filter(x => /출산|유아/.test(x.categoryName) || /아기|베이비|유아|기저귀|분유|물티슈|이유식|젖병|키즈|아동|신생아/.test(x.productName))
    .slice(0, 3).map(x => ({ name: x.productName.replace(/\s+/g, ' ').slice(0, 40), price: x.productPrice, url: x.productUrl }));
} catch (e) { console.log('goldbox', e.message); }
fs.writeFileSync(HIST, JSON.stringify(hist));
fs.writeFileSync('data/prices.json', JSON.stringify(out));
console.log('items', Object.keys(out.items).length, 'drops', Object.values(out.items).filter(x => x.drop).length, 'deals', out.deals.length);
