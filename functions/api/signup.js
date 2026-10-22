// POST /api/signup { email, password }: creates an account and signs it in. Dev preview concept only.
import { json, fail, readJson, sessionCookie, clientIp, nowSeconds } from '../lib/http.js'
import { normaliseEmail, passwordProblem, hashPassword, createSession, recentAttempts, recordAttempt, sha256Hex, LIMITS } from '../lib/auth.js'

const EXISTS = 'An account with that email already exists. Sign in instead.'

export async function onRequestPost({ request, env }) {
  const db = env.DB
  const ipKey = await sha256Hex('ip:' + clientIp(request))
  if (await recentAttempts(db, 'signup-ip', ipKey, LIMITS.windowSignup) >= LIMITS.signupsPerIp) {
    return fail(429, 'rate-limited', 'Too many accounts created from here. Please try again in an hour.', { 'Retry-After': '3600' })
  }
  const body = await readJson(request, 4096)
  if (body.response) return body.response
  const email = normaliseEmail(body.data && body.data.email)
  if (!email) return fail(400, 'bad-email', 'Enter a valid email address.')
  const problem = passwordProblem(body.data.password)
  if (problem) return fail(400, 'bad-password', problem)

  await recordAttempt(db, 'signup-ip', ipKey)
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existing) return fail(409, 'exists', EXISTS)

  const id = crypto.randomUUID()
  const now = nowSeconds()
  try {
    await db.prepare('INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .bind(id, email, await hashPassword(body.data.password), now, now).run()
  } catch (e) {
    if (/UNIQUE/i.test(String(e && e.message))) return fail(409, 'exists', EXISTS)
    throw e
  }
  const session = await createSession(db, id)
  return json({ signedIn: true, email }, 201, { 'Set-Cookie': sessionCookie(session.token, session.maxAge) })
}
