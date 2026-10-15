'use strict';
// Profit & loss and inventory reporting.
//   Revenue        = what customers paid on DELIVERED orders (order price, incl. delivery charge)
//   COGS           = units delivered × their average cost when they left stock
//   Gross profit   = Revenue − COGS
//   Expenses       = Al-Waseet delivery fees (delivered orders) + return fees + ads + rent + salaries
//                    + bills + packaging + other + stock write-offs
//   Net profit     = Gross profit − Expenses
const { get, all } = require('./db');
const { today, httpError, isDate } = require('./util');

const EXPENSE_CATEGORIES = ['ads', 'rent', 'salaries', 'bills', 'packaging', 'returns', 'delivery', 'other'];

function range(from, to) {
  to = isDate(to) ? to : today();
  from = isDate(from) ? from : to.slice(0, 8) + '01';
  if (from > to) throw httpError(400, 'from must be before to');
  return { from, to };
}

function summary(qFrom, qTo) {
  const { from, to } = range(qFrom, qTo);

  const sales = get(`SELECT COUNT(*) orders, COALESCE(SUM(price),0) revenue, COALESCE(SUM(delivery_fee),0) delivery_fees
                     FROM orders WHERE state = 'delivered' AND date(delivered_at) BETWEEN ? AND ?`, from, to);
  const cogsRow = get(`SELECT COALESCE(SUM(oi.qty * oi.unit_cost),0) cogs, COALESCE(SUM(oi.qty),0) units
                       FROM order_items oi JOIN orders o ON o.id = oi.order_id
                       WHERE o.state = 'delivered' AND date(o.delivered_at) BETWEEN ? AND ?`, from, to);
  const noCost = get(`SELECT COUNT(*) n, COALESCE(SUM(price),0) revenue FROM orders o
                      WHERE o.state = 'delivered' AND date(o.delivered_at) BETWEEN ? AND ?
                      AND NOT EXISTS (SELECT 1 FROM order_items x WHERE x.order_id = o.id)`, from, to);

  const byCat = Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c, 0]));
  for (const r of all('SELECT category, SUM(amount) amt FROM expenses WHERE date BETWEEN ? AND ? GROUP BY category', from, to))
    byCat[r.category] = (byCat[r.category] || 0) + r.amt;
  const writeOffs = get(`SELECT COALESCE(SUM(-qty * unit_cost),0) v FROM stock_movements
                         WHERE type = 'adjust' AND qty < 0 AND date(created_at) BETWEEN ? AND ?`, from, to).v;

  byCat.delivery += sales.delivery_fees;      // Al-Waseet fees on delivered orders
  byCat.write_offs = Math.round(writeOffs);
  const expenses = Object.values(byCat).reduce((s, v) => s + v, 0);
  const cogs = Math.round(cogsRow.cogs);
  const gross = sales.revenue - cogs;
  const net = gross - expenses;

  const flow = get(`SELECT
      SUM(CASE WHEN date(created_at) BETWEEN ?1 AND ?2 THEN 1 ELSE 0 END) created,
      SUM(CASE WHEN state = 'returned' AND date(closed_at) BETWEEN ?1 AND ?2 THEN 1 ELSE 0 END) returned,
      SUM(CASE WHEN state = 'cancelled' AND date(closed_at) BETWEEN ?1 AND ?2 THEN 1 ELSE 0 END) cancelled
    FROM orders`, from, to);
  const open = get(`SELECT
      SUM(CASE WHEN state = 'pending' THEN 1 ELSE 0 END) pending,
      SUM(CASE WHEN state = 'in_transit' THEN 1 ELSE 0 END) in_transit,
      SUM(CASE WHEN state = 'returning' THEN 1 ELSE 0 END) returning_n,
      COALESCE(SUM(CASE WHEN state IN ('pending','in_transit') THEN price - delivery_fee ELSE 0 END),0) open_value
    FROM orders`);
  const finished = sales.orders + (flow.returned || 0);

  // money Al-Waseet collected/will collect for you that you haven't received yet
  const receivable = get(`SELECT COUNT(*) n, COALESCE(SUM(o.price - o.delivery_fee),0) amount
      FROM orders o LEFT JOIN invoices i ON i.id = o.invoice_id
      WHERE o.state = 'delivered' AND o.aw_id IS NOT NULL AND COALESCE(i.received, 0) = 0`);

  return {
    from, to,
    revenue: sales.revenue, cogs, gross_profit: gross, expenses, net_profit: net,
    gross_margin: sales.revenue ? gross / sales.revenue : 0,
    net_margin: sales.revenue ? net / sales.revenue : 0,
    expenses_by_category: byCat,
    delivered_orders: sales.orders, units_sold: cogsRow.units,
    avg_order_value: sales.orders ? Math.round(sales.revenue / sales.orders) : 0,
    orders_created: flow.created || 0, returned_orders: flow.returned || 0, cancelled_orders: flow.cancelled || 0,
    return_rate: finished ? (flow.returned || 0) / finished : 0,
    open_orders: { pending: open.pending || 0, in_transit: open.in_transit || 0, returning: open.returning_n || 0, value: open.open_value },
    receivable,
    missing_cost: noCost,
    inventory: inventory(),
    daily: daily(from, to),
    top_products: topProducts(from, to),
  };
}

