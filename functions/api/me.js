// GET /api/me: who is signed in on this browser, if anyone.
import { json } from '../lib/http.js'
import { currentSession } from '../lib/auth.js'

export async function onRequestGet({ request, env }) {
  const session = await currentSession(request, env.DB)
  if (!session) return json({ signedIn: false }, 401)
  return json({ signedIn: true, email: session.user.email })
}
