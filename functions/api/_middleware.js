// Runs before every /api/ function: checks the binding, blocks cross-site writes and keeps errors in JSON.
import { fail } from '../lib/http.js'

const WRITE = ['POST', 'PUT', 'PATCH', 'DELETE']

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)

  if (!env.DB) return fail(503, 'not-configured', 'Accounts are not set up on this site yet.')

  if (WRITE.indexOf(request.method) !== -1) {
    // CSRF: the session cookie is SameSite=Lax, and on top of that a write must come from our own origin and
    // carry a JSON body, which a cross-site form cannot send without a CORS preflight we never answer.
    const origin = request.headers.get('Origin')
    if (origin) {
      let host = null
      try { host = new URL(origin).host } catch (e) { host = null }
      if (host !== url.host) return fail(403, 'cross-site', 'That request came from another site.')
    } else if (request.headers.get('Sec-Fetch-Site') === 'cross-site') {
      return fail(403, 'cross-site', 'That request came from another site.')
    }
    const type = request.headers.get('Content-Type') || ''
    if (!/^application\/json\b/i.test(type)) return fail(415, 'json-only', 'Send the request as JSON.')
  }

  try {
    return await context.next()
  } catch (e) {
    console.error('api error', url.pathname, e && e.stack ? e.stack : e)
    return fail(500, 'server-error', 'Something went wrong on our side. Please try again.')
  }
}
