// POST /api/signout: ends this session on the server and clears the cookie.
import { json, clearSessionCookie } from '../lib/http.js'
import { currentSession } from '../lib/auth.js'

export async function onRequestPost({ request, env }) {
  const session = await currentSession(request, env.DB)
  if (session) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(session.tokenHash).run()
  return json({ signedIn: false }, 200, { 'Set-Cookie': clearSessionCookie() })
}
