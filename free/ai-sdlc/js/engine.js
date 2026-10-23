'use strict'

// AI SDLC check engine. Pure functions, no DOM and no network, so the same file runs in the page and in
// the Node tests (tests/rules.test.mjs). The questions, references and plan steps are data
// (data/questions.json). Answers are option values only, never free text.
;(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else root.AISDLCEngine = api
})(typeof self !== 'undefined' ? self : this, function () {
  const SEVERITY_RANK = { high: 0, medium: 1, low: 2 }

  // Keep only known questions and known option values. "Not relevant" is kept only where a question offers it.
  function cleanAnswers(Q, raw) {
    const out = {}
    if (!raw || typeof raw !== 'object') return out
    const values = new Set(Q.options.map(o => o.value))
    for (const q of Q.questions) {
      const v = raw[q.id]
      if (typeof v !== 'string' || !values.has(v)) continue
      if (v === 'na' && !q.na) continue
      out[q.id] = v
    }
    return out
  }

  // A missing answer counts as a gap, the same as "Not sure", so an empty check never reads as all good.
  function severity(priority, state) {
    if (state === 'partly') return priority === 'high' ? 'medium' : 'low'
    return priority === 'high' ? 'high' : 'medium'
  }

  // "PW.1.1" -> "PW.1"
  function practiceOf(task) { return task.split('.').slice(0, 2).join('.') }

  function refs(Q, q) {
    const groups = Array.from(new Set(q.nist.map(practiceOf)))
    return {
      nist: q.nist.slice(),
      nistPractices: groups.map(id => ({ id, name: Q.nist_practices[id] || '' })),
      nistNote: q.nist_note || '',
      aimaDomain: q.aima[0],
      aimaPractice: q.aima[1]
    }
  }

  function evaluate(Q, rawAnswers) {
    const answers = cleanAnswers(Q, rawAnswers)
    const pts = Object.fromEntries(Q.options.map(o => [o.value, o.points]))
    const gaps = []
    const strengths = []
    let points = 0, max = 0, applicable = 0
    Q.questions.forEach((q, order) => {
      const state = answers[q.id] || 'unanswered'
      if (state === 'na') return
      applicable++
      max += 2
      points += pts[state] || 0
      if (state === 'yes') { strengths.push({ id: q.id, title: q.ok }); return }
      gaps.push({
        id: q.id, order, state, priority: q.priority,
        severity: severity(q.priority, state),
        title: q.gap, question: q.text,
        refs: refs(Q, q), now: q.now, next: q.next
      })
    })
    gaps.sort((a, b) => (SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]) || (a.order - b.order))

    const score = max ? Math.round(points / max * 100) : 0
    const bands = Q.bands.slice().sort((a, b) => b.min - a.min)
    let band = bands.find(b => score >= b.min) || bands[bands.length - 1]
    // A high gap keeps the band below Established whatever the score.
    let capped = false
    if (band.id === bands[0].id && gaps.some(g => g.severity === 'high')) { band = bands[1]; capped = true }

    return {
      bank: Q.version,
      answered: Object.keys(answers).length,
      total: Q.questions.length,
      applicable, points, max, score,
      band: { id: band.id, label: band.label, summary: band.summary, capped },
      counts: { high: gaps.filter(g => g.severity === 'high').length, medium: gaps.filter(g => g.severity === 'medium').length, low: gaps.filter(g => g.severity === 'low').length },
      gaps, strengths,
      plan: plan(Q, gaps)
    }
  }

  // The 30 day list takes the first step for the top gaps, up to plan_now_max. By 90 days: the first
  // step for the remaining gaps, then the follow-on step for every gap, in the same order.
  function plan(Q, gaps) {
    const cap = Q.plan_now_max || 5
    const step = (g, s, kind) => ({ id: g.id + ':' + kind, gap: g.id, severity: g.severity, title: s.title, detail: s.detail, link: s.link || null })
    const d30 = gaps.slice(0, cap).map(g => step(g, g.now, 'now'))
    const d90 = gaps.slice(cap).map(g => step(g, g.now, 'now')).concat(gaps.map(g => step(g, g.next, 'next')))
    return { 30: d30, 90: d90 }
  }

  function refLine(r) {
    const groups = r.nistPractices.map(p => p.id + ' ' + p.name).join('. ')
    return 'NIST SP 800-218A ' + r.nist.join(', ') + ' (' + groups + '). OWASP AIMA ' + r.aimaDomain + ', ' + r.aimaPractice + '.'
  }

  // Plain text for the copy button.
  function resultText(Q, res, date) {
    const lines = []
    lines.push('AI SDLC Check result' + (date ? ', ' + date : ''))
    lines.push('Level: ' + res.band.label + ', ' + res.score + ' out of 100. ' + res.band.summary)
    lines.push('')
    if (res.gaps.length) {
      lines.push('Gaps found (' + res.gaps.length + ')')
      for (const g of res.gaps) {
        lines.push('- [' + g.severity + '] ' + g.title + (g.state === 'unanswered' ? ' (not answered)' : ''))
        lines.push('  ' + refLine(g.refs))
      }
    } else lines.push('No gaps found.')
    lines.push('')
    for (const days of [30, 90]) {
      lines.push(days === 30 ? 'Next 30 days' : 'By 90 days')
      const list = res.plan[days]
      if (!list.length) lines.push('- Nothing for this stage.')
      list.forEach((a, i) => lines.push((i + 1) + '. ' + a.title + '. ' + a.detail))
      lines.push('')
    }
    lines.push('Sources: ' + Q.sources.nist.url + ' and ' + Q.sources.aima.url)
    return lines.join('\n')
  }

  return { cleanAnswers, evaluate, severity, practiceOf, refLine, resultText }
})
