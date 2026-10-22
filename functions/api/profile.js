// GET /api/profile: the signed-in user's stack profile (null when none is saved yet).
// PUT /api/profile: replace it. The body must be a schema 1.0 profile of at most 64 KB. We store the cleaned copy.
import { json, fail, readJson, nowSeconds } from '../lib/http.js'
import { currentSession } from '../lib/auth.js'
import { validateProfile, MAX_BYTES } from '../lib/schema.js'

export async function onRequestGet({ request, env }) {
  const session = await currentSession(request, env.DB)
  if (!session) return fail(401, 'signed-out', 'Sign in to see the stack saved to your account.')
  const row = await env.DB.prepare('SELECT profile, updated_at FROM profiles WHERE user_id = ?').bind(session.user.id).first()
  if (!row) return json({ profile: null, updated: null })
  let profile = null
  try { profile = JSON.parse(row.profile) } catch (e) { profile = null }
  return json({ profile, updated: new Date(row.updated_at * 1000).toISOString() })
}

export async function onRequestPut({ request, env }) {
  const session = await currentSession(request, env.DB)
  if (!session) return fail(401, 'signed-out', 'Sign in to save your stack to your account.')
  const body = await readJson(request, MAX_BYTES)
  if (body.response) return body.response
  const result = validateProfile(body.data)
  if (!result.ok) return fail(422, 'invalid-profile', result.errors.join(' '))
  const now = nowSeconds()
  await env.DB.prepare(
    'INSERT INTO profiles (user_id, profile, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET profile = excluded.profile, updated_at = excluded.updated_at'
  ).bind(session.user.id, JSON.stringify(result.profile), now).run()
  return json({ saved: true, updated: new Date(now * 1000).toISOString(), dropped: result.dropped })
}
