'use strict'

// A small stand-in for the shared stack profile library (/tools-shared/profile/profile.js), so the stack
// pack works on its own until that library is deployed. It follows the API in docs/CONTRACT.md and does
// nothing when the real library has loaded. Account mode is not offered here: it needs the real library.
;(function () {
  if (window.MWProfile) return

  const KEY = 'mw-stack-profile-v1'
  const MODE_KEY = 'mw-stack-profile-mode'
  const FORMAT = 'markuswalker.stack-profile'
  const listeners = []
  let mode = 'memory'
  let current = null

  function today() { return new Date().toISOString().slice(0, 10) }
  function empty() {
    return {
      format: FORMAT, schema_version: '1.0', created: today(), updated: new Date().toISOString(),
      written_by: { tool: 'stack-pack', build: '2026.10.22' }, label: '',
      stack: { platforms: [], unlisted: [], preset: null }, context: {}, business: {}, answers: {},
    }
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)) }
  const ID = /^[a-z0-9][a-z0-9-]{0,59}$/

  // Inputs only: drop anything the schema does not allow, keep ids that look like KB ids.
  function clean(p) {
    if (!p || typeof p !== 'object' || p.format !== FORMAT) throw new Error('This is not a stack profile file.')
    if (String(p.schema_version || '').split('.')[0] !== '1') throw new Error('This stack profile is from a newer version we cannot read yet.')
    const out = empty()
    out.created = typeof p.created === 'string' ? p.created.slice(0, 10) : out.created
    out.label = typeof p.label === 'string' ? p.label.slice(0, 60) : ''
    const stack = p.stack || {}
    out.stack.platforms = (Array.isArray(stack.platforms) ? stack.platforms : [])
      .filter(x => x && ID.test(x.id || '')).slice(0, 60)
      .map(x => {
        const row = { id: x.id }
        if (Array.isArray(x.routes)) row.routes = x.routes.filter(r => ID.test(r)).slice(0, 10)
        if (typeof x.status === 'string' && ID.test(x.status)) row.status = x.status
        if (typeof x.account === 'string' && ID.test(x.account)) row.account = x.account
        return row
      })
    out.stack.unlisted = (Array.isArray(stack.unlisted) ? stack.unlisted : [])
      .filter(s => typeof s === 'string').map(s => s.slice(0, 60)).slice(0, 20)
    out.stack.preset = typeof stack.preset === 'string' ? stack.preset.slice(0, 60) : null
    for (const k of ['context', 'business', 'answers']) if (p[k] && typeof p[k] === 'object' && !Array.isArray(p[k])) out[k] = clone(p[k])
    return out
  }

  function read() {
    try { return clean(JSON.parse(window.localStorage.getItem(KEY) || 'null')) } catch (e) { return null }
  }
  function write() {
    if (mode !== 'device') return
    try { window.localStorage.setItem(KEY, JSON.stringify(current)) } catch (e) { /* storage blocked: memory only */ }
  }
  function fire() { for (const cb of listeners) { try { cb(clone(current)) } catch (e) { /* a listener failed */ } } }

  try { if (window.localStorage.getItem(MODE_KEY) === 'device') mode = 'device' } catch (e) { /* memory */ }
  current = (mode === 'device' && read()) || empty()

  window.addEventListener('storage', e => {
    if (e.key !== KEY || mode !== 'device') return
    const next = read()
    if (next) { current = next; fire() }
  })

  window.MWProfile = {
    fallback: true,
    get() { return clone(current) },
    set(profile) {
      current = clean(profile)
      current.updated = new Date().toISOString()
      write(); fire()
      return clone(current)
    },
    update(fn) { const draft = clone(current); fn(draft); return this.set(draft) },
    setAnswers(toolId, obj, version) {
      return this.update(d => { d.answers = d.answers || {}; d.answers[toolId] = Object.assign({}, obj, { version: String(version || '1') }) })
    },
    getAnswers(toolId) { return current.answers && current.answers[toolId] ? clone(current.answers[toolId]) : null },
    onChange(cb) { if (typeof cb === 'function') listeners.push(cb) },
    mode() { return mode },
    setMode(next) {
      if (next !== 'memory' && next !== 'device') return mode
      mode = next
      try {
        if (mode === 'device') { window.localStorage.setItem(MODE_KEY, 'device'); window.localStorage.setItem(KEY, JSON.stringify(current)) }
        else { window.localStorage.removeItem(MODE_KEY); window.localStorage.removeItem(KEY) }
      } catch (e) { /* storage blocked */ }
      fire()
      return mode
    },
    download() {
      const blob = new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'stack-profile.json'
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    },
    upload(file) {
      return new Promise((resolve, reject) => {
        if (!file || file.size > 65536) { reject(new Error('Pick a stack-profile.json file under 64 KB.')); return }
        const reader = new FileReader()
        reader.onload = () => { try { resolve(this.set(JSON.parse(String(reader.result)))) } catch (e) { reject(e) } }
        reader.onerror = () => reject(new Error('We could not read that file.'))
        reader.readAsText(file)
      })
    },
    account: {
      status() { return 'unavailable' },
      signUp() { return Promise.reject(new Error('Accounts are not available on this page yet.')) },
      signIn() { return Promise.reject(new Error('Accounts are not available on this page yet.')) },
      signOut() { return Promise.resolve() },
      sync() { return Promise.resolve() },
    },
  }
})()
