'use strict'

// Shadow AI self-check engine. Pure functions, no DOM and no network, so the same file runs in the
// page and in the Node tests (tests/rules.test.mjs). Questions and rules are data
// (data/questions.json, data/rules.json). Answers are option values only, never free text.
;(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else root.ShadowAIEngine = api
})(typeof self !== 'undefined' ? self : this, function () {
  // Keep only known questions and known option values. A multi answer with an exclusive option
  // (None, Not sure) keeps just that option. Anything else is dropped, so a stale or hand-edited
  // profile cannot inject text.
  function cleanAnswers(questions, raw) {
    const out = {}
    if (!raw || typeof raw !== 'object') return out
    for (const q of questions.questions) {
      const v = raw[q.id]
      const values = new Set(q.options.map(o => o.value))
      if (q.type === 'single') {
        if (typeof v === 'string' && values.has(v)) out[q.id] = v
      } else if (Array.isArray(v)) {
        let picked = Array.from(new Set(v.filter(x => typeof x === 'string' && values.has(x))))
        const exclusive = q.options.filter(o => o.exclusive).map(o => o.value)
        const ex = picked.find(x => exclusive.includes(x))
        if (ex) picked = [ex]
        if (picked.length) out[q.id] = picked
      }
    }
    return out
  }

  function matches(cond, answers) {
    if (!cond) return false
    if (cond.all) return cond.all.every(c => matches(c, answers))
    if (cond.any_of) return cond.any_of.some(c => matches(c, answers))
    const v = answers[cond.q]
    if (v === undefined) return false
    if (cond.in) return typeof v === 'string' && cond.in.includes(v)
    if (cond.any) return Array.isArray(v) && v.some(x => cond.any.includes(x))
    return false
  }

  // Every question id and option value a condition names, for the tests.
  function conditionRefs(cond, out) {
    out = out || []
    if (!cond) return out
    if (cond.all) cond.all.forEach(c => conditionRefs(c, out))
    else if (cond.any_of) cond.any_of.forEach(c => conditionRefs(c, out))
    else out.push({ q: cond.q, values: cond.in || cond.any || [], form: cond.in ? 'in' : (cond.any ? 'any' : '?') })
    return out
  }

  function privacyStatus(rules, answers) {
    const v = answers.privacy
    if (!v || v === 'unsure') return 'unsure'
    return rules.privacy_covered.includes(v) ? 'covered' : 'not_covered'
  }

  const SEVERITY_RANK = { high: 0, medium: 1, low: 2 }

  function evaluate(questions, rules, rawAnswers) {
    const answers = cleanAnswers(questions, rawAnswers)
    const status = privacyStatus(rules, answers)
    const fired = rules.rules.filter(r => matches(r.when, answers))
    const risks = fired.filter(r => r.kind === 'risk')
      .map(r => ({
        id: r.id,
        severity: r.severity,
        points: r.points,
        title: r.title,
        risk: r.risk,
        privacy: r.privacy ? (r.privacy[status] || '') : '',
        actions: r.actions || [],
        basis: r.basis || []
      }))
      .sort((a, b) => (SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]) || (b.points - a.points))
    const strengths = fired.filter(r => r.kind === 'strength').map(r => ({ id: r.id, title: r.title, basis: r.basis || [] }))
    const points = risks.reduce((n, r) => n + r.points, 0)

    const order = rules.level_order
    let level = rules.levels.filter(l => points >= l.min).sort((a, b) => b.min - a.min)[0]
    let floorBy = null
    for (const r of fired) {
      if (r.floor && order.indexOf(r.floor) > order.indexOf(level.id)) {
        level = rules.levels.find(l => l.id === r.floor)
        floorBy = r.id
      }
    }

    // Actions in the order the risks rank them, de-duplicated, split by horizon.
    const byId = Object.fromEntries(rules.actions.map(a => [a.id, a]))
    const seen = new Set()
    const actions = { 30: [], 90: [] }
    for (const r of risks) {
      for (const id of r.actions) {
        if (seen.has(id) || !byId[id]) continue
        seen.add(id)
        actions[byId[id].horizon].push(Object.assign({ because: r.id }, byId[id]))
      }
    }

    const answered = Object.keys(answers).length
    return {
      bank: questions.version,
      rules: rules.version,
      answered,
      total: questions.questions.length,
      points,
      level: { id: level.id, label: level.label, summary: level.summary, floor_by: floorBy },
      reasons: risks.slice(0, 3).map(r => r.title),
      privacy: status,
      risks,
      strengths,
      actions
    }
  }

  // Platforms to show with knowledge base facts: the ones in the saved stack, and the ones staff use
  // according to the tools answer. index is /free/stack-check/data/index.json (may be null).
  function kbPlatforms(questions, index, answers, stack) {
    if (!index || !Array.isArray(index.platforms)) return []
    const types = Object.fromEntries((index.procurement_account_types || []).map(t => [t.id, t]))
    const byId = Object.fromEntries(index.platforms.map(p => [p.id, p]))
    const rows = new Map()
    const stackList = (stack && Array.isArray(stack.platforms)) ? stack.platforms : []
    for (const s of stackList) {
      if (!s || !byId[s.id]) continue
      rows.set(s.id, { id: s.id, inStack: true, account: typeof s.account === 'string' ? s.account : null, usedBy: [] })
    }
    const toolsQ = questions.questions.find(q => q.id === 'tools')
    const picked = Array.isArray(answers.tools) ? answers.tools : []
    for (const opt of toolsQ.options) {
      if (!picked.includes(opt.value) || !opt.kb) continue
      for (const id of opt.kb) {
        if (!byId[id]) continue
        // A coding option maps to several platforms. Show only the ones in the stack, unless none are.
        if (opt.kb.length > 1 && !rows.has(id)) continue
        const row = rows.get(id) || { id, inStack: false, account: null, usedBy: [] }
        row.usedBy.push(opt.label)
        rows.set(id, row)
      }
      if (opt.kb.length > 1 && !opt.kb.some(id => rows.has(id)) && byId[opt.kb[0]]) {
        rows.set(opt.kb[0], { id: opt.kb[0], inStack: false, account: null, usedBy: [opt.label] })
      }
    }
    return Array.from(rows.values()).map(r => {
      const p = byId[r.id]
      const proc = p.procurement || {}
      const accountTypes = Array.isArray(proc.account_types) ? proc.account_types : []
      const shownType = r.account && types[r.account] ? r.account : (!r.inStack && proc.shadow_ai ? 'personal' : null)
      return {
        id: r.id,
        name: p.name,
        inStack: r.inStack,
        account: r.account,
        accountTypes: accountTypes.map(t => (types[t] && types[t].name) || t),
        shadow: proc.shadow_ai === true,
        shownType,
        shownTypeName: shownType && types[shownType] ? types[shownType].name : null,
        controls: shownType && types[shownType] ? types[shownType].controls : null
      }
    })
  }


  // Shared profile fields this check can fill in and read back (site-tools CONTRACT.md, profile v1.0
  // enums). Only used when the visitor has not answered the question here yet.
  const ACCOUNTS_FROM_CONTEXT = { none: 'business', some: 'mixed', most: 'personal', unsure: 'unsure' }
  const ACCOUNTS_TO_CONTEXT = { business: 'none', mixed: 'some', personal: 'most', unsure: 'unsure' }
  const HEADCOUNT = ['1-19', '20-199', '200-plus']

  function prefillFromProfile(questions, profile, answers) {
    const out = Object.assign({}, answers)
    const filled = []
    if (!profile || typeof profile !== 'object') return { answers: out, filled }
    const ctx = profile.context || {}
    const biz = profile.business || {}
    if (!out.accounts && ACCOUNTS_FROM_CONTEXT[ctx.personal_accounts]) { out.accounts = ACCOUNTS_FROM_CONTEXT[ctx.personal_accounts]; filled.push('accounts') }
    if (!out.headcount && HEADCOUNT.includes(biz.headcount)) { out.headcount = biz.headcount; filled.push('headcount') }
    if (!out.privacy) {
      if (biz.sector === 'health') { out.privacy = 'any-size'; filled.push('privacy') }
      else if (typeof biz.turnover === 'string' && biz.turnover.startsWith('over-')) { out.privacy = 'over-3m'; filled.push('privacy') }
    }
    return { answers: cleanAnswers(questions, out), filled }
  }

  // The shared fields our answers set, for MWProfile.update.
  // enums is MWProfile.ENUMS when the library is loaded: a value it does not list is never written.
  function sharedFields(answers, enums) {
    const ok = (k, v) => !enums || !Array.isArray(enums[k]) || enums[k].includes(v)
    const out = { context: {}, business: {} }
    const pa = ACCOUNTS_TO_CONTEXT[answers.accounts]
    if (pa && ok('personal_accounts', pa)) out.context.personal_accounts = pa
    if (HEADCOUNT.includes(answers.headcount) && ok('headcount', answers.headcount)) out.business.headcount = answers.headcount
    return out
  }

  return { cleanAnswers, matches, conditionRefs, evaluate, kbPlatforms, privacyStatus, prefillFromProfile, sharedFields }
})
