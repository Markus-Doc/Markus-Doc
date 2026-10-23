'use strict'

// A tiny stand-in for the shared stack profile library (/free/tools-shared/profile/profile.js), so the register
// works standalone before the library lands or if it fails to load. Memory only: nothing is stored, and
// the page says so. When the real library is present this file does nothing.
;(function () {
  if (window.MWProfile) return
  let profile = empty()
  const listeners = []
  function empty() {
    const now = new Date().toISOString()
    return { format: 'markuswalker.stack-profile', schema_version: '1.0', created: now.slice(0, 10), updated: now,
      written_by: { tool: 'ai-register', build: '2026.10.22', kb_as_at: '' }, label: '',
      stack: { platforms: [], unlisted: [], preset: null }, context: {}, business: {}, answers: {} }
  }
  function copy(v) { return JSON.parse(JSON.stringify(v)) }
  function fire() { for (const cb of listeners) { try { cb(copy(profile)) } catch (e) { /* a listener failed, keep going */ } } }
  window.MWProfile = {
    fallback: true,
    get() { return copy(profile) },
    set(p) { profile = copy(p); profile.updated = new Date().toISOString(); fire() },
    update(fn) { const d = copy(profile); fn(d); this.set(d) },
    setAnswers(toolId, obj, version) { this.update(d => { d.answers = d.answers || {}; d.answers[toolId] = Object.assign({ version: version || '' }, copy(obj)) }) },
    getAnswers(toolId) { return profile.answers && profile.answers[toolId] ? copy(profile.answers[toolId]) : null },
    onChange(cb) { listeners.push(cb) },
    mode() { return 'memory' },
    setMode() { /* the stand-in keeps memory only */ },
    download() {},
    upload() { return Promise.reject(new Error('The stack profile library did not load.')) },
    account: { status() { return { signedIn: false } } }
  }
})()
