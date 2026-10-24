// Folders removed on 24 Oct 2026 (knowledge base data, now at checkableai.com).
// Pages keeps stale copies in its asset cache for up to 7 days, and a zone purge
// does not reach it. A function runs before that cache, so these paths answer 404
// now. Safe to delete this file and its callers after 31 Oct 2026.
export async function gone({ request, env }) {
  const page = await env.ASSETS.fetch(new URL('/404.html', request.url))
  return new Response(page.ok ? page.body : 'Not found', {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex'
    }
  })
}
