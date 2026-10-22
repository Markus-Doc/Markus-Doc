// Generated from profile/profile.js by tools/sync-schema.mjs. Do not edit by hand.
// The stack profile schema 1.0 checks, shared with the browser library.

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

export { FORMAT, SCHEMA_VERSION, MAX_BYTES, LIMITS, ENUMS, validateProfile, emptyProfile, isEmptyProfile, mergeProfiles, byteLength }
