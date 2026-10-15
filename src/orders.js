'use strict';
// Orders: creation, editing, state changes (stock + automatic return fees).
const { get, all, run, tx, getSetting } = require('./db');
const inv = require('./inventory');
const aw = require('./alwaseet');
const { now, int, str, httpError, required } = require('./util');

const STATES = ['pending', 'in_transit', 'delivered', 'returning', 'returned', 'cancelled'];
const CLOSED = new Set(['returned', 'cancelled']);

function loadOrder(id) {
  const o = get('SELECT * FROM orders WHERE id = ?', id);
  if (!o) throw httpError(404, 'Order not found');
  o.items = all(`SELECT oi.*, p.name_ar, p.name_en, p.sku FROM order_items oi
                 JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`, id);
  return o;
}

function cleanItems(items) {
  if (!Array.isArray(items)) return [];
  const out = [];
  for (const it of items) {
    const product_id = int(it.product_id), qty = int(it.qty);
    if (!product_id || qty <= 0) continue;
    const p = get('SELECT id, sale_price FROM products WHERE id = ?', product_id);
    if (!p) throw httpError(400, 'Unknown product ' + product_id);
    out.push({ product_id, qty, unit_price: it.unit_price == null || it.unit_price === '' ? p.sale_price : int(it.unit_price) });
  }
  return out;
}

function typeNameFor(items) {
  return items.map(it => {
    const p = get('SELECT name_ar, name_en FROM products WHERE id = ?', it.product_id);
    return (p.name_ar || p.name_en) + (it.qty > 1 ? ` x${it.qty}` : '');
  }).join(' + ').slice(0, 200) || 'هورن سيارة';
}

// ---- state machine: the single place where stock and auto-expenses react to status changes ----
function applyState(orderId, newState, { at = now(), userId = null } = {}) {
  if (!STATES.includes(newState)) throw httpError(400, 'Bad state');
  const o = get('SELECT * FROM orders WHERE id = ?', orderId);
  if (!o || o.state === newState) return false;
  const was = o.state;

  if (CLOSED.has(newState)) {
    inv.restockOrder(orderId, newState, userId);
    run('UPDATE orders SET closed_at = ?, delivered_at = NULL WHERE id = ?', at, orderId);
    const fee = int(getSetting('return_fee', '0'));
    if (newState === 'returned' && fee > 0 && o.aw_id &&
        !get("SELECT id FROM expenses WHERE order_id = ? AND auto = 1 AND category = 'returns'", orderId)) {
      run(`INSERT INTO expenses(date, category, amount, note, order_id, auto, created_at)
           VALUES(?, 'returns', ?, ?, ?, 1, ?)`, at.slice(0, 10), fee, 'Return fee #' + (o.qr_id || o.id), orderId, now());
    }
  } else {
    if (CLOSED.has(was)) {                       // re-opened: goods went out again
      inv.deductOrder(orderId, userId);
      run('UPDATE orders SET closed_at = NULL WHERE id = ?', orderId);
      run("DELETE FROM expenses WHERE order_id = ? AND auto = 1 AND category = 'returns'", orderId);
    }
    if (newState === 'delivered') run('UPDATE orders SET delivered_at = ? WHERE id = ?', at, orderId);
    else run('UPDATE orders SET delivered_at = NULL WHERE id = ?', orderId);
  }
  run('UPDATE orders SET state = ?, updated_at = ? WHERE id = ?', newState, now(), orderId);
  return true;
}

