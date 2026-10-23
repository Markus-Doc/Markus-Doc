'use strict'

// The shared site nav works with no script: each tool's menu is a <details>. This only tidies it:
// opening one menu closes the other, and Escape or a click outside closes an open menu. A mouse leaving an
// open menu closes it after a short pause (owner, 22 Oct 2026), so crossing the gap to its list keeps it open.
// On phones (720px and under) it adds a Menu button that shows and hides the nav (22 Oct 2026). With no script
// there is no button and the list stays in view.
;(function () {
  function menus() { return Array.from(document.querySelectorAll('.tools-nav-menu')) }
  function closeAll(except) {
    for (const m of menus()) if (m !== except) m.open = false
  }
  function addToggle(nav) {
    const list = nav.querySelector('.tools-nav-list')
    if (!list || nav.querySelector('.tools-nav-toggle') || nav.previousElementSibling?.classList.contains('tools-nav-toggle')) return null
    if (!list.id) list.id = 'tools-nav-list'
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'tools-nav-toggle'
    button.setAttribute('aria-expanded', 'false')
    button.setAttribute('aria-controls', list.id)
    button.textContent = 'Menu'
    nav.classList.add('has-toggle')
    nav.before(button)
    button.addEventListener('click', () => setOpen(nav, button, !nav.classList.contains('is-open')))
    return button
  }
  function setOpen(nav, button, open) {
    nav.classList.toggle('is-open', open)
    button.setAttribute('aria-expanded', String(open))
    if (!open) closeAll(null)
  }
  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.tools-nav')
    const toggle = nav ? addToggle(nav) : null
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
      if (open) {
        open.open = false
        open.querySelector('summary').focus()
        return
      }
      if (toggle && nav.classList.contains('is-open')) {
        setOpen(nav, toggle, false)
        toggle.focus()
      }
    })
    document.addEventListener('click', e => {
      if (!e.target.closest('.tools-nav-menu')) closeAll(null)
    })
  })
})()
