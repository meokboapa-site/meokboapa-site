// 쿠팡 파트너스 API 시험 조회: 응답에 어떤 필드(가격·할인율 등)가 오는지만 확인. 키는 GitHub Secrets에서만 읽음.
import crypto from 'node:crypto';
const AK = process.env.COUPANG_ACCESS_KEY, SK = process.env.COUPANG_SECRET_KEY;
if (!AK || !SK) { console.log('키 없음'); process.exit(1); }
const HOST = 'https://api-gateway.coupang.com';
function auth(method, path, query) {
  const d = new Date().toISOString().replace(/[-:]/g, '').slice(2, 15) + 'Z';
  const sig = crypto.createHmac('sha256', SK).update(d + method + path + query).digest('hex');
  return `CEA algorithm=HmacSHA256, access-key=${AK}, signed-date=${d}, signature=${sig}`;
}
async function call(method, path, query = '', body) {
  const r = await fetch(HOST + path + (query ? '?' + query : ''), { method, headers: { Authorization: auth(method, path, query), 'Content-Type': 'application/json;charset=UTF-8' }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  return { status: r.status, j };
}
const P = '/v2/providers/affiliate_open_api/apis/openapi';
const show = (label, res) => { console.log('\n=== ' + label + ' status ' + res.status); const d = res.j && res.j.data; const list = Array.isArray(d) ? d : (d && d.productData) || []; console.log('keys:', list[0] ? Object.keys(list[0]).join(',') : JSON.stringify(res.j).slice(0, 300)); list.slice(0, 3).forEach(x => console.log(JSON.stringify(Object.fromEntries(Object.entries(x).filter(([k]) => !/url|image/i.test(k)))))); };
show('search 애호박', await call('GET', P + '/products/search', 'keyword=' + encodeURIComponent('애호박') + '&limit=5'));
show('goldbox', await call('GET', P + '/products/goldbox', ''));
// 짧은 링크가 어떤 상품번호로 가는지
for (const id of ['iN9GJxIrQr', 'iN9DDr8500']) {
  const r = await fetch('https://link.coupang.com/a/' + id, { redirect: 'manual' });
  const loc = r.headers.get('location') || ''; const m = loc.match(/products\/(\d+)/); const v = loc.match(/vendorItemId=(\d+)/);
  console.log('\nlink', id, '->', r.status, 'productId', m && m[1], 'vendorItemId', v && v[1]);
}
