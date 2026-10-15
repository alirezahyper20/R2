'use strict';
// End-to-end test against the mock Al-Waseet API. Run: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const MOCK_PORT = 4900 + Math.floor(Math.random() * 50);
const APP_PORT = 3900 + Math.floor(Math.random() * 50);
const MOCK = `http://localhost:${MOCK_PORT}`;
const APP = `http://localhost:${APP_PORT}`;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hornpro-test-'));
const procs = [];
let cookie = '';

async function waitFor(url) {
  for (let i = 0; i < 60; i++) { try { await fetch(url); return; } catch { await new Promise(r => setTimeout(r, 150)); } }
  throw new Error('timeout ' + url);
}
async function api(method, p, body) {
  const res = await fetch(APP + p, { method, headers: { 'Content-Type': 'application/json', cookie }, body: body ? JSON.stringify(body) : undefined });
  const sc = res.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
  const json = await res.json();
  if (!res.ok) { const e = new Error(`${method} ${p} → ${res.status} ${json.error}`); e.status = res.status; e.body = json; throw e; }
  return json;
}
const mock = p => fetch(MOCK + p).then(r => r.json());

test.before(async () => {
  procs.push(spawn(process.execPath, ['tools/mock-alwaseet.js'], { cwd: ROOT, env: { ...process.env, MOCK_PORT }, stdio: 'ignore' }));
  procs.push(spawn(process.execPath, ['server.js'], { cwd: ROOT, stdio: 'ignore',
    env: { ...process.env, PORT: APP_PORT, DATA_DIR: dataDir, ALWASEET_BASE_URL: `${MOCK}/v1/merchant`, ALWASEET_USERNAME: '', ALWASEET_PASSWORD: '' } }));
  await waitFor(MOCK + '/v1/merchant/citys');
  await waitFor(APP + '/api/state');
});
test.after(() => { procs.forEach(p => p.kill()); fs.rmSync(dataDir, { recursive: true, force: true }); });

const ids = {};
const today = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Baghdad' }).slice(0, 10);