// ---- create ----
function createLocal(body, userId) {
  required(body, ['client_name', 'client_mobile', 'city_id', 'region_id', 'location']);
  const items = cleanItems(body.items);
  if (!items.length) throw httpError(400, 'Add at least one product');
  const mobile = aw.normalizeMobile(body.client_mobile);
  if (!mobile) throw httpError(400, 'Invalid mobile number (use 07XXXXXXXXX)');
  let mobile2 = '';
  if (body.client_mobile2) { mobile2 = aw.normalizeMobile(body.client_mobile2); if (!mobile2) throw httpError(400, 'Invalid second mobile number'); }

  if (!body.allow_negative) {
    const short = inv.checkAvailability(items);
    if (short.length) { const e = httpError(409, 'Not enough stock'); e.details = short; throw e; }
  }
  const subtotal = items.reduce((s, it) => s + it.qty * it.unit_price, 0);
  const customerDelivery = int(body.customer_delivery, 0);
  const price = body.price != null && body.price !== '' ? int(body.price) : subtotal + customerDelivery;
  const ts = now();

  return tx(() => {
    const r = run(`INSERT INTO orders(source, client_name, client_mobile, client_mobile2, city_id, city_name,
        region_id, region_name, location, type_name, items_number, package_size, price, replacement,
        merchant_notes, state, user_id, created_at, updated_at)
      VALUES('app',?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',?,?,?)`,
      str(body.client_name, 120), mobile, mobile2, String(body.city_id), str(body.city_name, 120),
      String(body.region_id), str(body.region_name, 120), str(body.location, 500),
      str(body.type_name, 200) || typeNameFor(items), items.reduce((s, i) => s + i.qty, 0),
      String(body.package_size || getSetting('default_package_size') || ''), price,
      body.replacement ? 1 : 0, str(body.merchant_notes, 500), userId, ts, ts);
    const id = Number(r.lastInsertRowid);
    for (const it of items) run('INSERT INTO order_items(order_id, product_id, qty, unit_price) VALUES(?,?,?,?)', id, it.product_id, it.qty, it.unit_price);
    inv.deductOrder(id, userId);
    return id;
  });
}

function awForm(o) {
  return {
    client_name: o.client_name, client_mobile: o.client_mobile, client_mobile2: o.client_mobile2 || '',
    city_id: o.city_id, region_id: o.region_id, location: o.location, type_name: o.type_name || 'هورن سيارة',
    items_number: o.items_number, price: o.price, package_size: o.package_size,
    merchant_notes: o.merchant_notes || '', replacement: o.replacement ? 1 : 0,
  };
}

async function sendToAlWaseet(id) {
  const o = loadOrder(id);
  if (o.aw_id || o.qr_id) throw httpError(400, 'Already sent to Al-Waseet');
  if (CLOSED.has(o.state)) throw httpError(400, 'Order is closed');
  if (!o.package_size) throw httpError(400, 'Choose a package size');
  const data = await aw.createOrder(awForm(o));
  const d = Array.isArray(data) ? data[0] : data;
  if (!d) throw httpError(502, 'Al-Waseet returned no order data');
  run(`UPDATE orders SET aw_id = ?, qr_id = ?, qr_link = ?, delivery_fee = ?, status_id = '1', updated_at = ? WHERE id = ?`,
    d.id != null ? String(d.id) : null, d.qr_id != null ? String(d.qr_id) : null, d.qr_link || null,
    int(d.company_price), now(), id);
  return loadOrder(id);
}

