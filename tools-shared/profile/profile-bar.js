'use strict'

// The "Your stack" bar, published at /tools-shared/profile/profile-bar.js. Load it after profile.js:
//
//   <script src="/tools-shared/profile/profile.js"></script>
//   <script src="/tools-shared/profile/profile-bar.js" defer></script>
//   <div data-mw-profile-bar></div>
//
// Every element with data-mw-profile-bar gets the bar, or call MWProfileBar.mount(element). It shows how many
// platforms and other tools are in the stack, where it is kept, and the three ways to keep it in the order we
// promote them: an account first, then the file, then this browser only. It adds profile.css itself when the
// page has not linked it. It builds DOM nodes only, never HTML strings.
;(function () {
  const script = document.currentScript
  const base = script && script.src ? script.src.replace(/[^/]*$/, '') : '/tools-shared/profile/'
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

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many) }

  function summary(p) {
    const a = p.stack.platforms.length
    const b = p.stack.unlisted.length
    if (!a && !b) return 'No platforms added yet.'
    const parts = []
    if (a) parts.push(plural(a, 'platform', 'platforms'))
    if (b) parts.push(plural(b, 'other tool', 'other tools'))
    return parts.join(' and ') + '.'
  }

  const MODE_TEXT = {
    memory: 'Not saved yet',
    device: 'This browser only',
    account: 'Saved to your account'
  }

  function mount(host, options) {
    if (!host || host.getAttribute('data-mwp-mounted') === '1') return
    const P = window.MWProfile
    if (!P) return
    ensureStyles()
    host.setAttribute('data-mwp-mounted', '1')
    const opts = Object.assign({ myStackUrl: host.getAttribute('data-my-stack-url') || '/my-stack/' }, options || {})
    const id = 'mwp-bar-' + (++count)

    const summaryText = el('span', {})
    const modeTag = el('span', { class: 'mwp-mode' })
    const msg = el('p', { class: 'mwp-msg', role: 'status', 'aria-live': 'polite' })
    const file = el('input', { type: 'file', accept: '.json,application/json', hidden: true, tabindex: '-1', 'aria-hidden': 'true' })

    function say(text, isError) {
      msg.textContent = text || ''
      msg.className = 'mwp-msg' + (isError ? ' mwp-msg--error' : '')
    }

    const accountsOn = !P.account || P.account.available !== false
    const signUp = accountsOn
      ? el('a', { class: 'mwp-btn mwp-btn--main', href: opts.myStackUrl + '#account' , text: 'Create a free account' })
      : el('a', { class: 'mwp-btn', href: opts.myStackUrl, text: 'Edit your stack' })
    const signUpHint = el('span', { class: 'mwp-hint', text: accountsOn
      ? 'Your stack follows you to every tool and device, and you can edit it as your AI use grows or shrinks.'
      : 'Free accounts are coming soon, so your stack can follow you to every tool and device. For now, download the file to keep it.' })
    const signedIn = el('span', { class: 'mwp-hint' })
    const signOut = el('button', { class: 'mwp-btn', type: 'button', text: 'Sign out', on: { click: () => {
      P.account.signOut().then(() => say('Signed out. We cleared your stack from this page.')).catch(e => say(e.message, true))
    } } })
    const download = el('button', { class: 'mwp-btn', type: 'button', text: 'Download file', on: { click: () => {
      try { P.download(); say('Saved stack-profile.json to your downloads.') } catch (e) { say(e.message, true) }
    } } })
    const upload = el('button', { class: 'mwp-btn', type: 'button', text: 'Upload your previous stack', on: { click: () => file.click() } })
    file.addEventListener('change', () => {
      const f = file.files && file.files[0]
      file.value = ''
      if (!f) return
      P.upload(f).then(r => say('Loaded your stack' + (r.dropped.length ? ', leaving out ' + plural(r.dropped.length, 'entry', 'entries') + ' we could not use.' : '.')))
        .catch(e => say(e.message, true))
    })
    const device = el('button', { class: 'mwp-btn mwp-btn--quiet', type: 'button', 'aria-pressed': 'false', on: { click: () => {
      const on = P.mode() === 'device'
      P.setMode(on ? 'memory' : 'device')
        .then(m => say(m === 'device' ? 'Kept in this browser only.' : 'Removed from this browser.'))
        .catch(e => say(e.message, true))
    } } })
    const warn = el('p', { class: 'mwp-warn', text: 'Kept in this browser only. If you clear your browser data, use another browser or change device, you lose it. An account or the file keeps it safe.' })

    const primary = el('div', { class: 'mwp-primary' }, [signUp, signUpHint, signedIn, signOut])
    const bar = el('section', { class: 'mwp-bar', 'aria-labelledby': id }, [
      el('div', { class: 'mwp-head' }, [
        el('h2', { class: 'mwp-title', id: id, text: 'Your stack' }),
        el('p', { class: 'mwp-summary' }, [summaryText, modeTag]),
        el('a', { class: 'mwp-edit', href: opts.myStackUrl, text: 'View and edit your stack' })
      ]),
      el('div', { class: 'mwp-options', role: 'group', 'aria-label': 'Ways to keep your stack' }, [primary, download, upload, file, device]),
      warn,
      el('p', { class: 'mwp-privacy', text: accountsOn ? 'Your stack stays in your browser unless you sign in and choose to save it to your account.' : 'Your stack stays in your browser. We never receive it.' }),
      msg
    ])
    host.replaceChildren(bar)

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
        ? (status.saving ? 'Saving to your account.' : 'Signed in' + (status.email ? ' as ' + status.email : '') + '. Changes save to your account.')
        : ''
      device.hidden = inAccount
      device.setAttribute('aria-pressed', String(mode === 'device'))
      device.textContent = mode === 'device' ? 'Kept in this browser only. Remove it' : 'Keep in this browser only'
      warn.hidden = mode !== 'device'
      if (status.error && inAccount) say(status.error, true)
    }

    P.onChange(render)
    P.onStatus(render)
    render()
  }

  function mountAll() {
    for (const host of document.querySelectorAll('[data-mw-profile-bar]')) mount(host)
  }

  window.MWProfileBar = { mount: mount }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll)
  else mountAll()
})()