test('full business flow', async (t) => {
  await t.test('setup + login', async () => {
    assert.equal((await api('GET', '/api/state')).needs_setup, true);
    await api('POST', '/api/setup', { username: 'Owner', password: 'secret123', business_name: 'Test Horns' });
    await api('POST', '/api/logout');
    await assert.rejects(api('GET', '/api/me'), /401/);
    await assert.rejects(api('POST', '/api/login', { username: 'owner', password: 'nope' }), /401/);
    await api('POST', '/api/login', { username: 'owner', password: 'secret123' });
    assert.equal((await api('GET', '/api/me')).user.role, 'admin');
  });

  await t.test('Al-Waseet credentials', async () => {
    await assert.rejects(api('POST', '/api/aw/test', { username: 'demo', password: 'bad' }), /502/);
    await api('POST', '/api/aw/test', { username: 'demo', password: 'demo123' });
    await api('PUT', '/api/settings', { aw_username: 'demo', aw_password: 'demo123', return_fee: '3000', aw_import_since: '2020-01-01' });
    const s = await api('GET', '/api/settings');
    assert.equal(s.aw_password_set, true);
    assert.equal((await api('GET', '/api/aw/cities')).length, 4);
  });

  await t.test('products, purchases, weighted average cost', async () => {
    ids.A = (await api('POST', '/api/products', { name_ar: 'هورن حلزوني', name_en: 'Snail horn', sku: 'SN-1', sale_price: 25000, opening_qty: 10, opening_cost: 12000 })).id;
    ids.B = (await api('POST', '/api/products', { name_ar: 'هورن هوائي', name_en: 'Air horn', sku: 'AIR-1', sale_price: 40000 })).id;
    await api('POST', '/api/purchases', { supplier: 'Supplier 1', items: [{ product_id: ids.A, qty: 10, unit_cost: 14000 }, { product_id: ids.B, qty: 5, unit_cost: 20000 }] });
    const ps = await api('GET', '/api/products');
    const A = ps.find(p => p.id === ids.A), B = ps.find(p => p.id === ids.B);
    assert.equal(A.stock_qty, 20); assert.equal(A.avg_cost, 13000);
    assert.equal(B.stock_qty, 5); assert.equal(B.avg_cost, 20000);
  });

  await t.test('create orders and send to Al-Waseet', async () => {
    const base = { client_mobile: '07701234567', location: 'قرب الجامع', package_size: '1' };
    const o1 = await api('POST', '/api/orders', { ...base, client_name: 'علي', city_id: 1, region_id: 101, items: [{ product_id: ids.A, qty: 2 }], customer_delivery: 5000 });
    assert.equal(o1.aw_error, null); assert.ok(o1.order.qr_id); assert.equal(o1.order.price, 55000); assert.equal(o1.order.delivery_fee, 5000);
    assert.equal(o1.order.client_mobile, '+9647701234567');
    const o2 = await api('POST', '/api/orders', { ...base, client_name: 'حسن', city_id: 2, region_id: 201, items: [{ product_id: ids.B, qty: 1 }], customer_delivery: 5000 });
    const o3 = await api('POST', '/api/orders', { ...base, client_name: 'زيد', city_id: 1, region_id: 102, items: [{ product_id: ids.A, qty: 1 }], price: 30000 });
    Object.assign(ids, { o1: o1.order, o2: o2.order, o3: o3.order });
    await assert.rejects(api('POST', '/api/orders', { ...base, client_name: 'x', city_id: 1, region_id: 101, items: [{ product_id: ids.B, qty: 50 }] }), /409/);
    await assert.rejects(api('POST', '/api/orders', { ...base, client_mobile: '123', client_name: 'x', city_id: 1, region_id: 101, items: [{ product_id: ids.A, qty: 1 }] }), /400/);
    const ps = await api('GET', '/api/products');
    assert.equal(ps.find(p => p.id === ids.A).stock_qty, 17);
    assert.equal(ps.find(p => p.id === ids.B).stock_qty, 4);
  });

  await t.test('edit a pending order (synced to Al-Waseet)', async () => {
    const e = await api('PUT', `/api/orders/${ids.o3.id}`, { client_name: 'زيد علي', location: 'الكرادة داخل' });
    assert.equal(e.client_name, 'زيد علي');
  });

  await t.test('sync statuses: delivered, returned, in transit', async () => {
    await mock(`/__status?id=${ids.o1.qr_id}&status=4`);
    await mock(`/__status?id=${ids.o2.qr_id}&status=8`);
    await mock(`/__status?id=${ids.o3.qr_id}&status=3`);
    const st = await api('POST', '/api/aw/sync');
    assert.equal(st.errors.length, 0, JSON.stringify(st.errors));
    assert.equal((await api('GET', `/api/orders/${ids.o1.id}`)).state, 'delivered');
    assert.equal((await api('GET', `/api/orders/${ids.o2.id}`)).state, 'returned');
    assert.equal((await api('GET', `/api/orders/${ids.o3.id}`)).state, 'in_transit');
    const B = (await api('GET', '/api/products')).find(p => p.id === ids.B);
    assert.equal(B.stock_qty, 5, 'returned item goes back to stock');
    await assert.rejects(api('PUT', `/api/orders/${ids.o3.id}`, { client_name: 'x' }), /400/);
  });

  await t.test('expenses + P&L numbers', async () => {
    await api('POST', '/api/expenses', { category: 'ads', amount: 20000, note: 'Facebook' });
    await api('POST', '/api/expenses', { category: 'rent', amount: 50000 });
    const s = await api('GET', `/api/reports/summary?from=${today}&to=${today}`);
    assert.equal(s.revenue, 55000);
    assert.equal(s.cogs, 26000);
    assert.equal(s.gross_profit, 29000);
    assert.equal(s.expenses_by_category.delivery, 5000);
    assert.equal(s.expenses_by_category.returns, 3000);
    assert.equal(s.expenses, 78000);
    assert.equal(s.net_profit, -49000);
    assert.equal(s.inventory.value, 17 * 13000 + 5 * 20000);
    assert.equal(s.inventory.with_couriers_value, 13000);
    assert.equal(s.receivable.amount, 50000);
    assert.equal(s.returned_orders, 1);
    assert.equal(s.return_rate, 0.5);
    assert.equal(s.daily.at(-1).net, -49000);
  });

  await t.test('invoices: fetch + receive', async () => {
    await mock('/__invoice');
    await api('POST', '/api/aw/sync');
    const list = await api('GET', '/api/invoices');
    assert.equal(list.length, 1); assert.equal(list[0].merchant_price, 50000);
    const detail = await api('GET', `/api/invoices/${list[0].id}`);
    assert.equal(detail.orders.length, 1);
    await api('POST', `/api/invoices/${list[0].id}/receive`);
    const s = await api('GET', `/api/reports/summary?from=${today}&to=${today}`);
    assert.equal(s.receivable.amount, 0);
  });

  await t.test('order created in the Al-Waseet app is imported and auto-linked', async () => {
    const tok = (await (await fetch(`${MOCK}/v1/merchant/login`, { method: 'POST', body: (() => { const f = new FormData(); f.append('username', 'demo'); f.append('password', 'demo123'); return f; })() })).json()).data.token;
    const f = new FormData();
    Object.entries({ client_name: 'مريم', client_mobile: '+9647800000000', city_id: 1, region_id: 103, location: 'x', type_name: 'هورن هوائي', items_number: 1, price: 45000, package_size: 1, replacement: 0 })
      .forEach(([k, v]) => f.append(k, String(v)));
    await fetch(`${MOCK}/v1/merchant/create-order?token=${encodeURIComponent(tok)}`, { method: 'POST', body: f });
    const st = await api('POST', '/api/aw/sync');
    assert.equal(st.imported, 1);
    const imp = (await api('GET', '/api/orders?q=مريم')).rows[0];
    assert.equal(imp.source, 'alwaseet'); assert.equal(imp.item_lines, 1);
    assert.equal((await api('GET', '/api/products')).find(p => p.id === ids.B).stock_qty, 4);
  });

  await t.test('stock write-off counts as expense; cancel restocks', async () => {
    await api('POST', `/api/products/${ids.A}/adjust`, { delta: -1, note: 'broken' });
    const s = await api('GET', `/api/reports/summary?from=${today}&to=${today}`);
    assert.equal(s.expenses_by_category.write_offs, 13000);
    const o = await api('POST', '/api/orders', { client_name: 'test', client_mobile: '07800000001', city_id: 1, region_id: 101, location: 'x', package_size: '1', items: [{ product_id: ids.A, qty: 3 }], send: false });
    assert.equal((await api('GET', '/api/products')).find(p => p.id === ids.A).stock_qty, 13);
    await api('DELETE', `/api/orders/${o.order.id}`);
    assert.equal((await api('GET', '/api/products')).find(p => p.id === ids.A).stock_qty, 16);
  });

  await t.test('staff cannot see money', async () => {
    await api('POST', '/api/users', { username: 'staff1', password: 'staffpass1', role: 'staff' });
    await api('POST', '/api/logout');
    await api('POST', '/api/login', { username: 'staff1', password: 'staffpass1' });
    await assert.rejects(api('GET', '/api/reports/summary'), /403/);
    assert.equal((await api('GET', '/api/products'))[0].avg_cost, undefined);
  });
});