function inventory() {
  const t = get(`SELECT COALESCE(SUM(CASE WHEN stock_qty > 0 THEN stock_qty * avg_cost END),0) value,
                 COALESCE(SUM(CASE WHEN stock_qty > 0 THEN stock_qty END),0) units,
                 COALESCE(SUM(CASE WHEN stock_qty > 0 THEN stock_qty * sale_price END),0) retail_value,
                 COUNT(*) products FROM products WHERE active = 1`);
  const outForDelivery = get(`SELECT COALESCE(SUM(oi.qty * oi.unit_cost),0) v, COALESCE(SUM(oi.qty),0) u
                              FROM order_items oi JOIN orders o ON o.id = oi.order_id
                              WHERE o.stock_out = 1 AND o.state IN ('pending','in_transit','returning')`);
  const low = all(`SELECT id, sku, name_ar, name_en, stock_qty, low_stock FROM products
                   WHERE active = 1 AND stock_qty <= low_stock ORDER BY stock_qty LIMIT 20`);
  return {
    value: Math.round(t.value), units: t.units, retail_value: t.retail_value, products: t.products,
    with_couriers_value: Math.round(outForDelivery.v), with_couriers_units: outForDelivery.u, low_stock: low,
  };
}

function daily(from, to) {
  const days = [];
  for (let d = new Date(from + 'T12:00:00'); ; d.setDate(d.getDate() + 1)) {
    const s = d.toISOString().slice(0, 10);
    if (s > to || days.length > 400) break;
    days.push(s);
  }
  const map = Object.fromEntries(days.map(d => [d, { date: d, revenue: 0, cogs: 0, expenses: 0, orders: 0 }]));
  for (const r of all(`SELECT date(delivered_at) d, SUM(price) rev, SUM(delivery_fee) fee, COUNT(*) n FROM orders
                       WHERE state='delivered' AND date(delivered_at) BETWEEN ? AND ? GROUP BY d`, from, to))
    if (map[r.d]) { map[r.d].revenue += r.rev; map[r.d].expenses += r.fee; map[r.d].orders = r.n; }
  for (const r of all(`SELECT date(o.delivered_at) d, SUM(oi.qty*oi.unit_cost) c FROM order_items oi JOIN orders o ON o.id=oi.order_id
                       WHERE o.state='delivered' AND date(o.delivered_at) BETWEEN ? AND ? GROUP BY d`, from, to))
    if (map[r.d]) map[r.d].cogs += Math.round(r.c);
  for (const r of all('SELECT date d, SUM(amount) a FROM expenses WHERE date BETWEEN ? AND ? GROUP BY d', from, to))
    if (map[r.d]) map[r.d].expenses += r.a;
  for (const r of all(`SELECT date(created_at) d, SUM(-qty*unit_cost) v FROM stock_movements WHERE type='adjust' AND qty<0
                       AND date(created_at) BETWEEN ? AND ? GROUP BY d`, from, to))
    if (map[r.d]) map[r.d].expenses += Math.round(r.v);
  return days.map(d => { const x = map[d]; x.gross = x.revenue - x.cogs; x.net = x.gross - x.expenses; return x; });
}

function topProducts(from, to) {
  return all(`SELECT p.id, p.name_ar, p.name_en, SUM(oi.qty) units, SUM(oi.qty*oi.unit_price) sales,
              ROUND(SUM(oi.qty*(oi.unit_price - oi.unit_cost))) profit
              FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id
              WHERE o.state='delivered' AND date(o.delivered_at) BETWEEN ? AND ?
              GROUP BY p.id ORDER BY units DESC LIMIT 10`, from, to);
}

module.exports = { summary, inventory, EXPENSE_CATEGORIES, range };
