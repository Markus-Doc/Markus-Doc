'use strict'

// The shared site nav works with no script: each tool's menu is a <details>. This only tidies it:
// opening one menu closes the other, and Escape or a click outside closes an open menu. A mouse leaving an
// open menu closes it after a short pause (owner, 22 Oct 2026), so crossing the gap to its list keeps it open.
;(function () {
  function menus() { return Array.from(document.querySelectorAll('.tools-nav-menu')) }
  function closeAll(except) {
    for (const m of menus()) if (m !== except) m.open = false
  }
  document.addEventListener('DOMContentLoaded', () => {
    for (const m of menus()) {
      let timer = null
      m.addEventListener('toggle', () => { if (m.open) closeAll(m) })
      m.addEventListener('pointerenter', () => clearTimeout(timer))
      m.addEventListener('pointerleave', e => {
        if (e.pointerType !== 'mouse' || !m.open) return
        clearTimeout(timer)
        timer = setTimeout(() => { m.open = false }, 300)
      })
    }
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return
      const open = menus().find(m => m.open)
      if (!open) return
      open.open = false
      open.querySelector('summary').focus()
    })
    document.addEventListener('click', e => {
      if (!e.target.closest('.tools-nav-menu')) closeAll(null)
    })
  })
})()
