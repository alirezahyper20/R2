'use strict';
// Pulls order statuses and invoices from Al-Waseet and applies them locally.
const { get, all, run, tx, getSetting, setSetting } = require('./db');
const aw = require('./alwaseet');
const orders = require('./orders');
const inv = require('./inventory');
const { now, today, int, str } = require('./util');

// Guess the business meaning of an Al-Waseet status text. Users can override per status in Settings.
function classifyStatus(id, text = '') {
  const t = String(text).replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').toLowerCase();
  if (String(id) === '1') return 'pending';
  if (/الغاء|ملغي|ملغا|cancel/.test(t)) return 'cancelled';
  if (/ارجاع|مرتجع|راجع|رجوع|return/.test(t)) {
    return /(الي|ل)\s*التاجر|للتاجر|تم\s*ارجاع|تم\s*الارجاع|returned to merchant/.test(t) ? 'returned' : 'returning';
  }
  if (/قيد|في الطريق|بالطريق|transit|on the way/.test(t)) return 'in_transit';
  if (/تم\s*التسليم|تسليم|سلم|واصل|deliver/.test(t)) return 'delivered';
  return 'in_transit';
}

function stateFor(statusId, statusText) {
  const m = get('SELECT state FROM status_map WHERE status_id = ?', String(statusId));
  return m ? m.state : classifyStatus(statusId, statusText);
}

function upsertStatusMap(list) {
  for (const s of list || []) {
    const id = String(s.id);
    const ex = get('SELECT manual FROM status_map WHERE status_id = ?', id);
    if (!ex) run('INSERT INTO status_map(status_id, status_text, state) VALUES(?,?,?)', id, s.status, classifyStatus(id, s.status));
    else if (!ex.manual) run('UPDATE status_map SET status_text = ?, state = ? WHERE status_id = ?', s.status, classifyStatus(id, s.status), id);
    else run('UPDATE status_map SET status_text = ? WHERE status_id = ?', s.status, id);
  }
}

// Try to link an imported order to a product by its goods description (type_name).
function guessProduct(typeName) {
  if (!typeName) return null;
  const t = typeName.toLowerCase();
  const hits = all('SELECT id, sku, name_ar, name_en FROM products WHERE active = 1').filter(p =>
    (p.sku && t.includes(p.sku.toLowerCase())) ||
    (p.name_ar && t.includes(p.name_ar.toLowerCase())) ||
    (p.name_en && t.includes(p.name_en.toLowerCase())));
  return hits.length === 1 ? hits[0].id : null;
}

function findLocal(awOrder) {
  const id = String(awOrder.id);
  return get('SELECT * FROM orders WHERE aw_id = ? OR qr_id = ? ORDER BY id LIMIT 1', id, id);
}

function applyRemote(a, stats) {
  const statusId = a.status_id != null ? String(a.status_id) : null;
  const state = stateFor(statusId, a.status);
  const at = a.updated_at || now();
  let local = findLocal(a);

  if (!local) {
    const since = getSetting('aw_import_since') || today();
    if (String(a.created_at || '').slice(0, 10) < since) { stats.skipped++; return; }
    tx(() => {
      const r = run(`INSERT INTO orders(source, aw_id, qr_id, client_name, client_mobile, client_mobile2, city_id, city_name,
          region_id, region_name, location, type_name, items_number, package_size, price, delivery_fee, replacement,
          merchant_notes, issue_notes, status_id, status_text, state, created_at, updated_at)
        VALUES('alwaseet',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',?,?)`,
        String(a.id), String(a.id), str(a.client_name, 120) || '-', a.client_mobile || '', a.client_mobile2 || '',
        a.city_id ?? null, a.city_name || '', a.region_id ?? null, a.region_name || '', a.location || '',
        a.type_name || '', int(a.items_number, 1), a.package_size || '', int(a.price), int(a.delivery_price),
        int(a.replacement), a.merchant_notes || '', a.issue_notes || '', statusId, a.status || '',
        a.created_at || now(), now());
      const id = Number(r.lastInsertRowid);
      const pid = guessProduct(a.type_name);
      if (pid) {
        const p = get('SELECT sale_price FROM products WHERE id = ?', pid);
        const qty = Math.max(1, int(a.items_number, 1));
        run('INSERT INTO order_items(order_id, product_id, qty, unit_price) VALUES(?,?,?,?)', id, pid, qty, p.sale_price);
        inv.deductOrder(id, null);
      }
      orders.applyState(id, state, { at });
      setFinance(id, a);
    });
    stats.imported++;
    return;
  }

  tx(() => {
    run(`UPDATE orders SET status_id = ?, status_text = ?, issue_notes = ?, price = ?, delivery_fee = ?,
         city_name = COALESCE(NULLIF(?, ''), city_name), region_name = COALESCE(NULLIF(?, ''), region_name),
         aw_id = COALESCE(aw_id, ?), updated_at = ? WHERE id = ?`,
      statusId, a.status || '', a.issue_notes || '', a.price != null ? int(a.price) : local.price,
      a.delivery_price != null ? int(a.delivery_price) : local.delivery_fee,
      a.city_name || '', a.region_name || '', String(a.id), now(), local.id);
    if (orders.applyState(local.id, state, { at })) stats.changed++;
    setFinance(local.id, a);
  });
  stats.updated++;
}

