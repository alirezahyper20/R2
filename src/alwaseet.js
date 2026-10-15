'use strict';
// Al-Waseet Merchant API client (Integration Guide V2.3).
// Docs: https://al-waseet.com/apis-main/index
const { getSetting, setSetting } = require('./db');
const { decrypt } = require('./security');

const BASE = (process.env.ALWASEET_BASE_URL || 'https://api.alwaseet-iq.net/v1/merchant').replace(/\/+$/, '');

class AlWaseetError extends Error {
  constructor(msg, errNum, httpStatus) { super(msg); this.errNum = errNum; this.httpStatus = httpStatus; this.status = 502; }
}

// ---- rate limiting: the API allows 30 requests / 30 s per user; we stay under 28 ----
const WINDOW = 30_000, MAX_IN_WINDOW = 28;
const stamps = [];
let chain = Promise.resolve();
function throttle() {
  const next = chain.then(async () => {
    for (;;) {
      const now = Date.now();
      while (stamps.length && now - stamps[0] > WINDOW) stamps.shift();
      if (stamps.length < MAX_IN_WINDOW) { stamps.push(now); return; }
      await new Promise(r => setTimeout(r, WINDOW - (now - stamps[0]) + 50));
    }
  });
  chain = next.catch(() => {});
  return next;
}

function credentials() {
  return {
    username: process.env.ALWASEET_USERNAME || getSetting('aw_username') || '',
    password: process.env.ALWASEET_PASSWORD || decrypt(getSetting('aw_password_enc')) || '',
  };
}
const isConfigured = () => { const c = credentials(); return !!(c.username && c.password); };

// How the token is put in the URL. Some servers compare it un-decoded, so 'raw' sends it exactly as received.
const tokenMode = () => getSetting('aw_token_mode') || 'encoded';