// Edit: only before a driver picks it up (Al-Waseet status 1 / local pending).
async function editOrder(id, body, userId) {
  const o = loadOrder(id);
  if (o.state !== 'pending') throw httpError(400, 'Only pending orders can be edited');
  const items = body.items ? cleanItems(body.items) : null;
  const next = { ...o };
  for (const f of ['client_name', 'city_id', 'city_name', 'region_id', 'region_name', 'location', 'type_name', 'package_size', 'merchant_notes'])
    if (body[f] != null) next[f] = str(body[f], 500);
  if (body.client_mobile != null) { next.client_mobile = aw.normalizeMobile(body.client_mobile); if (!next.client_mobile) throw httpError(400, 'Invalid mobile number'); }
  if (body.client_mobile2 != null) next.client_mobile2 = body.client_mobile2 ? aw.normalizeMobile(body.client_mobile2) || '' : '';
  if (body.replacement != null) next.replacement = body.replacement ? 1 : 0;
  if (items) {
    if (!items.length) throw httpError(400, 'Add at least one product');
    next.items_number = items.reduce((s, i) => s + i.qty, 0);
    if (body.type_name == null) next.type_name = typeNameFor(items);
  }
  if (body.price != null && body.price !== '') next.price = int(body.price);
  else if (items) next.price = items.reduce((s, i) => s + i.qty * i.unit_price, 0) + int(body.customer_delivery, 0);

  if (o.qr_id) await aw.editOrder({ qr_id: o.qr_id, ...awForm(next) });   // remote first; fail = no local change

  tx(() => {
    run(`UPDATE orders SET client_name=?, client_mobile=?, client_mobile2=?, city_id=?, city_name=?, region_id=?,
         region_name=?, location=?, type_name=?, items_number=?, package_size=?, price=?, replacement=?,
         merchant_notes=?, updated_at=? WHERE id=?`,
      next.client_name, next.client_mobile, next.client_mobile2 || '', next.city_id, next.city_name, next.region_id,
      next.region_name, next.location, next.type_name, next.items_number, next.package_size, next.price,
      next.replacement, next.merchant_notes, now(), id);
    if (items) replaceItems(id, items, userId);
  });
  return loadOrder(id);
}

function replaceItems(id, items, userId) {
  const o = get('SELECT state FROM orders WHERE id = ?', id);
  inv.restockOrder(id, 'items changed', userId);
  run('DELETE FROM order_items WHERE order_id = ?', id);
  for (const it of items) run('INSERT INTO order_items(order_id, product_id, qty, unit_price) VALUES(?,?,?,?)', id, it.product_id, it.qty, it.unit_price);
  if (!CLOSED.has(o.state)) inv.deductOrder(id, userId);
}

// Link products to an order imported from Al-Waseet (or fix lines of any order).
function setItems(id, rawItems, userId) {
  loadOrder(id);
  const items = cleanItems(rawItems);
  tx(() => replaceItems(id, items, userId));
  return loadOrder(id);
}

function cancelOrder(id, userId) {
  const o = loadOrder(id);
  if (o.state === 'delivered') throw httpError(400, 'Delivered orders cannot be cancelled');
  tx(() => applyState(id, 'cancelled', { userId }));
  return loadOrder(id);
}

function deleteOrder(id, userId) {
  const o = loadOrder(id);
  if (o.aw_id || o.qr_id) throw httpError(400, 'Order was sent to Al-Waseet; cancel it instead');
  tx(() => { inv.restockOrder(id, 'deleted', userId); run('DELETE FROM orders WHERE id = ?', id); });
}

function listOrders({ state, q, from, to, page = 1, needs_items, limit = 50 }) {
  const where = [], p = [];
  if (state && STATES.includes(state)) { where.push('o.state = ?'); p.push(state); }
  if (q) { where.push('(o.client_name LIKE ? OR o.client_mobile LIKE ? OR o.qr_id LIKE ? OR o.type_name LIKE ?)'); const l = `%${q}%`; p.push(l, l, l, l); }
  if (from) { where.push('date(o.created_at) >= ?'); p.push(from); }
  if (to) { where.push('date(o.created_at) <= ?'); p.push(to); }
  if (needs_items) where.push('NOT EXISTS (SELECT 1 FROM order_items x WHERE x.order_id = o.id)');
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  limit = Math.min(200, Math.max(1, int(limit, 50)));
  const off = (Math.max(1, int(page, 1)) - 1) * limit;
  const total = get(`SELECT COUNT(*) n FROM orders o ${w}`, ...p).n;
  const rows = all(`SELECT o.*, (SELECT COUNT(*) FROM order_items x WHERE x.order_id = o.id) AS item_lines
                    FROM orders o ${w} ORDER BY o.id DESC LIMIT ? OFFSET ?`, ...p, limit, off);
  return { total, rows };
}

module.exports = {
  STATES, CLOSED, loadOrder, createLocal, sendToAlWaseet, editOrder, setItems,
  cancelOrder, deleteOrder, listOrders, applyState, cleanItems,
};
