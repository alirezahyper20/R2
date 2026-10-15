'use strict';
// Database layer — uses Node's built-in SQLite (node:sqlite), no external packages.
const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'hornpro.db');

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  pass_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',          -- admin | staff
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  sale_price INTEGER NOT NULL DEFAULT 0,       -- IQD
  avg_cost REAL NOT NULL DEFAULT 0,            -- weighted average unit cost, IQD
  stock_qty INTEGER NOT NULL DEFAULT 0,
  low_stock INTEGER NOT NULL DEFAULT 5,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  type TEXT NOT NULL,                          -- purchase | sale | restock | adjust | opening
  qty INTEGER NOT NULL,                        -- + in / - out
  unit_cost REAL NOT NULL DEFAULT 0,
  ref_type TEXT, ref_id INTEGER,
  note TEXT,
  user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier TEXT,
  date TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty INTEGER NOT NULL,
  unit_cost INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL DEFAULT 'app',          -- app | alwaseet (imported)
  aw_id TEXT,                                  -- Al-Waseet order id
  qr_id TEXT,                                  -- Al-Waseet QR id (main identifier)
  qr_link TEXT,
  client_name TEXT NOT NULL,
  client_mobile TEXT,
  client_mobile2 TEXT,
  city_id TEXT, city_name TEXT,
  region_id TEXT, region_name TEXT,
  location TEXT,
  type_name TEXT,
  items_number INTEGER NOT NULL DEFAULT 1,
  package_size TEXT,
  price INTEGER NOT NULL DEFAULT 0,            -- total paid by customer (incl. delivery)
  delivery_fee INTEGER NOT NULL DEFAULT 0,     -- Al-Waseet fee
  replacement INTEGER NOT NULL DEFAULT 0,
  merchant_notes TEXT,
  issue_notes TEXT,
  status_id TEXT,
  status_text TEXT,
  state TEXT NOT NULL DEFAULT 'pending',       -- pending | in_transit | delivered | returning | returned | cancelled
  stock_out INTEGER NOT NULL DEFAULT 0,        -- 1 when items are deducted from stock
  delivered_at TEXT,
  closed_at TEXT,                              -- returned / cancelled date
  fin_confirmed INTEGER NOT NULL DEFAULT 0,    -- Al-Waseet collected the cash
  invoice_id TEXT,
  user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_aw ON orders(aw_id);
CREATE INDEX IF NOT EXISTS idx_orders_qr ON orders(qr_id);
CREATE INDEX IF NOT EXISTS idx_orders_state ON orders(state);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty INTEGER NOT NULL,
  unit_price INTEGER NOT NULL DEFAULT 0,
  unit_cost REAL NOT NULL DEFAULT 0            -- cost snapshot when stock left
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  category TEXT NOT NULL,                      -- ads | rent | salaries | bills | packaging | returns | delivery | other
  amount INTEGER NOT NULL,
  note TEXT,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  auto INTEGER NOT NULL DEFAULT 0,             -- 1 = created automatically (e.g. return fee)
  user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,                         -- Al-Waseet invoice id
  merchant_price INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  replacement_count INTEGER NOT NULL DEFAULT 0,
  status TEXT,
  received INTEGER NOT NULL DEFAULT 0,
  orders_fetched INTEGER NOT NULL DEFAULT 0,
  aw_updated_at TEXT,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS status_map (
  status_id TEXT PRIMARY KEY,
  status_text TEXT,
  state TEXT NOT NULL,                         -- see orders.state
  manual INTEGER NOT NULL DEFAULT 0            -- 1 = set by the user, never auto-overwritten
);

CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT, ok INTEGER, message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
db.exec(SCHEMA);

// ---- helpers ----
const stmtCache = new Map();
function prep(sql) {
  let s = stmtCache.get(sql);
  if (!s) { s = db.prepare(sql); stmtCache.set(sql, s); }
  return s;
}
const all = (sql, ...p) => prep(sql).all(...p).map(r => ({ ...r }));
const get = (sql, ...p) => { const r = prep(sql).get(...p); return r ? { ...r } : null; };
const run = (sql, ...p) => prep(sql).run(...p);

function tx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { try { db.exec('ROLLBACK'); } catch (_) {} throw e; }
}

function getSetting(key, def = null) {
  const r = get('SELECT value FROM settings WHERE key = ?', key);
  return r ? r.value : def;
}
function setSetting(key, value) {
  run('INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key, value == null ? null : String(value));
}

// default settings
const DEFAULTS = {
  business_name: 'Horn Store',
  sync_minutes: '10',
  return_fee: '0',            // IQD charged by Al-Waseet per returned order (auto expense)
  default_package_size: '',
  customer_delivery: '5000',  // delivery charge added to the customer's total by default (IQD)
  low_stock_alert: '1',
};
for (const [k, v] of Object.entries(DEFAULTS)) if (getSetting(k) === null) setSetting(k, v);

module.exports = { db, all, get, run, tx, getSetting, setSetting, DB_PATH };
