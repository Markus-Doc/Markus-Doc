'use strict'

// Light and dark mode. Loaded in the head so a saved choice applies before the page paints.
// With no saved choice the page follows the system setting through CSS alone. Light always
// works, including when storage is blocked or this script fails.
;(function () {
  const KEY = 'readiness-check-theme'
  const query = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null

  function saved() {
    try {
      const value = window.localStorage.getItem(KEY)
      return value === 'light' || value === 'dark' ? value : null
    } catch (e) { return null }
  }
  function active() {
    return document.documentElement.dataset.theme || (query && query.matches ? 'dark' : 'light')
  }
  function sync() {
    const button = document.getElementById('theme-toggle')
    if (!button) return
    const dark = active() === 'dark'
    button.setAttribute('aria-pressed', String(dark))
    document.getElementById('theme-label').textContent = dark ? 'Light mode' : 'Dark mode'
    button.setAttribute('aria-label', dark ? 'Dark mode is on. Switch to light mode' : 'Light mode is on. Switch to dark mode')
  }
  function set(theme) {
    document.documentElement.dataset.theme = theme
    try { window.localStorage.setItem(KEY, theme) } catch (e) { /* the choice lasts for this page only */ }
    sync()
  }

  const initial = saved()
  if (initial) document.documentElement.dataset.theme = initial
  document.addEventListener('DOMContentLoaded', () => {
    sync()
    const button = document.getElementById('theme-toggle')
    if (button) button.addEventListener('click', () => set(active() === 'dark' ? 'light' : 'dark'))
  })
  if (query && query.addEventListener) query.addEventListener('change', sync)
})()
