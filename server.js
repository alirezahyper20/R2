'use strict';
process.env.TZ = process.env.TZ || 'Asia/Baghdad';
// Hide node:sqlite "experimental" warning noise in logs.
const emitWarning = process.emitWarning;
process.emitWarning = (w, ...a) => (String(w).includes('SQLite') ? undefined : emitWarning.call(process, w, ...a));

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { get, all, run, tx, getSetting, setSetting } = require('./src/db');
const sec = require('./src/security');
const inv = require('./src/inventory');
const orders = require('./src/orders');
const reports = require('./src/reports');
const sync = require('./src/sync');
const aw = require('./src/alwaseet');
const { now, today, isDate, int, str, httpError, required } = require('./src/util');

const PORT = int(process.env.PORT, 3000);
const PUBLIC = path.join(__dirname, 'public');
const COOKIE = 'hp_session';
const SECURE_COOKIE = process.env.COOKIE_SECURE === '1';

// ---------------- tiny router ----------------
const routes = [];
const route = (method, pattern, opts, handler) => {
  if (typeof opts === 'function') { handler = opts; opts = {}; }
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  routes.push({ method, re, keys, handler, auth: opts.auth ?? 'user' });
};

function send(res, status, data, headers = {}) {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': typeof data === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > 1e6) { reject(httpError(413, 'Body too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(httpError(400, 'Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

const parseCookies = h => Object.fromEntries((h || '').split(';').map(s => s.trim().split('=')).filter(p => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
const cookie = (v, maxAge) => `${COOKIE}=${v}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${SECURE_COOKIE ? '; Secure' : ''}`;
const isAdmin = u => u && u.role === 'admin';
const needAdmin = u => { if (!isAdmin(u)) throw httpError(403, 'Admins only'); };

// ---------------- auth ----------------
route('GET', '/api/state', { auth: 'none' }, () => ({
  needs_setup: get('SELECT COUNT(*) n FROM users').n === 0,
  setup_code_required: !!process.env.SETUP_CODE,
  business_name: getSetting('business_name'),
}));

route('POST', '/api/setup', { auth: 'none' }, (ctx) => {
  if (get('SELECT COUNT(*) n FROM users').n > 0) throw httpError(400, 'Already set up');
  const b = ctx.body; required(b, ['username', 'password']);
  if (process.env.SETUP_CODE && String(b.setup_code || '').trim() !== process.env.SETUP_CODE) {
    sec.loginFailed(ctx.ip); throw httpError(403, 'Wrong setup code');
  }
  if (String(b.password).length < 8) throw httpError(400, 'Password must be at least 8 characters');
  const { hash, salt } = sec.hashPassword(b.password);
  const r = run('INSERT INTO users(username, display_name, pass_hash, salt, role, created_at) VALUES(?,?,?,?,?,?)',
    str(b.username, 60).toLowerCase(), str(b.display_name, 80) || b.username, hash, salt, 'admin', now());
  if (b.business_name) setSetting('business_name', str(b.business_name, 100));
  const token = sec.createSession(Number(r.lastInsertRowid));
  ctx.headers['Set-Cookie'] = cookie(token, sec.SESSION_DAYS * 86400);
  return { ok: true };
});

route('POST', '/api/login', { auth: 'none' }, (ctx) => {
  const ip = ctx.ip;
  if (!sec.loginAllowed(ip)) throw httpError(429, 'Too many attempts, try again in 15 minutes');
  const u = get('SELECT * FROM users WHERE username = ? AND active = 1', str(ctx.body.username, 60).toLowerCase());
  if (!u || !sec.verifyPassword(ctx.body.password || '', u.pass_hash, u.salt)) { sec.loginFailed(ip); throw httpError(401, 'Wrong username or password'); }
  sec.loginOk(ip);
  ctx.headers['Set-Cookie'] = cookie(sec.createSession(u.id), sec.SESSION_DAYS * 86400);
  return { ok: true };
});

route('POST', '/api/logout', { auth: 'none' }, (ctx) => {
  sec.destroySession(ctx.token);
  ctx.headers['Set-Cookie'] = cookie('', 0);
  return { ok: true };
});

route('GET', '/api/me', (ctx) => ({ user: ctx.user, business_name: getSetting('business_name'),
  aw_configured: aw.isConfigured(), aw_last_sync: getSetting('aw_last_sync') }));

route('POST', '/api/me/password', (ctx) => {
  const u = get('SELECT * FROM users WHERE id = ?', ctx.user.id);
  if (!sec.verifyPassword(ctx.body.current || '', u.pass_hash, u.salt)) throw httpError(400, 'Current password is wrong');
  if (String(ctx.body.password || '').length < 8) throw httpError(400, 'Password must be at least 8 characters');
  const { hash, salt } = sec.hashPassword(ctx.body.password);
  run('UPDATE users SET pass_hash = ?, salt = ? WHERE id = ?', hash, salt, u.id);
  run('DELETE FROM sessions WHERE user_id = ? AND token != ?', u.id, ctx.token);
  return { ok: true };
});

// ---------------- users (admin) ----------------
route('GET', '/api/users', (ctx) => { needAdmin(ctx.user); return all('SELECT id, username, display_name, role, active, created_at FROM users ORDER BY id'); });
route('POST', '/api/users', (ctx) => {
  needAdmin(ctx.user); const b = ctx.body; required(b, ['username', 'password']);
  if (String(b.password).length < 8) throw httpError(400, 'Password must be at least 8 characters');
  if (get('SELECT id FROM users WHERE username = ?', str(b.username, 60).toLowerCase())) throw httpError(400, 'Username exists');
  const { hash, salt } = sec.hashPassword(b.password);
  run('INSERT INTO users(username, display_name, pass_hash, salt, role, created_at) VALUES(?,?,?,?,?,?)',
    str(b.username, 60).toLowerCase(), str(b.display_name, 80) || b.username, hash, salt, b.role === 'admin' ? 'admin' : 'staff', now());
  return { ok: true };
});
route('PUT', '/api/users/:id', (ctx) => {
  needAdmin(ctx.user); const id = int(ctx.params.id), b = ctx.body;
  if (id === ctx.user.id && (b.active === 0 || b.role === 'staff')) throw httpError(400, 'You cannot demote or disable yourself');
  if (b.display_name != null) run('UPDATE users SET display_name = ? WHERE id = ?', str(b.display_name, 80), id);
  if (b.role) run('UPDATE users SET role = ? WHERE id = ?', b.role === 'admin' ? 'admin' : 'staff', id);
  if (b.active != null) { run('UPDATE users SET active = ? WHERE id = ?', b.active ? 1 : 0, id); if (!b.active) run('DELETE FROM sessions WHERE user_id = ?', id); }
  if (b.password) {
    if (String(b.password).length < 8) throw httpError(400, 'Password must be at least 8 characters');
    const { hash, salt } = sec.hashPassword(b.password);
    run('UPDATE users SET pass_hash = ?, salt = ? WHERE id = ?', hash, salt, id);
    run('DELETE FROM sessions WHERE user_id = ?', id);
  }
  return { ok: true };
});

// ---------------- products & inventory ----------------
function productOut(p, user) { if (!isAdmin(user)) delete p.avg_cost; return p; }

route('GET', '/api/products', (ctx) => {
  const showAll = ctx.query.all === '1';
  return all(`SELECT * FROM products ${showAll ? '' : 'WHERE active = 1'} ORDER BY name_ar`).map(p => productOut(p, ctx.user));
});
route('POST', '/api/products', (ctx) => {
  needAdmin(ctx.user); const b = ctx.body; required(b, ['name_ar']);
  if (b.sku && get('SELECT id FROM products WHERE sku = ?', str(b.sku, 60))) throw httpError(400, 'SKU already exists');
  return tx(() => {
    const r = run('INSERT INTO products(sku, name_ar, name_en, sale_price, low_stock, created_at) VALUES(?,?,?,?,?,?)',
      str(b.sku, 60) || null, str(b.name_ar, 150), str(b.name_en, 150), int(b.sale_price), int(b.low_stock, 5), now());
    const id = Number(r.lastInsertRowid);
    if (int(b.opening_qty) > 0) inv.addStock(id, int(b.opening_qty), int(b.opening_cost), 'opening', null, null, 'Opening stock', ctx.user.id);
    return get('SELECT * FROM products WHERE id = ?', id);
  });
});
route('PUT', '/api/products/:id', (ctx) => {
  needAdmin(ctx.user); const id = int(ctx.params.id), b = ctx.body;
  const p = get('SELECT * FROM products WHERE id = ?', id); if (!p) throw httpError(404, 'Not found');
  if (b.sku && get('SELECT id FROM products WHERE sku = ? AND id != ?', str(b.sku, 60), id)) throw httpError(400, 'SKU already exists');
  run('UPDATE products SET sku=?, name_ar=?, name_en=?, sale_price=?, low_stock=?, active=? WHERE id=?',
    b.sku != null ? (str(b.sku, 60) || null) : p.sku, b.name_ar != null ? str(b.name_ar, 150) : p.name_ar,
    b.name_en != null ? str(b.name_en, 150) : p.name_en, b.sale_price != null ? int(b.sale_price) : p.sale_price,
    b.low_stock != null ? int(b.low_stock) : p.low_stock, b.active != null ? (b.active ? 1 : 0) : p.active, id);
  return get('SELECT * FROM products WHERE id = ?', id);
});
route('POST', '/api/products/:id/adjust', (ctx) => {
  needAdmin(ctx.user); const id = int(ctx.params.id), delta = int(ctx.body.delta);
  if (!delta) throw httpError(400, 'Quantity change is required');
  const p = get('SELECT * FROM products WHERE id = ?', id); if (!p) throw httpError(404, 'Not found');
  tx(() => {
    const note = str(ctx.body.note, 200) || null;
    if (delta > 0) inv.addStock(id, delta, ctx.body.unit_cost != null && ctx.body.unit_cost !== '' ? int(ctx.body.unit_cost) : p.avg_cost, 'adjust', null, null, note, ctx.user.id);
    else inv.removeStock(id, -delta, 'adjust', null, null, note, ctx.user.id);
  });
  return get('SELECT * FROM products WHERE id = ?', id);
});
route('GET', '/api/products/:id/movements', (ctx) => {
  needAdmin(ctx.user);
  return all(`SELECT m.*, o.qr_id FROM stock_movements m LEFT JOIN orders o ON m.ref_type='order' AND o.id = m.ref_id
              WHERE m.product_id = ? ORDER BY m.id DESC LIMIT 200`, int(ctx.params.id));
});

// ---------------- purchases (stock in) ----------------
route('GET', '/api/purchases', (ctx) => {
  needAdmin(ctx.user);
  const rows = all('SELECT * FROM purchases ORDER BY date DESC, id DESC LIMIT 200');
  for (const r of rows) r.items = all(`SELECT pi.*, p.name_ar, p.name_en FROM purchase_items pi JOIN products p ON p.id = pi.product_id WHERE purchase_id = ?`, r.id);
  return rows;
});
route('POST', '/api/purchases', (ctx) => {
  needAdmin(ctx.user); const b = ctx.body;
  const items = (b.items || []).map(i => ({ product_id: int(i.product_id), qty: int(i.qty), unit_cost: int(i.unit_cost) })).filter(i => i.product_id && i.qty > 0);
  if (!items.length) throw httpError(400, 'Add at least one product');
  const date = isDate(b.date) ? b.date : today();
  return tx(() => {
    const total = items.reduce((s, i) => s + i.qty * i.unit_cost, 0);
    const r = run('INSERT INTO purchases(supplier, date, total, note, user_id, created_at) VALUES(?,?,?,?,?,?)',
      str(b.supplier, 120), date, total, str(b.note, 300), ctx.user.id, now());
    const id = Number(r.lastInsertRowid);
    for (const i of items) {
      run('INSERT INTO purchase_items(purchase_id, product_id, qty, unit_cost) VALUES(?,?,?,?)', id, i.product_id, i.qty, i.unit_cost);
      inv.addStock(i.product_id, i.qty, i.unit_cost, 'purchase', 'purchase', id, str(b.supplier, 120) || null, ctx.user.id);
    }
    return { id, total };
  });
});
route('DELETE', '/api/purchases/:id', (ctx) => {
  needAdmin(ctx.user); const id = int(ctx.params.id);
  if (!get('SELECT id FROM purchases WHERE id = ?', id)) throw httpError(404, 'Not found');
  tx(() => {
    for (const i of all('SELECT * FROM purchase_items WHERE purchase_id = ?', id)) {
      const p = get('SELECT stock_qty, avg_cost FROM products WHERE id = ?', i.product_id);
      const left = p.stock_qty - i.qty;
      const avg = left > 0 ? Math.max(0, (p.stock_qty * p.avg_cost - i.qty * i.unit_cost) / left) : p.avg_cost;
      run('UPDATE products SET stock_qty = ?, avg_cost = ? WHERE id = ?', left, avg, i.product_id);
      run(`INSERT INTO stock_movements(product_id, type, qty, unit_cost, ref_type, ref_id, note, user_id, created_at)
           VALUES(?, 'purchase', ?, ?, 'purchase', ?, 'Purchase deleted', ?, ?)`, i.product_id, -i.qty, i.unit_cost, id, ctx.user.id, now());
    }
    run('DELETE FROM purchases WHERE id = ?', id);
  });
  return { ok: true };
});

// ---------------- orders ----------------
route('GET', '/api/orders', (ctx) => orders.listOrders(ctx.query));
route('GET', '/api/orders/:id', (ctx) => orders.loadOrder(int(ctx.params.id)));
route('POST', '/api/orders', async (ctx) => {
  const id = orders.createLocal(ctx.body, ctx.user.id);
  let aw_error = null;
  if (ctx.body.send !== false) {
    try { await orders.sendToAlWaseet(id); } catch (e) { aw_error = e.message; }
  }
  return { order: orders.loadOrder(id), aw_error };
});
route('PUT', '/api/orders/:id', (ctx) => orders.editOrder(int(ctx.params.id), ctx.body, ctx.user.id));
route('POST', '/api/orders/:id/send', (ctx) => orders.sendToAlWaseet(int(ctx.params.id)));
route('POST', '/api/orders/:id/items', (ctx) => orders.setItems(int(ctx.params.id), ctx.body.items, ctx.user.id));
route('POST', '/api/orders/:id/cancel', (ctx) => orders.cancelOrder(int(ctx.params.id), ctx.user.id));
route('POST', '/api/orders/:id/state', (ctx) => {
  needAdmin(ctx.user);
  const id = int(ctx.params.id);
  tx(() => orders.applyState(id, ctx.body.state, { userId: ctx.user.id }));
  return orders.loadOrder(id);
});
route('POST', '/api/orders/:id/refresh', async (ctx) => {
  const o = orders.loadOrder(int(ctx.params.id));
  if (!o.aw_id && !o.qr_id) throw httpError(400, 'Order not sent to Al-Waseet');
  await sync.syncOrderIds([o.aw_id || o.qr_id]);
  return orders.loadOrder(o.id);
});
route('DELETE', '/api/orders/:id', (ctx) => { orders.deleteOrder(int(ctx.params.id), ctx.user.id); return { ok: true }; });

// ---------------- expenses ----------------
route('GET', '/api/expenses', (ctx) => {
  needAdmin(ctx.user);
  const { from, to } = reports.range(ctx.query.from, ctx.query.to);
  const cat = ctx.query.category;
  return all(`SELECT e.*, o.qr_id FROM expenses e LEFT JOIN orders o ON o.id = e.order_id
              WHERE e.date BETWEEN ? AND ? ${cat ? 'AND e.category = ?' : ''} ORDER BY e.date DESC, e.id DESC`,
    ...(cat ? [from, to, cat] : [from, to]));
});
function expenseInput(b) {
  required(b, ['category', 'amount']);
  if (!reports.EXPENSE_CATEGORIES.includes(b.category)) throw httpError(400, 'Unknown category');
  const amount = int(b.amount); if (amount <= 0) throw httpError(400, 'Amount must be positive');
  return { date: isDate(b.date) ? b.date : today(), category: b.category, amount, note: str(b.note, 300) };
}
route('POST', '/api/expenses', (ctx) => {
  needAdmin(ctx.user); const e = expenseInput(ctx.body);
  const r = run('INSERT INTO expenses(date, category, amount, note, user_id, created_at) VALUES(?,?,?,?,?,?)', e.date, e.category, e.amount, e.note, ctx.user.id, now());
  return get('SELECT * FROM expenses WHERE id = ?', Number(r.lastInsertRowid));
});
route('PUT', '/api/expenses/:id', (ctx) => {
  needAdmin(ctx.user); const e = expenseInput(ctx.body);
  run('UPDATE expenses SET date=?, category=?, amount=?, note=? WHERE id=?', e.date, e.category, e.amount, e.note, int(ctx.params.id));
  return get('SELECT * FROM expenses WHERE id = ?', int(ctx.params.id));
});
route('DELETE', '/api/expenses/:id', (ctx) => { needAdmin(ctx.user); run('DELETE FROM expenses WHERE id = ?', int(ctx.params.id)); return { ok: true }; });

// ---------------- reports ----------------
route('GET', '/api/reports/summary', (ctx) => { needAdmin(ctx.user); return reports.summary(ctx.query.from, ctx.query.to); });
route('GET', '/api/reports/inventory', () => reports.inventory());

// ---------------- Al-Waseet ----------------
route('GET', '/api/aw/cities', () => aw.cities());
route('GET', '/api/aw/regions', (ctx) => { if (!ctx.query.city_id) throw httpError(400, 'city_id required'); return aw.regions(int(ctx.query.city_id)); });
route('GET', '/api/aw/sizes', () => aw.packageSizes());
route('POST', '/api/aw/sync', async (ctx) => { needAdmin(ctx.user); return sync.syncAll(); });
route('GET', '/api/aw/log', (ctx) => { needAdmin(ctx.user); return all('SELECT * FROM sync_log ORDER BY id DESC LIMIT 50'); });
route('POST', '/api/aw/test', async (ctx) => {
  needAdmin(ctx.user);
  const c = aw.credentials();
  const username = ctx.body.username || c.username, password = ctx.body.password || c.password;
  if (!username || !password) throw httpError(400, 'Enter username and password');
  const token = await aw.login(username, password);
  // Check which read-only APIs this account may use (no orders are created or changed).
  const checks = {};
  for (const [name, method, ep] of [['statuses', 'GET', 'statuses'], ['orders', 'GET', 'merchant-orders'], ['invoices', 'GET', 'get_merchant_invoices']]) {
    try { const d = await aw.raw(method, ep, { query: { token } }); checks[name] = { ok: true, count: Array.isArray(d) ? d.length : null }; }
    catch (e) { checks[name] = { ok: false, error: e.message, errNum: e.errNum || null }; }
  }
  console.log('Al-Waseet access check:', JSON.stringify(checks));
  return { ok: true, checks };
});

// ---------------- invoices ----------------
route('GET', '/api/invoices', (ctx) => {
  needAdmin(ctx.user);
  return all(`SELECT i.*, (SELECT COUNT(*) FROM orders o WHERE o.invoice_id = i.id) local_orders FROM invoices i ORDER BY CAST(i.id AS INTEGER) DESC`);
});
route('GET', '/api/invoices/:id', async (ctx) => {
  needAdmin(ctx.user); const id = String(ctx.params.id);
  const i = get('SELECT * FROM invoices WHERE id = ?', id); if (!i) throw httpError(404, 'Not found');
  if (!i.orders_fetched && aw.isConfigured()) { try { await sync.fetchInvoiceOrders(id); } catch (_) {} }
  i.orders = all('SELECT id, qr_id, client_name, price, delivery_fee, state, delivered_at FROM orders WHERE invoice_id = ? ORDER BY id', id);
  return i;
});
route('POST', '/api/invoices/:id/receive', async (ctx) => { needAdmin(ctx.user); await sync.receiveInvoice(String(ctx.params.id)); return { ok: true }; });

// ---------------- settings ----------------
const PUBLIC_SETTINGS = ['business_name', 'sync_minutes', 'return_fee', 'default_package_size', 'aw_import_since', 'customer_delivery'];
route('GET', '/api/settings', (ctx) => {
  const out = Object.fromEntries(PUBLIC_SETTINGS.map(k => [k, getSetting(k, '')]));
  out.aw_username = process.env.ALWASEET_USERNAME || getSetting('aw_username', '');
  out.aw_password_set = !!(process.env.ALWASEET_PASSWORD || getSetting('aw_password_enc'));
  out.aw_from_env = !!process.env.ALWASEET_USERNAME;
  out.aw_last_sync = getSetting('aw_last_sync', '');
  out.aw_base = aw.BASE;
  if (!isAdmin(ctx.user)) return { default_package_size: out.default_package_size, customer_delivery: out.customer_delivery, business_name: out.business_name };
  return out;
});
route('PUT', '/api/settings', (ctx) => {
  needAdmin(ctx.user); const b = ctx.body;
  for (const k of PUBLIC_SETTINGS) if (b[k] != null) {
    if (k === 'aw_import_since' && b[k] && !isDate(b[k])) throw httpError(400, 'Bad date');
    setSetting(k, str(b[k], 200));
  }
  if (b.aw_username != null && b.aw_username !== getSetting('aw_username', '')) { setSetting('aw_username', str(b.aw_username, 100)); aw.clearToken(); }
  if (b.aw_password) {
    setSetting('aw_password_enc', sec.encrypt(b.aw_password)); aw.clearToken();
    if (!getSetting('aw_import_since')) setSetting('aw_import_since', today());
  }
  if (b.sync_minutes != null) sync.startScheduler();
  return { ok: true };
});
route('GET', '/api/status-map', () => all('SELECT * FROM status_map ORDER BY CAST(status_id AS INTEGER)'));
route('PUT', '/api/status-map/:id', (ctx) => {
  needAdmin(ctx.user);
  if (!orders.STATES.includes(ctx.body.state)) throw httpError(400, 'Bad state');
  run('UPDATE status_map SET state = ?, manual = 1 WHERE status_id = ?', ctx.body.state, String(ctx.params.id));
  return { ok: true };
});

// ---------------- CSV export ----------------
const csv = rows => {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return '﻿' + [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
};
route('GET', '/api/export/:what', (ctx) => {
  needAdmin(ctx.user);
  const { from, to } = reports.range(ctx.query.from, ctx.query.to);
  let rows;
  if (ctx.params.what === 'orders.csv') rows = all(`SELECT o.id, o.qr_id, o.created_at, o.delivered_at, o.state, o.status_text, o.client_name, o.client_mobile,
      o.city_name, o.region_name, o.type_name, o.items_number, o.price, o.delivery_fee,
      ROUND((SELECT SUM(qty*unit_cost) FROM order_items WHERE order_id = o.id)) AS cogs, o.invoice_id
      FROM orders o WHERE date(o.created_at) BETWEEN ? AND ? ORDER BY o.id`, from, to);
  else if (ctx.params.what === 'expenses.csv') rows = all('SELECT id, date, category, amount, note, auto FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date', from, to);
  else if (ctx.params.what === 'inventory.csv') rows = all('SELECT id, sku, name_ar, name_en, stock_qty, ROUND(avg_cost) avg_cost, ROUND(stock_qty*avg_cost) value, sale_price FROM products WHERE active = 1 ORDER BY name_ar');
  else throw httpError(404, 'Unknown export');
  return { __raw: csv(rows), type: 'text/csv; charset=utf-8', filename: `${ctx.params.what.replace('.csv', '')}_${from}_${to}.csv` };
});

// ---------------- static files ----------------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
function serveStatic(req, res, pathname) {
  let file = path.normalize(path.join(PUBLIC, pathname === '/' ? 'index.html' : pathname));
  if (!file.startsWith(PUBLIC)) return send(res, 403, 'Forbidden');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) file = path.join(PUBLIC, 'index.html');           // SPA fallback
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' });
    fs.createReadStream(file).pipe(res);
  });
}

// ---------------- server ----------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith('/api/')) return serveStatic(req, res, url.pathname);

  const r = routes.find(r => r.method === req.method && r.re.test(url.pathname));
  if (!r) return send(res, 404, { error: 'Not found' });
  const m = url.pathname.match(r.re);
  const ctx = {
    params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])),
    query: Object.fromEntries(url.searchParams), headers: {},
    ip: (process.env.TRUST_PROXY === '1' && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress,
  };
  try {
    // CSRF guard: state-changing requests must be same-origin JSON
    if (req.method !== 'GET' && req.headers['content-type'] && !String(req.headers['content-type']).includes('application/json'))
      throw httpError(415, 'JSON only');
    ctx.token = parseCookies(req.headers.cookie)[COOKIE];
    if (r.auth !== 'none') { ctx.user = sec.sessionUser(ctx.token); if (!ctx.user) throw httpError(401, 'Please log in'); }
    ctx.body = req.method === 'GET' ? {} : await readBody(req);
    const out = await r.handler(ctx);
    if (out && out.__raw !== undefined) {
      return send(res, 200, out.__raw, { 'Content-Type': out.type, 'Content-Disposition': `attachment; filename="${out.filename}"` });
    }
    send(res, 200, out ?? { ok: true }, ctx.headers);
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500 && !(e instanceof aw.AlWaseetError)) console.error(e);
    send(res, status, { error: e.message || 'Server error', details: e.details }, ctx.headers);
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Horn store manager running on http://localhost:${PORT}`);
    console.log(`Al-Waseet API: ${aw.BASE}`);
    sync.startScheduler();
    // one-time connectivity check so the logs show whether Al-Waseet is reachable from this server
    aw.cities().then(c => console.log(`Al-Waseet reachable: ${Array.isArray(c) ? c.length : 0} cities`))
      .catch(e => console.log('Al-Waseet NOT reachable: ' + e.message));
  });
}
module.exports = server;
