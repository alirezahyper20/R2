'use strict';
// Shared helpers. All business dates are stored as local time (Asia/Baghdad by default).
const pad = n => String(n).padStart(2, '0');
function fmt(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
const now = () => fmt(new Date());
const today = () => now().slice(0, 10);
const isDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
const int = (v, def = 0) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? n : def; };
const str = (v, max = 500) => (v == null ? '' : String(v).trim().slice(0, max));

function httpError(status, message) { const e = new Error(message); e.status = status; return e; }
function required(obj, fields) {
  for (const f of fields) if (obj[f] == null || obj[f] === '') throw httpError(400, `Missing field: ${f}`);
}
module.exports = { now, today, isDate, int, str, httpError, required, fmt };