// Cookie jar: Postman (which Al-Waseet's examples come from) keeps cookies the server sets at login and
// sends them back on every later request. Node's fetch doesn't, so we do it here.
const jar = new Map();
try { for (const [k, v] of Object.entries(JSON.parse(getSetting('aw_cookies') || '{}'))) jar.set(k, v); } catch {}
function storeCookies(res) {
  const list = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  for (const c of list) {
    const [pair] = c.split(';'); const i = pair.indexOf('=');
    if (i > 0) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
  if (list.length) setSetting('aw_cookies', JSON.stringify(Object.fromEntries(jar)));
  return list.map(c => c.split('=')[0]);
}
const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
const lastInfo = {};

async function raw(method, endpoint, { query = {}, form = null, mode = null, headers = {}, cookies = true } = {}) {
  await throttle();
  const m = mode || tokenMode();
  const parts = [];
  for (const [k, v] of Object.entries(query)) {
    if (v == null) continue;
    parts.push(encodeURIComponent(k) + '=' + (k === 'token' && m === 'raw' ? String(v) : encodeURIComponent(v)));
  }
  const url = BASE + '/' + endpoint + (parts.length ? '?' + parts.join('&') : '');
  let body;
  if (form) { body = new FormData(); for (const [k, v] of Object.entries(form)) if (v != null && v !== '') body.append(k, String(v)); }
  let res, json;
  try {
    const h = { Accept: 'application/json', 'User-Agent': 'PostmanRuntime/7.39.0', ...headers };
    if (cookies && jar.size) h.Cookie = cookieHeader();
    res = await fetch(url, { method, body, signal: AbortSignal.timeout(30_000), headers: h });
  } catch (e) {
    throw new AlWaseetError('Cannot reach Al-Waseet: ' + e.message, 'NET');
  }
  const setNames = storeCookies(res);
  Object.assign(lastInfo, { endpoint, status: res.status, redirected: res.redirected, finalUrlPath: new URL(res.url).pathname,
    setCookies: setNames, headerNames: [...res.headers.keys()] });
  const text = await res.text();
  try { json = JSON.parse(text); } catch { throw new AlWaseetError(`Unexpected response (HTTP ${res.status})`, 'PARSE', res.status); }
  if (json.status !== true) {
    console.log(`Al-Waseet error on ${endpoint}: errNum=${json.errNum} http=${res.status} msg=${json.msg}`);
    throw new AlWaseetError(json.msg || 'Al-Waseet error', json.errNum, res.status);
  }
  return json.data;
}

async function login(username, password) {
  jar.clear(); setSetting('aw_cookies', '{}');
  const data = await raw('POST', 'login', { form: { username, password } });
  console.log('Al-Waseet login response info: ' + JSON.stringify(lastInfo));
  if (!data || !data.token) throw new AlWaseetError('Login succeeded but no token returned');
  console.log('Al-Waseet login ok; response fields: ' + Object.keys(data).join(','));
  const tk = String(data.token);
  return getSetting('aw_token_prefix') === '@@' && !tk.startsWith('@@') ? '@@' + tk : tk;
}

async function token(force = false) {
  let t = getSetting('aw_token');
  if (t && !force) return t;
  const c = credentials();
  if (!c.username || !c.password) throw new AlWaseetError('Al-Waseet username/password not set (Settings)', 'NOCRED');
  t = await login(c.username, c.password);
  setSetting('aw_token', t);
  return t;
}

const looksLikeAuthError = e =>
  e.httpStatus === 401 || e.httpStatus === 403 ||
  /token|auth|login|unauthor|توكن|تسجيل|الدخول|صلاحي/i.test(e.message || '');

// Authenticated call: re-login once if the token expired (it resets after a password change).
async function call(method, endpoint, opts = {}) {
  const q = { ...(opts.query || {}) };
  try {
    return await raw(method, endpoint, { ...opts, query: { ...q, token: await token() } });
  } catch (e) {
    if (e.errNum === 'NOCRED' || !looksLikeAuthError(e)) throw e;
    return raw(method, endpoint, { ...opts, query: { ...q, token: await token(true) } });
  }
}

// Iraqi mobile → +9647XXXXXXXXX as required by the API.
function normalizeMobile(m) {
  if (!m) return '';
  let d = String(m).replace(/[^\d+]/g, '');
  d = d.replace(/^\+/, '');
  if (d.startsWith('00964')) d = d.slice(5);
  else if (d.startsWith('964')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  if (!/^7\d{9}$/.test(d)) return null;            // invalid
  return '+964' + d;
}

// ---- reference data (cached in memory; rarely changes) ----
const cache = new Map();
async function cached(key, ttlMs, fn) {
  const c = cache.get(key);
  if (c && Date.now() - c.at < ttlMs) return c.v;
  const v = await fn();
  cache.set(key, { v, at: Date.now() });
  return v;
}
const DAY = 864e5;

module.exports = {
  raw, lastInfo, jar,
  BASE, AlWaseetError, isConfigured, credentials, login, token, normalizeMobile,
  clearToken: () => setSetting('aw_token', ''),
  cities: () => cached('cities', DAY, () => raw('GET', 'citys')),
  regions: cityId => cached('regions:' + cityId, DAY, () => raw('GET', 'regions', { query: { city_id: cityId } })),
  packageSizes: () => cached('sizes', DAY, () => raw('GET', 'package-sizes')),
  statuses: () => cached('statuses', DAY / 4, () => call('GET', 'statuses')),
  createOrder: form => call('POST', 'create-order', { form }),
  editOrder: form => call('POST', 'edit-order', { form }),
  merchantOrders: () => call('GET', 'merchant-orders'),
  ordersByIds: ids => call('POST', 'get-orders-by-ids-bulk', { form: { ids: ids.slice(0, 25).join(',') } }),
  invoices: () => call('GET', 'get_merchant_invoices'),
  invoiceOrders: id => call('GET', 'get_merchant_invoice_orders', { query: { invoice_id: id } }),
  receiveInvoice: id => call('GET', 'receive_merchant_invoice', { query: { invoice_id: id } }),
};
