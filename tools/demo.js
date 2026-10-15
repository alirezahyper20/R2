'use strict';
// Demo mode: starts the fake Al-Waseet API + the app with sample data so you can click around.
//   npm run demo   → open http://localhost:3000   (login: demo / demo1234)
// Nothing here touches the real Al-Waseet. Demo data lives in ./demo-data (deleted on each run).
process.emitWarning = () => {};
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'demo-data');
const PORT = Number(process.env.PORT || 3000), MOCK_PORT = 4010;
const APP = `http://localhost:${PORT}`, MOCK = `http://localhost:${MOCK_PORT}`;

fs.rmSync(DATA, { recursive: true, force: true });
const kids = [
  spawn(process.execPath, ['tools/mock-alwaseet.js'], { cwd: ROOT, env: { ...process.env, MOCK_PORT }, stdio: 'inherit' }),
  spawn(process.execPath, ['server.js'], { cwd: ROOT, stdio: 'inherit',
    env: { ...process.env, PORT, DATA_DIR: DATA, ALWASEET_BASE_URL: `${MOCK}/v1/merchant`, ALWASEET_USERNAME: '', ALWASEET_PASSWORD: '' } }),
];
process.on('SIGINT', () => { kids.forEach(k => k.kill()); process.exit(0); });

let cookie = '';
async function api(method, p, body) {
  const r = await fetch(APP + p, { method, headers: { 'Content-Type': 'application/json', cookie }, body: body && JSON.stringify(body) });
  const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
  const j = await r.json(); if (!r.ok) throw new Error(p + ': ' + j.error); return j;
}
const wait = async u => { for (let i = 0; i < 80; i++) { try { await fetch(u); return; } catch { await new Promise(r => setTimeout(r, 150)); } } };
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[rnd(0, a.length - 1)];

(async () => {
  await wait(MOCK + '/v1/merchant/citys'); await wait(APP + '/api/state');
  await api('POST', '/api/setup', { username: 'demo', password: 'demo1234', display_name: 'Ali', business_name: 'هورنات بغداد' });
  await api('PUT', '/api/settings', { aw_username: 'demo', aw_password: 'demo123', aw_import_since: '2020-01-01', return_fee: '3000', customer_delivery: '5000', default_package_size: '1' });

  const products = [
    ['هورن حلزوني بوش', 'Bosch snail horn', 'BSH-01', 25000, 30, 12500],
    ['هورن هوائي مزدوج', 'Dual air horn', 'AIR-02', 45000, 15, 24000],
    ['هورن قطار 4 أبواق', 'Train horn 4-trumpet', 'TRN-04', 95000, 6, 55000],
    ['هورن ديسك 12 فولت', 'Disc horn 12V', 'DSC-12', 15000, 40, 6500],
    ['ريليه + سلك تركيب', 'Relay & wiring kit', 'KIT-01', 8000, 50, 3000],
  ];
  const ids = [];
  for (const [ar, en, sku, price, qty, cost] of products)
    ids.push((await api('POST', '/api/products', { name_ar: ar, name_en: en, sku, sale_price: price, opening_qty: qty, opening_cost: cost, low_stock: 5 })).id);
  await api('POST', '/api/purchases', { supplier: 'شركة النور للأدوات', items: [{ product_id: ids[0], qty: 20, unit_cost: 13500 }, { product_id: ids[1], qty: 10, unit_cost: 23000 }] });

  const names = ['علي حسين', 'محمد كاظم', 'حيدر جاسم', 'زينب علي', 'مصطفى عباس', 'احمد ستار', 'حسن فلاح', 'سجاد كريم', 'عمر خالد', 'يوسف ماجد'];
  const cities = [[1, [101, 102, 103]], [2, [201, 202]], [3, [301]], [4, [401]]];
  const made = [];
  for (let i = 0; i < 46; i++) {
    const [city, regs] = Math.random() < .6 ? cities[0] : pick(cities.slice(1));
    const p = rnd(0, 9) < 6 ? pick([0, 0, 3, 3, 1]) : pick([2, 4, 1]);
    const items = [{ product_id: ids[p], qty: rnd(1, 10) > 8 ? 2 : 1 }];
    if (Math.random() < .3 && p !== 4) items.push({ product_id: ids[4], qty: 1 });
    const r = await api('POST', '/api/orders', { client_name: pick(names), client_mobile: '077' + rnd(10000000, 99999999), city_id: city, region_id: pick(regs),
      location: 'قرب ' + pick(['الجامع', 'السوق', 'المدرسة', 'الساحة']), package_size: '1', items, customer_delivery: 5000, allow_negative: true });
    made.push(r.order);
  }
  // move orders along in the fake Al-Waseet
  for (const [i, o] of made.entries()) {
    const roll = Math.random();
    const st = i >= made.length - 5 ? '1' : roll < .72 ? '4' : roll < .84 ? '8' : roll < .9 ? '7' : '3';
    await fetch(`${MOCK}/__status?id=${o.qr_id}&status=${st}`);
  }
  await api('POST', '/api/aw/sync');
  await fetch(MOCK + '/__invoice');
  await api('POST', '/api/aw/sync');

  // spread history over the last 30 days so charts have shape
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(path.join(DATA, 'hornpro.db'));
  const rows = db.prepare('SELECT id FROM orders ORDER BY id').all();
  const N = rows.length;
  rows.forEach((r, i) => {
    const days = Math.round((N - 1 - i) * 29 / (N - 1));
    db.prepare(`UPDATE orders SET created_at = datetime(created_at, ?), delivered_at = CASE WHEN delivered_at IS NULL THEN NULL ELSE datetime(delivered_at, ?) END,
      closed_at = CASE WHEN closed_at IS NULL THEN NULL ELSE datetime(closed_at, ?) END WHERE id = ?`)
      .run(`-${days} days`, `-${Math.max(0, days - 2)} days`, `-${Math.max(0, days - 3)} days`, r.id);
  });
  db.exec(`UPDATE expenses SET date = (SELECT date(closed_at) FROM orders WHERE orders.id = expenses.order_id) WHERE order_id IS NOT NULL`);
  db.close();
  const d = n => { const x = new Date(); x.setDate(x.getDate() - n); return x.toLocaleString('sv-SE', { timeZone: 'Asia/Baghdad' }).slice(0, 10); };
  for (const [cat, amt, n, note] of [['rent', 400000, 28, 'إيجار المحل'], ['salaries', 350000, 27, 'راتب الموظف'], ['ads', 60000, 25, 'Facebook'],
    ['ads', 75000, 14, 'TikTok'], ['ads', 50000, 4, 'Facebook'], ['packaging', 35000, 20, 'كراتين وشريط'], ['bills', 45000, 10, 'كهرباء + انترنت']])
    await api('POST', '/api/expenses', { category: cat, amount: amt, date: d(n), note });

  console.log(`\n  ✅ Demo ready → ${APP}\n     login: demo / demo1234\n     (fake Al-Waseet at ${MOCK} — Ctrl+C to stop)\n`);
})().catch(e => { console.error(e); kids.forEach(k => k.kill()); process.exit(1); });
