// POST /api/signin { email, password }: starts a session. Failures are limited per IP and per email.
import { json, fail, readJson, sessionCookie, clientIp, nowSeconds } from '../lib/http.js'
import { normaliseEmail, verifyPassword, burnPasswordCheck, createSession, recentAttempts, recordAttempt, sha256Hex, LIMITS } from '../lib/auth.js'

const WRONG = 'That email and password do not match an account.'
const WAIT = 'Too many sign-in attempts. Please wait 15 minutes and try again.'

export async function onRequestPost({ request, env }) {
  const db = env.DB
  const ipKey = await sha256Hex('ip:' + clientIp(request))
  if (await recentAttempts(db, 'signin-ip', ipKey, LIMITS.windowSignin) >= LIMITS.signinFailuresPerIp) {
    return fail(429, 'rate-limited', WAIT, { 'Retry-After': '900' })
  }
  const body = await readJson(request, 4096)
  if (body.response) return body.response
  const email = normaliseEmail(body.data && body.data.email)
  const password = body.data && typeof body.data.password === 'string' ? body.data.password : ''
  if (!email || !password || password.length > 200) return fail(400, 'bad-input', 'Enter your email and password.')

  const emailKey = await sha256Hex('email:' + email)
  if (await recentAttempts(db, 'signin-email', emailKey, LIMITS.windowSignin) >= LIMITS.signinFailuresPerEmail) {
    return fail(429, 'rate-limited', WAIT, { 'Retry-After': '900' })
  }

  const user = await db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').bind(email).first()
  const ok = user ? await verifyPassword(password, user.password_hash) : await burnPasswordCheck(password)
  if (!ok) {
    await recordAttempt(db, 'signin-ip', ipKey)
    await recordAttempt(db, 'signin-email', emailKey)
    return fail(401, 'wrong', WRONG)
  }
  await db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(nowSeconds()).run()
  const session = await createSession(db, user.id)
  return json({ signedIn: true, email: user.email }, 200, { 'Set-Cookie': sessionCookie(session.token, session.maxAge) })
}
