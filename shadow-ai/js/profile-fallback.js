'use strict'

// A tiny stand-in for the shared stack profile library (/tools-shared/profile/profile.js, see
// site-tools docs/CONTRACT.md). It only runs when that library did not load, so the check still works
// standalone. Memory only: nothing is stored and nothing leaves the page.
;(function () {
  if (window.MWProfile) return
  const listeners = []
  let profile = { format: 'markuswalker.stack-profile', schema_version: '1.0', label: '', stack: { platforms: [], unlisted: [], preset: null }, context: {}, business: {}, answers: {} }
  const clone = o => JSON.parse(JSON.stringify(o))
  function fire() { for (const cb of listeners) { try { cb(clone(profile)) } catch (e) { /* a listener error stays local */ } } }
  window.MWProfile = {
    fallback: true,
    get: () => clone(profile),
    set: p => { profile = clone(p); fire() },
    update: fn => { const d = clone(profile); fn(d); profile = d; fire() },
    setAnswers: (toolId, obj, version) => { profile.answers[toolId] = Object.assign({ version: version || '' }, clone(obj)); fire() },
    getAnswers: toolId => profile.answers[toolId] ? clone(profile.answers[toolId]) : null,
    onChange: cb => { listeners.push(cb) },
    mode: () => 'memory',
    setMode: () => {},
    download: () => {},
    upload: () => Promise.reject(new Error('The stack profile library is not available on this page.')),
    account: { status: () => 'unavailable', signUp: () => Promise.reject(new Error('unavailable')), signIn: () => Promise.reject(new Error('unavailable')), signOut: () => Promise.resolve(), sync: () => Promise.resolve() }
  }
})()