function setFinance(id, a) {
  const invId = a.merchant_invoice_id != null && String(a.merchant_invoice_id) !== '-1' ? String(a.merchant_invoice_id) : null;
  run('UPDATE orders SET fin_confirmed = ?, invoice_id = COALESCE(?, invoice_id) WHERE id = ?', int(a.deliver_confirmed_fin), invId, id);
}

let running = null;
async function syncAll({ invoices = true } = {}) {
  if (running) return running;
  running = (async () => {
    const stats = { imported: 0, updated: 0, changed: 0, skipped: 0, invoices: 0, errors: [] };
    try {
      if (!aw.isConfigured()) throw new Error('Al-Waseet credentials are not set');
      try { upsertStatusMap(await aw.statuses()); } catch (e) { stats.errors.push('statuses: ' + e.message); }
      const list = await aw.merchantOrders();
      for (const a of list || []) {
        try { applyRemote(a, stats); } catch (e) { stats.errors.push(`order ${a.id}: ${e.message}`); }
      }
      if (invoices) {
        try { stats.invoices = await syncInvoices(); } catch (e) { stats.errors.push('invoices: ' + e.message); }
      }
      setSetting('aw_last_sync', now());
      log('sync', !stats.errors.length, JSON.stringify(stats));
      return stats;
    } catch (e) {
      log('sync', false, e.message);
      throw e;
    } finally { running = null; }
  })();
  return running;
}

// Refresh specific orders (max 25 per call).
async function syncOrderIds(ids) {
  const stats = { imported: 0, updated: 0, changed: 0, skipped: 0 };
  for (let i = 0; i < ids.length; i += 25) {
    for (const a of (await aw.ordersByIds(ids.slice(i, i + 25))) || []) applyRemote(a, stats);
  }
  return stats;
}

async function syncInvoices() {
  const list = await aw.invoices();
  let n = 0;
  for (const i of list || []) {
    const id = String(i.id);
    const ex = get('SELECT * FROM invoices WHERE id = ?', id);
    const received = /استلام.*التاجر|received/i.test(i.status || '') ? 1 : 0;
    if (!ex) {
      run(`INSERT INTO invoices(id, merchant_price, delivered_count, replacement_count, status, received, aw_updated_at, synced_at)
           VALUES(?,?,?,?,?,?,?,?)`, id, int(i.merchant_price), int(i.delivered_orders_count),
        int(i.replacement_delivered_orders_count), i.status || '', received, i.updated_at || '', now());
    } else {
      const changed = ex.aw_updated_at !== (i.updated_at || '');
      run(`UPDATE invoices SET merchant_price=?, delivered_count=?, replacement_count=?, status=?,
           received = MAX(received, ?), aw_updated_at=?, synced_at=?, orders_fetched = CASE WHEN ? THEN 0 ELSE orders_fetched END
           WHERE id=?`, int(i.merchant_price), int(i.delivered_orders_count), int(i.replacement_delivered_orders_count),
        i.status || '', received, i.updated_at || '', now(), changed ? 1 : 0, id);
    }
    n++;
  }
  // fetch order lists for a few invoices per run (rate limit friendly)
  for (const i of all('SELECT id FROM invoices WHERE orders_fetched = 0 ORDER BY id DESC LIMIT 8')) {
    await fetchInvoiceOrders(i.id);
  }
  return n;
}

async function fetchInvoiceOrders(id) {
  const data = await aw.invoiceOrders(id);
  const list = (data && data.orders) || [];
  for (const o of list) {
    run('UPDATE orders SET invoice_id = ? WHERE aw_id = ? OR qr_id = ?', String(id), String(o.id), String(o.id));
  }
  run('UPDATE invoices SET orders_fetched = 1 WHERE id = ?', String(id));
  return list;
}

async function receiveInvoice(id) {
  await aw.receiveInvoice(id);
  run('UPDATE invoices SET received = 1 WHERE id = ?', String(id));
  log('invoice', true, 'received ' + id);
}

function log(kind, ok, message) {
  run('INSERT INTO sync_log(kind, ok, message, created_at) VALUES(?,?,?,?)', kind, ok ? 1 : 0, String(message).slice(0, 2000), now());
  run('DELETE FROM sync_log WHERE id < (SELECT MAX(id) - 300 FROM sync_log)');
}

// periodic background sync
let timer = null;
function startScheduler() {
  if (timer) clearTimeout(timer);
  const minutes = Math.max(2, int(getSetting('sync_minutes', '10'), 10));
  timer = setTimeout(async () => {
    const paused = Number(getSetting('aw_pause_until', '0')) > Date.now();
    if (aw.isConfigured() && !paused) { try { await syncAll(); } catch (_) { /* logged */ } }
    startScheduler();
  }, minutes * 60e3);
  timer.unref?.();
}

module.exports = { syncAll, syncOrderIds, syncInvoices, fetchInvoiceOrders, receiveInvoice, classifyStatus, startScheduler, upsertStatusMap };
