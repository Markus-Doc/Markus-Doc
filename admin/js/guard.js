'use strict'

// Host guard for the admin mock. The page belongs on the dev preview only, and the deploy leaves it out of the
// live site. As a second lock, on the live hostnames the page shows only "Not available" and loads no data.
// Loaded in the head so nothing paints first. The same file runs in the Node tests.
;(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else root.AdminGuard = api
})(typeof self !== 'undefined' ? self : this, function () {
  const LIVE = ['www.markuswalker.com', 'markuswalker.com']

  function blocked(hostname) {
    const host = String(hostname || '').toLowerCase().replace(/\.$/, '')
    return LIVE.includes(host)
  }

  function apply(doc, hostname) {
    if (!blocked(hostname)) return false
    doc.documentElement.setAttribute('data-blocked', '')
    const render = () => {
      doc.title = 'Not available'
      doc.body.textContent = ''
      const p = doc.createElement('p')
      p.className = 'ad-blocked'
      p.textContent = 'Not available'
      doc.body.appendChild(p)
    }
    if (doc.body) render()
    else doc.addEventListener('DOMContentLoaded', render)
    return true
  }

  if (typeof document !== 'undefined' && typeof location !== 'undefined') apply(document, location.hostname)

  return { blocked, apply, LIVE }
})
