'use strict'

// The shared stack profile, published at /tools-shared/profile/profile.js. Every tool on the site reads and
// writes one versioned "markuswalker.stack-profile" object (schema 1.0, offerings-atlas
// research/tools-planning-2026-10-22/q2-q5-aibom-and-stack-profile.md) through window.MWProfile.
//
// It holds inputs only: the stack, shared context answers, banded business facts and each tool's own answers.
// Never results, people's names, emails, secrets, prompts or free text beyond the short label and tool names.
//
// Where it lives is the user's choice, promoted in this order: an account (dev preview concept, /api/), a
// downloaded file, or this browser only (localStorage key mw-stack-profile-v1). Before they choose it lives in
// memory and is gone on reload. Every storage call is wrapped, so blocked storage only means no saving.
;(function (root) {
  if (root.MWProfile && root.MWProfile.real) return

  // SCHEMA-CORE START (kept identical in functions/lib/schema.js, checked by tests/schema-sync.test.mjs)
  const FORMAT = 'markuswalker.stack-profile'
  const SCHEMA_VERSION = '1.0'
  const MAX_BYTES = 65536
  const ID = /^[a-z0-9][a-z0-9-]{0,59}$/
  const TOKEN = /^[A-Za-z0-9_.:-]{1,40}$/
  const KEY = /^[A-Za-z0-9_.:-]{1,60}$/
  const DATE = /^\d{4}-\d{2}-\d{2}$/
  const STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?Z$/
  const LIMITS = {
    bytes: MAX_BYTES, platforms: 200, routes: 10, unlisted: 20, unlistedChars: 60, labelChars: 80,
    tools: 40, toolBytes: 16384, answerString: 120, answerArray: 500, answerKeys: 200, answerDepth: 6
  }
  const ENUMS = {
    status: ['in-use', 'trialling', 'planned'],
    account: ['personal', 'business', 'enterprise', 'api', 'unsure'],
    uses_ai: ['none', 'off-the-shelf', 'builds'],
    ai_capabilities: ['text-generation', 'voice-generation', 'image-generation', 'code-generation', 'automation', 'externally-facing'],
    ai_decisions_about_people: ['yes', 'no', 'unsure'],
    data_sensitivity: ['public', 'internal', 'personal', 'sensitive', 'unsure'],
    residency_need: ['none', 'stored', 'processed', 'sovereign', 'unsure'],
    personal_accounts: ['none', 'some', 'most', 'unsure'],
    sector: ['professional-services', 'health', 'aged-care', 'disability', 'education', 'financial-services', 'software',
      'retail', 'energy-utilities', 'telecommunications', 'manufacturing', 'other'],
    entity_type: ['private-business', 'not-for-profit', 'government-body'],
    states: ['nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt'],
    turnover: ['up-to-3m', 'over-3m-to-10m', 'over-10m-to-50m', 'over-50m', 'unsure'],
    headcount: ['1-19', '20-199', '200-plus']
  }
  const CONTEXT_FIELDS = {
    uses_ai: 'one', builds: 'bool', chat_only: 'bool', ai_capabilities: 'many', ai_decisions_about_people: 'one',
    data_sensitivity: 'one', residency_need: 'one', personal_accounts: 'one', regulated: 'bool'
  }
  const BUSINESS_FIELDS = { sector: 'one', entity_type: 'one', states: 'many', turnover: 'one', headcount: 'one' }

  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v) }
  function byteLength(s) { return new TextEncoder().encode(s).length }
  function nowStamp() { return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z') }
  function today() { return nowStamp().slice(0, 10) }
  // Strips control, zero-width and bidi characters, folds whitespace, trims and caps.
  function plainText(v, max) {
    if (typeof v !== 'string') return ''
    return v.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g, ' ')
      .replace(/\s+/g, ' ').trim().slice(0, max)
  }
  // A cheap guard for the two free-text fields: an email, a phone number or a key-like string is dropped.
  function looksPersonal(s) {
    return /@/.test(s) || /\d[\d\s().+-]{7,}\d/.test(s) || /\b(sk|pk|ghp|gho|xox[abpr]|AKIA)[-_A-Z0-9]{6,}/.test(s)
  }

  function emptyProfile() {
    return {
      format: FORMAT, schema_version: SCHEMA_VERSION, created: today(), updated: nowStamp(), written_by: {}, label: '',
      stack: { platforms: [], unlisted: [], preset: null }, context: {}, business: {}, answers: {}
    }
  }

  function cleanAnswerValue(v, depth, path, dropped) {
    if (v === null || typeof v === 'boolean') return v
    if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
    if (typeof v === 'string') {
      if (v.length > LIMITS.answerString) { dropped.push(path); return undefined }
      return v
    }
    if (depth >= LIMITS.answerDepth) { dropped.push(path); return undefined }
    if (Array.isArray(v)) {
      if (v.length > LIMITS.answerArray) dropped.push(path + '[' + LIMITS.answerArray + ':]')
      const out = []
      v.slice(0, LIMITS.answerArray).forEach((x, i) => {
        const c = cleanAnswerValue(x, depth + 1, path + '[' + i + ']', dropped)
        if (c !== undefined) out.push(c)
      })
      return out
    }
    if (isObj(v)) {
      const out = {}
      let n = 0
      for (const k of Object.keys(v)) {
        if (!KEY.test(k) || n >= LIMITS.answerKeys) { dropped.push(path + '.' + k); continue }
        const c = cleanAnswerValue(v[k], depth + 1, path + '.' + k, dropped)
        if (c !== undefined) { out[k] = c; n++ }
      }
      return out
    }
    dropped.push(path)
    return undefined
  }

  function cleanFields(src, spec, path, dropped) {
    const out = {}
    if (src === undefined) return out
    if (!isObj(src)) { dropped.push(path); return out }
    for (const k of Object.keys(src)) {
      const kind = spec[k]
      const v = src[k]
      if (!kind) { dropped.push(path + '.' + k); continue }
      if (v === null || v === undefined) continue
      if (kind === 'bool') {
        if (typeof v === 'boolean') out[k] = v
        else dropped.push(path + '.' + k)
      } else if (kind === 'one') {
        if (ENUMS[k].indexOf(v) !== -1) out[k] = v
        else dropped.push(path + '.' + k)
      } else if (kind === 'many') {
        if (!Array.isArray(v)) { dropped.push(path + '.' + k); continue }
        const list = []
        for (const x of v) {
          if (ENUMS[k].indexOf(x) !== -1 && list.indexOf(x) === -1) list.push(x)
          else dropped.push(path + '.' + k + '[' + String(x).slice(0, 20) + ']')
        }
        out[k] = list
      }
    }
    return out
  }

  // Checks a profile against schema 1.0 and returns a cleaned copy. Wrong format, another major version or an
  // oversized result are errors. Anything else that does not fit is dropped and listed in `dropped`, so a stale
  // or hand-edited file still loads with what is valid in it.
  function validateProfile(input) {
    const errors = []
    const dropped = []
    if (!isObj(input)) return { ok: false, errors: ['The file is not a stack profile.'], dropped, profile: null }
    if (input.format !== FORMAT) return { ok: false, errors: ['The file is not a stack profile (format is not ' + FORMAT + ').'], dropped, profile: null }
    const ver = typeof input.schema_version === 'string' ? input.schema_version : ''
    if (!/^1\.\d{1,3}$/.test(ver)) return { ok: false, errors: ['This stack profile uses schema version ' + (ver || 'unknown') + '. We read version 1.x only.'], dropped, profile: null }

    const p = emptyProfile()
    for (const k of Object.keys(input)) {
      if (['format', 'schema_version', 'created', 'updated', 'written_by', 'label', 'stack', 'context', 'business', 'answers'].indexOf(k) === -1) dropped.push(k)
    }
    p.created = typeof input.created === 'string' && DATE.test(input.created) ? input.created : p.created
    p.updated = typeof input.updated === 'string' && STAMP.test(input.updated) ? input.updated : p.updated

    if (isObj(input.written_by)) {
      const w = input.written_by
      if (typeof w.tool === 'string' && ID.test(w.tool)) p.written_by.tool = w.tool
      if (typeof w.build === 'string' && TOKEN.test(w.build)) p.written_by.build = w.build
      if (typeof w.kb_as_at === 'string' && DATE.test(w.kb_as_at)) p.written_by.kb_as_at = w.kb_as_at
    }

    if (input.label !== undefined) {
      const label = plainText(input.label, LIMITS.labelChars)
      if (label && looksPersonal(label)) dropped.push('label')
      else p.label = label
    }

    const stack = input.stack
    if (stack !== undefined && !isObj(stack)) dropped.push('stack')
    if (isObj(stack)) {
      const seen = {}
      const platforms = Array.isArray(stack.platforms) ? stack.platforms : []
      if (stack.platforms !== undefined && !Array.isArray(stack.platforms)) dropped.push('stack.platforms')
      for (const raw of platforms) {
        const item = typeof raw === 'string' ? { id: raw } : raw
        if (!isObj(item) || typeof item.id !== 'string' || !ID.test(item.id)) { dropped.push('stack.platforms[?]'); continue }
        if (seen[item.id]) continue
        if (p.stack.platforms.length >= LIMITS.platforms) { dropped.push('stack.platforms[' + item.id + ']'); continue }
        seen[item.id] = true
        const out = { id: item.id }
        if (Array.isArray(item.routes)) {
          const routes = item.routes.filter((r, i, a) => typeof r === 'string' && ID.test(r) && a.indexOf(r) === i).slice(0, LIMITS.routes)
          if (routes.length) out.routes = routes
        }
        if (item.status !== undefined) {
          if (ENUMS.status.indexOf(item.status) !== -1) out.status = item.status
          else dropped.push('stack.platforms[' + item.id + '].status')
        }
        if (item.account !== undefined) {
          if (ENUMS.account.indexOf(item.account) !== -1) out.account = item.account
          else dropped.push('stack.platforms[' + item.id + '].account')
        }
        p.stack.platforms.push(out)
      }
      if (Array.isArray(stack.unlisted)) {
        const lower = []
        for (const raw of stack.unlisted) {
          const name = plainText(raw, LIMITS.unlistedChars)
          if (!name) continue
          if (looksPersonal(name)) { dropped.push('stack.unlisted[?]'); continue }
          if (lower.indexOf(name.toLowerCase()) !== -1) continue
          if (p.stack.unlisted.length >= LIMITS.unlisted) { dropped.push('stack.unlisted[' + name + ']'); continue }
          lower.push(name.toLowerCase())
          p.stack.unlisted.push(name)
        }
      } else if (stack.unlisted !== undefined) dropped.push('stack.unlisted')
      if (typeof stack.preset === 'string' && ID.test(stack.preset)) p.stack.preset = stack.preset
      else if (stack.preset !== undefined && stack.preset !== null) dropped.push('stack.preset')
    }

    p.context = cleanFields(input.context, CONTEXT_FIELDS, 'context', dropped)
    p.business = cleanFields(input.business, BUSINESS_FIELDS, 'business', dropped)

    if (input.answers !== undefined && !isObj(input.answers)) dropped.push('answers')
    if (isObj(input.answers)) {
      let n = 0
      for (const tool of Object.keys(input.answers)) {
        const section = input.answers[tool]
        if (!ID.test(tool) || n >= LIMITS.tools || !isObj(section) || typeof section.version !== 'string' || !TOKEN.test(section.version)) {
          dropped.push('answers.' + tool)
          continue
        }
        const clean = cleanAnswerValue(section, 0, 'answers.' + tool, dropped)
        if (byteLength(JSON.stringify(clean)) > LIMITS.toolBytes) { dropped.push('answers.' + tool); continue }
        p.answers[tool] = clean
        n++
      }
    }

    if (byteLength(JSON.stringify(p)) > MAX_BYTES) errors.push('The stack profile is larger than 64 KB.')
    return { ok: errors.length === 0, errors, dropped, profile: errors.length ? null : p }
  }

  function isEmptyProfile(p) {
    if (!isObj(p)) return true
    const s = isObj(p.stack) ? p.stack : {}
    return !(s.platforms && s.platforms.length) && !(s.unlisted && s.unlisted.length) && !p.label &&
      !Object.keys(p.context || {}).length && !Object.keys(p.business || {}).length && !Object.keys(p.answers || {}).length
  }

  // Joins two valid profiles without losing either: base wins on any field both set, the stack lists are unioned.
  function mergeProfiles(base, extra) {
    const out = JSON.parse(JSON.stringify(base))
    const have = out.stack.platforms.map(x => x.id)
    for (const item of extra.stack.platforms) if (have.indexOf(item.id) === -1) out.stack.platforms.push(item)
    const lower = out.stack.unlisted.map(x => x.toLowerCase())
    for (const name of extra.stack.unlisted) if (lower.indexOf(name.toLowerCase()) === -1) out.stack.unlisted.push(name)
    out.stack.platforms = out.stack.platforms.slice(0, LIMITS.platforms)
    out.stack.unlisted = out.stack.unlisted.slice(0, LIMITS.unlisted)
    if (!out.stack.preset) out.stack.preset = extra.stack.preset
    if (!out.label) out.label = extra.label
    for (const part of ['context', 'business', 'answers']) {
      for (const k of Object.keys(extra[part])) if (out[part][k] === undefined) out[part][k] = extra[part][k]
    }
    return out
  }
  // SCHEMA-CORE END

  // ---------------------------------------------------------------------------------------------------------
  // Browser side

  const DEVICE_KEY = 'mw-stack-profile-v1'
  const ACCOUNT_FLAG = 'mw-stack-profile-account' // "1" while signed in on this browser. Holds no profile data.
  const LEGACY_AU = 'readiness-check-progress-v1'
  const LEGACY_ASSESSMENT = 'atlas-assessment-answers'
  const API = '/api'
  const BUILD = '2026.10.22'
  const SAVE_DELAY = 600
  // Accounts run on the live site (owner go-ahead 22 Oct 2026), the dev preview and local test servers. Any
  // other host (a copy, a mirror) offers the file and this browser only.
  const ACCOUNTS = /(^|\.)markuswalker\.com$|(^|\.)pages\.dev$|^localhost$|^127\.0\.0\.1$/.test((root.location && root.location.hostname) || '')

  const listeners = []
  const statusListeners = []
  let mode = 'memory'
  let current = emptyProfile()
  let migratedFrom = []
  let account = { state: 'signed-out', email: null, lastSync: null, error: null, saving: false }
  let saveTimer = null
  let channel = null

  function copy(v) { return JSON.parse(JSON.stringify(v)) }
  function store() { try { return root.localStorage } catch (e) { return null } }
  function readKey(key) { try { const s = store(); return s ? s.getItem(key) : null } catch (e) { return null } }
  function writeKey(key, value) { try { const s = store(); if (!s) return false; s.setItem(key, value); return true } catch (e) { return false } }
  function removeKey(key) { try { const s = store(); if (s) s.removeItem(key) } catch (e) { /* nothing stored */ } }

  function toolId() {
    try {
      const m = /^\/([a-z0-9][a-z0-9-]{0,59})\//.exec(root.location.pathname)
      return m ? m[1] : null
    } catch (e) { return null }
  }

  function readDevice() {
    const raw = readKey(DEVICE_KEY)
    if (!raw) return null
    try {
      const r = validateProfile(JSON.parse(raw))
      return r.ok ? r.profile : null
    } catch (e) { return null }
  }

  function emit() {
    const snapshot = copy(current)
    for (const cb of listeners.slice()) { try { cb(copy(snapshot)) } catch (e) { /* a listener's fault stays its own */ } }
  }
  function emitStatus() {
    const s = statusSnapshot()
    for (const cb of statusListeners.slice()) { try { cb(s) } catch (e) { /* ignore */ } }
  }
  function statusSnapshot() { return Object.assign({ mode: mode }, account) }

  function broadcast(type) {
    const msg = { type: type, mode: mode, profile: current, email: mode === 'account' ? account.email : null }
    try { if (channel) channel.postMessage(msg) } catch (e) { /* no cross-tab updates */ }
  }

  // Legacy keys are read, never changed or removed, and only fill an empty profile. Each value is mapped only
  // where it has an exact home in schema 1.0. The business name is not carried over.
  function legacyProfile() {
    const p = emptyProfile()
    const from = []
    try {
      const raw = readKey(LEGACY_AU)
      const data = raw ? JSON.parse(raw) : null
      if (isObj(data) && isObj(data.profile)) {
        const pr = data.profile
        for (const k of Object.keys(BUSINESS_FIELDS)) if (pr[k] !== undefined) p.business[k] = pr[k]
        if (pr.uses_ai !== undefined) p.context.uses_ai = pr.uses_ai
        if (pr.ai_capabilities !== undefined) p.context.ai_capabilities = pr.ai_capabilities
        if (pr.ai_decisions_about_people !== undefined) p.context.ai_decisions_about_people = pr.ai_decisions_about_people
        if (pr.uses_ai === 'builds') p.context.builds = true
        from.push(LEGACY_AU)
      }
    } catch (e) { /* damaged save, skip it */ }
    try {
      const raw = readKey(LEGACY_ASSESSMENT)
      const data = raw ? JSON.parse(raw) : null
      if (isObj(data) && Array.isArray(data.stack)) {
        for (const id of data.stack) if (typeof id === 'string') p.stack.platforms.push({ id: id })
        from.push(LEGACY_ASSESSMENT)
      }
    } catch (e) { /* damaged save, skip it */ }
    try {
      const m = /^#stack=([a-z0-9,-]{1,400})$/.exec(root.location.hash)
      if (m) {
        for (const id of m[1].split(',').slice(0, 8)) p.stack.platforms.push({ id: id })
        from.push('#stack')
      }
    } catch (e) { /* no fragment */ }
    const r = validateProfile(p)
    return r.ok && !isEmptyProfile(r.profile) ? { profile: r.profile, from: from } : null
  }

  function fillFromLegacy() {
    if (!isEmptyProfile(current)) return false
    const legacy = legacyProfile()
    if (!legacy) return false
    current = legacy.profile
    migratedFrom = legacy.from
    return true
  }

  function stamp(p) {
    p.updated = nowStamp()
    const tool = toolId()
    p.written_by = Object.assign({}, p.written_by, { build: BUILD })
    if (tool) p.written_by.tool = tool
    return p
  }

  function persist() {
    if (mode === 'device') {
      if (!writeKey(DEVICE_KEY, JSON.stringify(current))) {
        account.error = 'This browser blocked saving, so your stack is kept on this page only.'
        emitStatus()
      }
    } else if (mode === 'account') {
      scheduleSave()
    }
  }

  function set(profile) {
    const r = validateProfile(profile)
    if (!r.ok) throw new Error(r.errors.join(' '))
    current = stamp(r.profile)
    persist()
    broadcast('change')
    emit()
    return copy(current)
  }

  // ---------------------------------------------------------------------------------------------------------
  // Account (dev preview concept). The session is an HttpOnly cookie this script never sees.

  async function api(method, path, body, extra) {
    let res
    try {
      res = await fetch(API + path, Object.assign({
        method: method,
        credentials: 'same-origin',
        headers: body !== undefined ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined
      }, extra || {}))
    } catch (e) {
      throw Object.assign(new Error('We could not reach the account service. Check your connection and try again.'), { code: 'offline' })
    }
    const type = res.headers.get('Content-Type') || ''
    if (type.indexOf('application/json') === -1) {
      throw Object.assign(new Error('Accounts are not switched on for this site yet. Download your stack file to keep it.'), { code: 'unavailable', status: res.status })
    }
    let data = null
    try { data = await res.json() } catch (e) { data = null }
    if (!res.ok) {
      throw Object.assign(new Error((data && data.error) || 'Something went wrong (' + res.status + ').'), { code: (data && data.code) || 'error', status: res.status })
    }
    return data
  }

  function scheduleSave() {
    clearTimeout(saveTimer)
    account.saving = true
    emitStatus()
    saveTimer = setTimeout(() => { saveNow().catch(() => { /* shown through status */ }) }, SAVE_DELAY)
  }

  async function saveNow(keepalive) {
    clearTimeout(saveTimer)
    saveTimer = null
    if (mode !== 'account') return
    account.saving = true
    try {
      await api('PUT', '/profile', current, keepalive ? { keepalive: true } : undefined)
      account.lastSync = nowStamp()
      account.error = null
    } catch (e) {
      account.error = e.message
      if (e.status === 401) signedOutLocally()
    } finally {
      account.saving = false
      emitStatus()
    }
  }

  function signedOutLocally() {
    removeKey(ACCOUNT_FLAG)
    account.state = 'signed-out'
    account.email = null
    if (mode === 'account') mode = 'memory'
  }

  async function adoptServer(mergeLocal) {
    const data = await api('GET', '/profile')
    let server = null
    if (data && data.profile) {
      const r = validateProfile(data.profile)
      if (r.ok) server = r.profile
    }
    const local = current
    let next
    let push = false
    if (!server || isEmptyProfile(server)) { next = local; push = !isEmptyProfile(local) }
    else if (mergeLocal && !isEmptyProfile(local)) { next = mergeProfiles(server, local); push = JSON.stringify(next) !== JSON.stringify(server) }
    else next = server
    current = next
    if (isEmptyProfile(current) && fillFromLegacy()) push = true
    if (push) { current = stamp(current); await saveNow() }
    account.lastSync = nowStamp()
    return current
  }

  async function enterAccount(email, mergeLocal) {
    const previous = mode
    mode = 'account'
    account.state = 'signed-in'
    account.email = email
    account.error = null
    writeKey(ACCOUNT_FLAG, '1')
    if (previous === 'device') removeKey(DEVICE_KEY)
    await adoptServer(mergeLocal)
    broadcast('change')
    emit()
    emitStatus()
    return statusSnapshot()
  }

  const accountApi = {
    available: ACCOUNTS,
    status: statusSnapshot,
    async signUp(email, password) {
      const data = await api('POST', '/signup', { email: email, password: password })
      return enterAccount(data.email, true)
    },
    async signIn(email, password) {
      const data = await api('POST', '/signin', { email: email, password: password })
      return enterAccount(data.email, true)
    },
    // Ends the session and clears the stack from this page, so nothing is left behind on a shared computer.
    async signOut() {
      if (saveTimer) await saveNow()
      try { await api('POST', '/signout', {}) } catch (e) { /* the cookie expires on its own */ }
      signedOutLocally()
      mode = 'memory'
      current = emptyProfile()
      broadcast('signout')
      emit()
      emitStatus()
      return statusSnapshot()
    },
    async sync() {
      if (mode !== 'account') return copy(current)
      if (saveTimer) await saveNow()
      account.state = 'checking'
      emitStatus()
      try {
        const me = await api('GET', '/me')
        if (!me || !me.signedIn) { signedOutLocally(); emitStatus(); return copy(current) }
        account.state = 'signed-in'
        account.email = me.email
        await adoptServer(false)
        account.error = null
      } catch (e) {
        if (e.status === 401) signedOutLocally()
        else { account.state = 'signed-in'; account.error = e.message }
      }
      emit()
      emitStatus()
      return copy(current)
    }
  }

  // ---------------------------------------------------------------------------------------------------------
  // Public API

  const MWProfile = {
    real: true,
    FORMAT: FORMAT,
    SCHEMA_VERSION: SCHEMA_VERSION,
    LIMITS: LIMITS,
    ENUMS: ENUMS,
    DEVICE_KEY: DEVICE_KEY,
    get() { return copy(current) },
    set: set,
    update(fn) {
      const draft = copy(current)
      const out = fn(draft)
      return set(out && typeof out === 'object' ? out : draft)
    },
    setAnswers(id, obj, version) {
      if (typeof id !== 'string' || !ID.test(id)) throw new Error('Tool id must look like "ai-register".')
      if (typeof version !== 'string' || !TOKEN.test(version)) throw new Error('Answers need a version, for example "1".')
      return MWProfile.update(d => { d.answers[id] = Object.assign({}, isObj(obj) ? obj : {}, { version: version }) })
    },
    getAnswers(id) { return current.answers[id] ? copy(current.answers[id]) : null },
    onChange(cb) {
      if (typeof cb === 'function') listeners.push(cb)
      return () => { const i = listeners.indexOf(cb); if (i !== -1) listeners.splice(i, 1) }
    },
    onStatus(cb) {
      if (typeof cb === 'function') statusListeners.push(cb)
      return () => { const i = statusListeners.indexOf(cb); if (i !== -1) statusListeners.splice(i, 1) }
    },
    mode() { return mode },
    // Moves the stack to the chosen place and keeps it. Leaving the account ends the session on this browser.
    async setMode(next) {
      if (['memory', 'device', 'account'].indexOf(next) === -1) throw new Error('Unknown save mode: ' + next)
      if (next === mode) return mode
      if (next === 'account') {
        if (account.state !== 'signed-in') throw Object.assign(new Error('Sign up or sign in first to save your stack to an account.'), { code: 'signed-out' })
        mode = 'account'
        removeKey(DEVICE_KEY)
        await saveNow()
      } else {
        if (mode === 'account') {
          if (saveTimer) await saveNow()
          try { await api('POST', '/signout', {}) } catch (e) { /* the cookie expires on its own */ }
          signedOutLocally()
        }
        if (next === 'device') {
          if (!writeKey(DEVICE_KEY, JSON.stringify(current))) {
            mode = 'memory'
            emitStatus()
            throw Object.assign(new Error('This browser blocks saving, so we can keep your stack on this page only. Download the file instead.'), { code: 'blocked' })
          }
        } else removeKey(DEVICE_KEY)
        mode = next
      }
      broadcast('change')
      emit()
      emitStatus()
      return mode
    },
    download(filename) {
      const blob = new Blob([JSON.stringify(current, null, 2) + '\n'], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'stack-profile.json'
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    },
    async upload(file) {
      if (!file) throw new Error('Choose a stack-profile.json file first.')
      if (file.size > MAX_BYTES) throw new Error('That file is larger than 64 KB, so it is not a stack profile we wrote.')
      const text = typeof file.text === 'function' ? await file.text() : await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('We could not read that file.'))
        reader.readAsText(file)
      })
      let data
      try { data = JSON.parse(text) } catch (e) { throw new Error('That file is not valid JSON, so it is not a stack profile.') }
      const r = validateProfile(data)
      if (!r.ok) throw new Error(r.errors.join(' '))
      const out = set(r.profile)
      return { profile: out, dropped: r.dropped }
    },
    clear() { return set(emptyProfile()) },
    validate(p) { return validateProfile(p) },
    empty: emptyProfile,
    isEmpty(p) { return isEmptyProfile(p === undefined ? current : p) },
    migratedFrom() { return migratedFrom.slice() },
    account: accountApi,
    ready: null
  }

  // ---------------------------------------------------------------------------------------------------------
  // Start up

  function start() {
    if (readKey(ACCOUNT_FLAG) === '1') {
      mode = 'account'
      account.state = 'checking'
      return accountApi.sync().then(() => {
        if (mode !== 'account') { if (fillFromLegacy()) emit() }
      })
    }
    const saved = readDevice()
    if (saved) { mode = 'device'; current = saved }
    fillFromLegacy()
    return Promise.resolve()
  }

  try {
    if (typeof BroadcastChannel === 'function') {
      channel = new BroadcastChannel('mw-stack-profile')
      channel.onmessage = e => {
        const msg = e.data
        if (!isObj(msg)) return
        if (msg.type === 'signout') {
          clearTimeout(saveTimer)
          signedOutLocally()
          mode = 'memory'
          current = emptyProfile()
        } else if (msg.type === 'change') {
          const r = validateProfile(msg.profile)
          if (!r.ok || ['memory', 'device', 'account'].indexOf(msg.mode) === -1) return
          // A tab still holding an unsaved stack in memory never overwrites a signed-in tab.
          if (msg.mode === 'memory' && mode === 'account') return
          current = r.profile
          if (msg.mode !== mode) {
            if (mode === 'account') { clearTimeout(saveTimer); signedOutLocally() }
            mode = msg.mode
            if (mode === 'account') { account.state = 'signed-in'; account.email = typeof msg.email === 'string' ? msg.email : null }
          }
        } else return
        emit()
        emitStatus()
      }
    }
  } catch (e) { channel = null }

  // Without BroadcastChannel the storage event still carries device saves between tabs.
  try {
    root.addEventListener('storage', e => {
      if (channel || e.key !== DEVICE_KEY || mode !== 'device') return
      const saved = readDevice()
      if (saved) { current = saved; emit() }
    })
    root.addEventListener('pagehide', () => { if (saveTimer) saveNow(true) })
  } catch (e) { /* not in a browser */ }

  MWProfile.ready = start().catch(() => { /* status carries the error */ }).then(() => { emit(); emitStatus(); return copy(current) })
  root.MWProfile = MWProfile
})(typeof window !== 'undefined' ? window : globalThis)
