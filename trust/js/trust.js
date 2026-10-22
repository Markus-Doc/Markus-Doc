'use strict'

// Fills the corrections count from data/corrections.json, so the count changes without editing the page.
// The page already carries the figure as of its last edit, and keeps it if the file cannot be read.
// Each entry: { "date": "YYYY-MM-DD", "platform": "...", "control": "...", "summary": "...", "credit": "name or empty" }
;(function () {
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  function day(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '')
    return m ? Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1] : ''
  }
  function el(tag, cls, text) {
    const e = document.createElement(tag)
    if (cls) e.className = cls
    if (text) e.textContent = text
    return e
  }
  document.addEventListener('DOMContentLoaded', () => {
    const box = document.getElementById('tr-corrections')
    if (!box || !window.fetch) return
    fetch(box.getAttribute('data-src'), { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(data => {
        const n = Number(data.outside_corrections)
        if (!Number.isFinite(n) || n < 0) return
        const from = day(data.counting_from)
        const updated = day(data.updated)
        document.getElementById('tr-count').textContent = String(n)
        document.getElementById('tr-count-line').textContent = n === 0
          ? 'None from outside yet. This count starts on ' + from + '.'
          : (n === 1 ? 'One finding' : n + ' findings') + ' changed after a report from outside our team, counted from ' + from + '.'
        document.getElementById('tr-updated').textContent = updated ? 'Last updated ' + updated + '.' : ''
        const list = document.getElementById('tr-list')
        list.textContent = ''
        for (const c of Array.isArray(data.entries) ? data.entries : []) {
          const li = el('li')
          li.append(el('strong', null, [c.platform, c.control].filter(Boolean).join(', ')))
          li.append(el('span', null, ' ' + [day(c.date), c.summary, c.credit ? 'Reported by ' + c.credit + '.' : ''].filter(Boolean).join('. ').replace(/\.\./g, '.')))
          list.append(li)
        }
        list.hidden = !list.children.length
      })
      .catch(() => { /* keep the figure written into the page */ })
  })
})()
