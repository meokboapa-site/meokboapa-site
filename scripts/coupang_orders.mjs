// 최근 14일 주문 상세: 상품명·subId 확인 (블로그 링크 효과 확인용)
import crypto from 'node:crypto';
const AK = process.env.COUPANG_ACCESS_KEY, SK = process.env.COUPANG_SECRET_KEY;
const HOST = 'https://api-gateway.coupang.com', P = '/v2/providers/affiliate_open_api/apis/openapi/reports/orders';
const auth = (m, path, q) => { const d = new Date().toISOString().replace(/[-:]/g, '').slice(2, 15) + 'Z'; return `CEA algorithm=HmacSHA256, access-key=${AK}, signed-date=${d}, signature=${crypto.createHmac('sha256', SK).update(d + m + path + q).digest('hex')}`; };
const ymd = d => new Date(d + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
const q = `startDate=${ymd(Date.now() - 13 * 864e5)}&endDate=${ymd(Date.now())}`;
const r = await fetch(HOST + P + '?' + q, { headers: { Authorization: auth('GET', P, q) } });
const j = await r.json(); const d = j.data || [];
console.log('status', r.status, 'rows', d.length, 'keys', Object.keys(d[0] || {}).join(','));
const subs = {}; d.forEach(x => { const k = (x.subId || '-') + '/' + (x.trackingCode || ''); subs[k] = (subs[k] || 0) + 1; });
console.log('by subId', JSON.stringify(subs));
d.filter(x => /다짐|한우|소고기|우둔|홍두깨/.test(x.productName || '')).forEach(x => console.log('BEEF', x.date, x.productName, x.quantity, x.gmv, x.commission));
