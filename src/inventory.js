'use strict';
// Inventory: weighted-average costing. Stock leaves when an order is created,
// comes back when an order is returned or cancelled. COGS is recognised on delivery.
const { get, all, run } = require('./db');

function newAverage(stock, avg, qty, cost) {
  if (stock <= 0) return cost;               // nothing (or negative) on hand: new cost wins
  return (stock * avg + qty * cost) / (stock + qty);
}

// Add stock at a unit cost (purchase, opening balance, positive adjustment, restock).
function addStock(productId, qty, unitCost, type, refType, refId, note, userId) {
  const p = get('SELECT stock_qty, avg_cost FROM products WHERE id = ?', productId);
  if (!p) throw httpError(400, 'Unknown product ' + productId);
  const avg = newAverage(p.stock_qty, p.avg_cost, qty, unitCost);
  run('UPDATE products SET stock_qty = stock_qty + ?, avg_cost = ? WHERE id = ?', qty, avg, productId);
  run(`INSERT INTO stock_movements(product_id, type, qty, unit_cost, ref_type, ref_id, note, user_id)
       VALUES(?,?,?,?,?,?,?,?)`, productId, type, qty, unitCost, refType ?? null, refId ?? null, note ?? null, userId ?? null);
}

// Remove stock at the current average cost; returns the cost used.
function removeStock(productId, qty, type, refType, refId, note, userId) {
  const p = get('SELECT stock_qty, avg_cost FROM products WHERE id = ?', productId);
  if (!p) throw httpError(400, 'Unknown product ' + productId);
  run('UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?', qty, productId);
  run(`INSERT INTO stock_movements(product_id, type, qty, unit_cost, ref_type, ref_id, note, user_id)
       VALUES(?,?,?,?,?,?,?,?)`, productId, type, -qty, p.avg_cost, refType ?? null, refId ?? null, note ?? null, userId ?? null);
  return p.avg_cost;
}

function checkAvailability(items) {
  const short = [];
  for (const it of items) {
    const p = get('SELECT id, name_ar, name_en, stock_qty FROM products WHERE id = ?', it.product_id);
    if (!p) throw httpError(400, 'Unknown product ' + it.product_id);
    if (p.stock_qty < it.qty) short.push({ product_id: p.id, name: p.name_ar || p.name_en, have: p.stock_qty, need: it.qty });
  }
  return short;
}

// Deduct the order's items from stock (snapshot unit cost on each line).
function deductOrder(orderId, userId) {
  const o = get('SELECT stock_out FROM orders WHERE id = ?', orderId);
  if (!o || o.stock_out) return;
  for (const it of all('SELECT id, product_id, qty FROM order_items WHERE order_id = ?', orderId)) {
    const cost = removeStock(it.product_id, it.qty, 'sale', 'order', orderId, null, userId);
    run('UPDATE order_items SET unit_cost = ? WHERE id = ?', cost, it.id);
  }
  run('UPDATE orders SET stock_out = 1 WHERE id = ?', orderId);
}

// Put the order's items back into stock at the cost they left with.
function restockOrder(orderId, note, userId) {
  const o = get('SELECT stock_out FROM orders WHERE id = ?', orderId);
  if (!o || !o.stock_out) return;
  for (const it of all('SELECT product_id, qty, unit_cost FROM order_items WHERE order_id = ?', orderId)) {
    addStock(it.product_id, it.qty, it.unit_cost, 'restock', 'order', orderId, note || 'returned', userId);
  }
  run('UPDATE orders SET stock_out = 0 WHERE id = ?', orderId);
}

function httpError(status, message) { const e = new Error(message); e.status = status; return e; }

module.exports = { addStock, removeStock, checkAvailability, deductOrder, restockOrder, httpError };
