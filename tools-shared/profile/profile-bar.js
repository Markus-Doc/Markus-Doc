'use strict'

// The "Your AI tools" bar, published at /tools-shared/profile/profile-bar.js. Load it after profile.js:
//
//   <script src="/tools-shared/profile/profile.js"></script>
//   <script src="/tools-shared/profile/profile-bar.js" defer></script>
//   <div data-mw-profile-bar></div>
//
// Every element with data-mw-profile-bar gets the bar, or call MWProfileBar.mount(element). It is one slim line:
// how many platforms are on the list, where it is kept, Edit, and "Save or load", a small panel with the three
// ways to keep the list in the order we promote them: an account (greyed out with a Draft tag while accounts are
// off on this host), the file, then this browser only. It adds profile.css itself when the page has not linked
// it. It builds DOM nodes only, never HTML strings.
;(function () {
  const script = document.currentScript
  const base = script && script.src ? script.src.replace(/[^/]*$/, '') : '/tools-shared/profile/'
  const SVG = 'http://www.w3.org/2000/svg'
  let count = 0

  function ensureStyles() {
    if (document.querySelector('link[data-mwp-css], link[href*="profile.css"]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = base + 'profile.css'
    link.setAttribute('data-mwp-css', '')
    document.head.appendChild(link)
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag)
    for (const k of Object.keys(attrs || {})) {
      const v = attrs[k]
      if (v === null || v === undefined || v === false) continue
      if (k === 'text') node.textContent = v
      else if (k === 'on') for (const ev of Object.keys(v)) node.addEventListener(ev, v[ev])
      else node.setAttribute(k, v === true ? '' : String(v))
    }
    for (const c of children || []) if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c)
    return node
  }

  function caret() {
    const svg = document.createElementNS(SVG, 'svg')
    svg.setAttribute('viewBox', '0 0 12 12')
    svg.setAttribute('class', 'mwp-caret')
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('focusable', 'false')
    const path = document.createElementNS(SVG, 'path')
    path.setAttribute('d', 'M2 4.5 6 8.5 10 4.5')
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke', 'currentColor')
    path.setAttribute('stroke-width', '1.8')
    svg.appendChild(path)
    return svg
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many) }

  function summary(p) {
    const a = p.stack.platforms.length
    const b = p.stack.unlisted.length
    if (!a && !b) return 'none yet'
    const parts = [plural(a, 'platform', 'platforms')]
    if (b) parts.push(plural(b, 'other', 'others'))
    return parts.join(', ')
  }

  const MODE_TEXT = { memory: 'Not saved yet', device: 'In this browser', account: 'In your account' }
  const DRAFT_LINE = 'Free accounts are in draft. They open once our security checks are done. For now, download the file or keep it in this browser.'

  function mount(host, options) {
    if (!host || host.getAttribute('data-mwp-mounted') === '1') return
    const P = window.MWProfile
    if (!P) return
    ensureStyles()
    host.setAttribute('data-mwp-mounted', '1')
    const opts = Object.assign({ myStackUrl: host.getAttribute('data-my-stack-url') || '/my-stack/' }, options || {})
    const id = 'mwp-bar-' + (++count)
    const panelId = id + '-panel'

    const summaryText = el('span', { class: 'mwp-count' })
    const modeTag = el('span', { class: 'mwp-mode' })
    const msg = el('p', { class: 'mwp-msg', role: 'status', 'aria-live': 'polite' })
    const file = el('input', { type: 'file', accept: '.json,application/json', hidden: true, tabindex: '-1', 'aria-hidden': 'true' })

    function say(text, isError) {
      msg.textContent = text || ''
      msg.className = 'mwp-msg' + (isError ? ' mwp-msg--error' : '')
    }

    // 1. Account
    const accountOn = !P.account || P.account.available !== false
    const draft = !accountOn
    const signedIn = el('span', { class: 'mwp-hint' })
    const signOut = el('button', { class: 'mwp-btn', type: 'button', text: 'Sign out', on: { click: () => {
      P.account.signOut().then(() => say('Signed out. We cleared your AI tools from this page.')).catch(e => say(e.message, true))
    } } })
    const signUp = draft
      ? el('button', { class: 'mwp-btn mwp-btn--main', type: 'button', disabled: true, 'aria-disabled': 'true', 'aria-describedby': id + '-draft', text: 'Create a free account' })
      : el('a', { class: 'mwp-btn mwp-btn--main', href: opts.myStackUrl + '#account', text: 'Create a free account' })
    const signUpHint = el('span', { class: 'mwp-hint', id: id + '-draft', text: draft ? DRAFT_LINE : 'Or sign in. Your list follows you to every tool and device.' })
    const accountRow = el('div', { class: 'mwp-opt' + (draft ? ' mwp-opt--draft' : '') }, [
      el('p', { class: 'mwp-opt-title' }, ['Free account', draft ? el('span', { class: 'mwp-draft', text: 'Draft' }) : null]),
      el('div', { class: 'mwp-opt-body' }, [signUp, signUpHint, signedIn, signOut])
    ])

    // 2. File
    const download = el('button', { class: 'mwp-btn', type: 'button', text: 'Download file', on: { click: () => {
      try { P.download(); say('Saved stack-profile.json to your downloads.') } catch (e) { say(e.message, true) }
    } } })
    const upload = el('button', { class: 'mwp-btn', type: 'button', text: 'Upload previous file', on: { click: () => file.click() } })
    file.addEventListener('change', () => {
      const f = file.files && file.files[0]
      file.value = ''
      if (!f) return
      P.upload(f).then(r => say('Loaded your AI tools' + (r.dropped.length ? ', leaving out ' + plural(r.dropped.length, 'entry', 'entries') + ' we could not use.' : '.')))
        .catch(e => say(e.message, true))
    })
    const fileRow = el('div', { class: 'mwp-opt' }, [
      el('p', { class: 'mwp-opt-title', text: 'File' }),
      el('div', { class: 'mwp-opt-body' }, [download, upload, file])
    ])

    // 3. This browser
    const device = el('button', { class: 'mwp-btn', type: 'button', 'aria-pressed': 'false', on: { click: () => {
      const on = P.mode() === 'device'
      P.setMode(on ? 'memory' : 'device')
        .then(m => say(m === 'device' ? 'Kept in this browser.' : 'Removed from this browser.'))
        .catch(e => say(e.message, true))
    } } })
    const warn = el('span', { class: 'mwp-hint mwp-warn', text: 'Lost if you clear browser data or change device.' })
    const deviceRow = el('div', { class: 'mwp-opt' }, [
      el('p', { class: 'mwp-opt-title', text: 'This browser' }),
      el('div', { class: 'mwp-opt-body' }, [device, warn])
    ])

    const privacy = el('p', { class: 'mwp-privacy', text: draft
      ? 'Your list stays in your browser. We never receive it.'
      : 'Your list stays in your browser unless you sign in and choose to save it to your account.' })

    const panel = el('div', { class: 'mwp-panel', id: panelId, role: 'group', 'aria-label': 'Save or load your AI tools', tabindex: '-1', hidden: true },
      [accountRow, fileRow, deviceRow, privacy, msg])

    const toggle = el('button', { class: 'mwp-btn mwp-toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': panelId }, ['Save or load', caret()])
    const edit = el('a', { class: 'mwp-btn', href: opts.myStackUrl, text: 'Edit' })

    const bar = el('section', { class: 'mwp-bar', 'aria-labelledby': id }, [
      el('div', { class: 'mwp-line' }, [
        el('p', { class: 'mwp-summary' }, [el('span', { class: 'mwp-title', id: id, text: 'Your AI tools:' }), ' ', summaryText, modeTag]),
        el('div', { class: 'mwp-actions' }, [edit, toggle])
      ]),
      panel
    ])
    host.replaceChildren(bar)

    function isOpen() { return !panel.hidden }
    function open() {
      panel.hidden = false
      toggle.setAttribute('aria-expanded', 'true')
      const first = [...panel.querySelectorAll('a[href], button:not([disabled])')].find(n => n.getClientRects().length)
      ;(first || panel).focus()
    }
    function close(focusToggle) {
      if (!isOpen()) return
      panel.hidden = true
      toggle.setAttribute('aria-expanded', 'false')
      if (focusToggle) toggle.focus()
    }
    toggle.addEventListener('click', () => { if (isOpen()) close(false); else open() })
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape' || !isOpen()) return
      const active = document.activeElement
      if (active && active !== document.body && !bar.contains(active)) { close(false); return }
      e.preventDefault()
      close(true)
    })
    document.addEventListener('pointerdown', e => { if (isOpen() && !bar.contains(e.target)) close(false) })
    bar.addEventListener('focusout', e => {
      if (isOpen() && e.relatedTarget && !bar.contains(e.relatedTarget)) close(false)
    })

    function render() {
      const p = P.get()
      const mode = P.mode()
      const status = P.account.status()
      summaryText.textContent = summary(p)
      modeTag.textContent = status.state === 'checking' ? 'Checking your account' : MODE_TEXT[mode]
      modeTag.className = 'mwp-mode mwp-mode--' + mode
      const inAccount = mode === 'account'
      signUp.hidden = inAccount
      signUpHint.hidden = inAccount
      signedIn.hidden = !inAccount
      signOut.hidden = !inAccount
      signedIn.textContent = inAccount
        ? (status.saving ? 'Saving to your account.' : 'Signed in' + (status.email ? ' as ' + status.email : '') + '. Changes save as you go.')
        : ''
      deviceRow.hidden = inAccount
      device.setAttribute('aria-pressed', String(mode === 'device'))
      device.textContent = mode === 'device' ? 'Remove from this browser' : 'Keep in this browser'
      if (status.error && inAccount) say(status.error, true)
    }

    P.onChange(render)
    if (P.onStatus) P.onStatus(render)
    render()
  }

  function mountAll() {
    for (const host of document.querySelectorAll('[data-mw-profile-bar]')) mount(host)
  }

  window.MWProfileBar = { mount: mount }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll)
  else mountAll()
})()
