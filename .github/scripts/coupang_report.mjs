// 쿠팡 파트너스 실적(클릭·주문·수익) 일별 조회 — 최근 14일
import crypto from 'node:crypto';
const AK = process.env.COUPANG_ACCESS_KEY, SK = process.env.COUPANG_SECRET_KEY;
const HOST = 'https://api-gateway.coupang.com', P = '/v2/providers/affiliate_open_api/apis/openapi/reports';
const auth = (m, path, q) => { const d = new Date().toISOString().replace(/[-:]/g, '').slice(2, 15) + 'Z'; return `CEA algorithm=HmacSHA256, access-key=${AK}, signed-date=${d}, signature=${crypto.createHmac('sha256', SK).update(d + m + path + q).digest('hex')}`; };
const get = async (path, q) => { const r = await fetch(HOST + path + '?' + q, { headers: { Authorization: auth('GET', path, q) } }); return { s: r.status, j: await r.json().catch(() => null) }; };
const ymd = d => new Date(d + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
const end = ymd(Date.now()), start = ymd(Date.now() - 13 * 864e5);
const q = `startDate=${start}&endDate=${end}`;
const rows = {};
for (const k of ['clicks', 'orders', 'cancels', 'commission']) {
  const r = await get(P + '/' + k, q);
  if (r.s !== 200) { console.log(k, r.s, JSON.stringify(r.j).slice(0, 200)); continue; }
  for (const x of (r.j.data || [])) { const d = x.date; rows[d] = rows[d] || {}; 
    if (k === 'clicks') rows[d].clicks = (rows[d].clicks || 0) + (x.click || 0);
    if (k === 'orders') { rows[d].orders = (rows[d].orders || 0) + (x.order || 0); rows[d].gmv = (rows[d].gmv || 0) + (x.gmv || 0); }
    if (k === 'cancels') rows[d].cancel = (rows[d].cancel || 0) + (x.order || 0);
    if (k === 'commission') rows[d].comm = (rows[d].comm || 0) + (x.commission || 0);
  }
  if (k === 'clicks') console.log('sample keys', Object.keys((r.j.data || [])[0] || {}).join(','));
}
console.log('date\tclicks\torders\tgmv\tcomm');
Object.keys(rows).sort().forEach(d => { const r = rows[d]; console.log([d, r.clicks || 0, r.orders || 0, r.gmv || 0, r.comm || 0].join('\t')); });
