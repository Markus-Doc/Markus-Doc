// Small helpers shared by the /api/ functions. This module exports no onRequest handler, so Pages does not
// route it.

export const SESSION_COOKIE = 'mw_session'
export const SESSION_DAYS = 30

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: Object.assign({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    }, extraHeaders)
  })
}

export function fail(status, code, message, extraHeaders) {
  return json({ error: message, code }, status, extraHeaders)
}

// Reads a JSON body no larger than `max` bytes. Returns { data } or { response } with the error to send.
export async function readJson(request, max) {
  const declared = Number(request.headers.get('Content-Length') || 0)
  if (declared > max) return { response: fail(413, 'too-large', 'That request is too large.') }
  const text = await request.text()
  if (new TextEncoder().encode(text).length > max) return { response: fail(413, 'too-large', 'That request is too large.') }
  try {
    return { data: JSON.parse(text) }
  } catch (e) {
    return { response: fail(400, 'bad-json', 'That request is not valid JSON.') }
  }
}

export function getCookie(request, name) {
  const header = request.headers.get('Cookie') || ''
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i === -1) continue
    if (part.slice(0, i).trim() === name) return part.slice(i + 1).trim()
  }
  return null
}

export function sessionCookie(token, maxAge) {
  return SESSION_COOKIE + '=' + token + '; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=' + maxAge
}

export function clearSessionCookie() {
  return SESSION_COOKIE + '=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
}

export function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || 'local'
}

export function nowSeconds() {
  return Math.floor(Date.now() / 1000)
}
