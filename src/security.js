'use strict';
// Password hashing, sessions, and encryption of the Al-Waseet password at rest.
const crypto = require('node:crypto');
const { get, run, getSetting, setSetting } = require('./db');

// APP_SECRET encrypts stored credentials. Generated once and kept in the DB if not set in env.
function appSecret() {
  if (process.env.APP_SECRET) return process.env.APP_SECRET;
  let s = getSetting('_app_secret');
  if (!s) { s = crypto.randomBytes(32).toString('hex'); setSetting('_app_secret', s); }
  return s;
}
const key = () => crypto.createHash('sha256').update(appSecret()).digest();

function encrypt(text) {
  if (text == null || text === '') return '';
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(String(text), 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map(b => b.toString('base64')).join('.');
}
function decrypt(payload) {
  if (!payload) return '';
  try {
    const [iv, tag, enc] = payload.split('.').map(s => Buffer.from(s, 'base64'));
    const d = crypto.createDecipheriv('aes-256-gcm', key(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
  } catch { return ''; }
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { hash, salt };
}
function verifyPassword(password, hash, salt) {
  const h = crypto.scryptSync(String(password), salt, 64);
  const ref = Buffer.from(hash, 'hex');
  return ref.length === h.length && crypto.timingSafeEqual(ref, h);
}

const SESSION_DAYS = 30;
function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  run('INSERT INTO sessions(token, user_id, expires_at) VALUES(?, ?, ?)',
    token, userId, Date.now() + SESSION_DAYS * 864e5);
  run('DELETE FROM sessions WHERE expires_at < ?', Date.now());
  return token;
}
function sessionUser(token) {
  if (!token) return null;
  const u = get(`SELECT u.id, u.username, u.display_name, u.role FROM sessions s
                 JOIN users u ON u.id = s.user_id
                 WHERE s.token = ? AND s.expires_at > ? AND u.active = 1`, token, Date.now());
  return u;
}
function destroySession(token) { run('DELETE FROM sessions WHERE token = ?', token); }

// simple in-memory login throttle: 10 failed attempts per 15 min per IP
const attempts = new Map();
function loginAllowed(ip) {
  const a = attempts.get(ip);
  if (!a) return true;
  if (Date.now() - a.first > 15 * 60e3) { attempts.delete(ip); return true; }
  return a.count < 10;
}
function loginFailed(ip) {
  const a = attempts.get(ip);
  if (!a || Date.now() - a.first > 15 * 60e3) attempts.set(ip, { first: Date.now(), count: 1 });
  else a.count++;
}
function loginOk(ip) { attempts.delete(ip); }

module.exports = {
  encrypt, decrypt, hashPassword, verifyPassword,
  createSession, sessionUser, destroySession, SESSION_DAYS,
  loginAllowed, loginFailed, loginOk,
};
