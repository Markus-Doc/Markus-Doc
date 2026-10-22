// Password hashing, sessions and attempt limiting for the dev preview login concept. WebCrypto only.
// This module exports no onRequest handler, so Pages does not route it.

import { getCookie, SESSION_COOKIE, SESSION_DAYS, nowSeconds } from './http.js'

// Cloudflare Workers caps PBKDF2 at 100,000 iterations, which is also the floor we set ourselves.
export const PBKDF2_ITERATIONS = 100000
const KEY_BITS = 256

export const LIMITS = {
  signinFailuresPerIp: 10,     // per 15 minutes
  signinFailuresPerEmail: 10,  // per 15 minutes
  signupsPerIp: 5,             // per hour
  windowSignin: 15 * 60,
  windowSignup: 60 * 60
}

function toHex(buf) {
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('')
}
function fromHex(hex) {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16)
  return out
}
function toBase64Url(bytes) {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function randomToken(bytes = 32) {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)))
}

export async function sha256Hex(text) {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  return toHex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, KEY_BITS))
}

// Stored as "pbkdf2-sha256$<iterations>$<salt hex>$<hash hex>", with a fresh 16-byte salt per user.
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derive(password, salt, PBKDF2_ITERATIONS)
  return 'pbkdf2-sha256$' + PBKDF2_ITERATIONS + '$' + toHex(salt) + '$' + hash
}

function sameText(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') return false
  const iterations = Number(parts[1])
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > PBKDF2_ITERATIONS) return false
  const hash = await derive(password, fromHex(parts[2]), iterations)
  return sameText(hash, parts[3])
}

// Runs the same work as a real check when the email is unknown, so timing does not reveal which emails exist.
export async function burnPasswordCheck(password) {
  await derive(password, new Uint8Array(16), PBKDF2_ITERATIONS)
  return false
}

export function normaliseEmail(value) {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  if (email.length < 3 || email.length > 254) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return null
  return email
}

export function passwordProblem(value) {
  if (typeof value !== 'string') return 'Enter a password.'
  if (value.length < 10) return 'Use a password of at least 10 characters.'
  if (value.length > 200) return 'Use a password of 200 characters or fewer.'
  return null
}

export async function createSession(db, userId) {
  const token = randomToken(32)
  const now = nowSeconds()
  const expires = now + SESSION_DAYS * 24 * 60 * 60
  await db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256Hex(token), userId, now, expires).run()
  return { token, maxAge: expires - now }
}

// Returns { user, tokenHash } for a live session cookie, or null.
export async function currentSession(request, db) {
  const token = getCookie(request, SESSION_COOKIE)
  if (!token || !/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null
  const tokenHash = await sha256Hex(token)
  const row = await db.prepare(
    'SELECT u.id AS id, u.email AS email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'
  ).bind(tokenHash, nowSeconds()).first()
  return row ? { user: row, tokenHash } : null
}

export async function recentAttempts(db, kind, key, windowSeconds) {
  const row = await db.prepare('SELECT COUNT(*) AS n FROM attempts WHERE kind = ? AND key = ? AND at > ?')
    .bind(kind, key, nowSeconds() - windowSeconds).first()
  return row ? Number(row.n) : 0
}

export async function recordAttempt(db, kind, key) {
  const now = nowSeconds()
  await db.batch([
    db.prepare('INSERT INTO attempts (kind, key, at) VALUES (?, ?, ?)').bind(kind, key, now),
    db.prepare('DELETE FROM attempts WHERE at < ?').bind(now - 24 * 60 * 60)
  ])
}
