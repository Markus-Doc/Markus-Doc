'use strict'

// AI SDLC check page. One list of questions, then the result from AISDLCEngine. Answers are option values
// only and go to the shared stack profile (MWProfile.setAnswers('ai-sdlc', ...)), which keeps them in memory
// unless the visitor picks a save option in the stack bar.
;(function () {
  const TOOL = 'ai-sdlc'
  const VERSION = '1.0'
  const ENQUIRY = '/stack-check/?from=ai-sdlc#ck-enquiry'
  const E = window.AISDLCEngine
  const $ = id => document.getElementById(id)
  let Q = null
  let answers = {}

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag)
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue
      if (k === 'class') el.className = v
      else if (k === 'text') el.textContent = v
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v)
      else el.setAttribute(k, v === true ? '' : v)
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid.nodeType ? kid : String(kid))
    return el
  }

  function profile() { return window.MWProfile }
  function save() {
    try { profile().setAnswers(TOOL, { answers: Object.assign({}, answers) }, VERSION) } catch (e) { /* the check carries on in memory */ }
  }
  function restore() {
    try {
      const s = profile().getAnswers(TOOL)
      answers = s && s.answers ? E.cleanAnswers(Q, s.answers) : {}
    } catch (e) { answers = {} }
  }
  function builds() {
    try { const c = profile().get().context || {}; return c.builds === true || c.uses_ai === 'builds' } catch (e) { return false }
  }

  async function getJSON(url) {
    const r = await fetch(url, { credentials: 'same-origin' })
    if (!r.ok) throw new Error(url + ' returned ' + r.status)
    return r.json()
  }

  // ---- The check ----
  function placeBar(where) {
    const bar = $('mw-profile-bar')
    if (!bar) return
    if (where === 'result') { const enq = document.querySelector('#sd-result .sd-enquiry'); if (enq) enq.before(bar) }
    else $('sd-form').before(bar)
  }

  function renderForm() {
    const body = Q.sections.map(sec => h('section', { class: 'sd-group', 'aria-labelledby': 'sd-sec-' + sec.id },
      h('h2', { id: 'sd-sec-' + sec.id, text: sec.title }),
      Q.questions.filter(q => q.section === sec.id).map(renderQuestion)))
    $('sd-questions').replaceChildren(...body)
    progress()
  }

  function renderQuestion(q) {
    const name = 'sd-' + q.id
    const helpId = q.help ? name + '-help' : null
    const opts = Q.options.filter(o => o.value !== 'na' || q.na).map(o => {
      const input = h('input', { type: 'radio', name, value: o.value, checked: answers[q.id] === o.value ? true : null })
      input.addEventListener('change', () => { answers[q.id] = o.value; save(); progress() })
      return h('label', { class: 'rc-choice' }, input, h('span', { text: o.label }))
    })
    return h('fieldset', { class: 'sd-q', 'aria-describedby': helpId },
      h('legend', { text: q.text }),
      q.help ? h('p', { class: 'sd-help', id: helpId, text: q.help }) : null,
      h('div', { class: 'sd-options' }, opts))
  }

  function progress() {
    $('sd-progress').textContent = Object.keys(answers).length + ' of ' + Q.questions.length + ' answered'
  }

  function showForm(focus) {
    placeBar('check')
    $('sd-result').hidden = true
    $('sd-check').hidden = false
    if (focus) { $('sd-title').focus(); window.scrollTo(0, 0) }
  }

  // ---- Result ----
  function refList(r) {
    const nist = h('li', {}, h('a', { href: Q.sources.nist.url, rel: 'noopener' }, 'NIST SP 800-218A'), ' ',
      h('strong', { text: r.nist.join(', ') }), ' (' + r.nistPractices.map(p => p.id + ' ' + p.name).join('. ') + ')',
      r.nistNote ? '. ' + r.nistNote : '')
    const aima = h('li', {}, h('a', { href: Q.sources.aima.url, rel: 'noopener' }, 'OWASP AIMA'), ' ',
      h('strong', { text: r.aimaDomain }), ', ' + r.aimaPractice)
    return h('ul', { class: 'sd-refs', 'aria-label': 'Mapped references' }, nist, aima)
  }

  const STATE_TEXT = { partly: 'You answered partly.', no: 'You answered no.', unsure: 'You were not sure.', unanswered: 'Not answered, so we count it as a gap.' }

  function renderResult() {
    const res = E.evaluate(Q, answers)
    const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    const box = $('sd-result')

    const level = h('div', { class: 'sd-level is-' + res.band.id },
      h('div', {}, h('p', { class: 'rc-eyebrow', text: 'Level' }), h('p', { class: 'sd-level-name', text: res.band.label }), h('p', { class: 'rc-note', text: res.score + ' out of 100' })),
      h('div', {},
        h('p', { text: res.band.summary }),
        h('p', { class: 'rc-note', text: res.gaps.length + ' gaps: ' + res.counts.high + ' high, ' + res.counts.medium + ' medium, ' + res.counts.low + ' low.' }),
        res.band.capped ? h('p', { class: 'rc-note', text: 'A high gap keeps the level at Developing whatever the score.' }) : null))

    const gaps = res.gaps.length
      ? h('div', { class: 'sd-gaps' }, res.gaps.map(g => h('details', { class: 'rc-finding is-' + g.severity },
          h('summary', {}, h('span', { class: 'sd-sev is-' + g.severity, text: g.severity }), h('span', { class: 'rc-finding-title', text: g.title })),
          h('div', { class: 'rc-finding-body' },
            h('p', { class: 'rc-note', text: STATE_TEXT[g.state] }),
            h('p', { text: g.question }),
            refList(g.refs)))))
      : h('p', { text: 'We found no gaps from your answers. Re-run the check when you change models, providers or how you ship AI features.' })

    const strengths = res.strengths.length
      ? [h('h3', { text: 'In place' }), h('ul', { class: 'sd-strengths' }, res.strengths.map(s => h('li', { text: s.title })))]
      : []

    const planCol = (days, list) => h('div', {},
      h('h3', { text: days === 30 ? 'Next 30 days' : 'By 90 days' }),
      list.length ? h('ol', {}, list.map(a => h('li', {},
        h('strong', { text: a.title }),
        h('span', {}, a.detail, a.link ? [' ', h('a', { href: a.link }, linkText(a.link))] : '')))) : h('p', { class: 'rc-note', text: 'Nothing for this stage.' }))

    const copyNote = h('span', { class: 'rc-note', role: 'status', 'aria-live': 'polite' })
    box.replaceChildren(
      h('div', { class: 'sd-print-meta' }, h('p', { class: 'rc-note', text: 'AI SDLC Check result, ' + today + '. Question bank ' + res.bank + '.' })),
      h('p', { class: 'rc-eyebrow', text: 'Your result' }),
      h('h2', { id: 'sd-result-title', tabindex: '-1', text: 'How your team builds and changes AI features' }),
      level,
      h('div', { class: 'rc-actions sd-no-print' },
        h('button', { type: 'button', class: 'rc-button', onclick: () => copyResult(res, today, copyNote) }, 'Copy result'),
        h('button', { type: 'button', class: 'rc-secondary', onclick: () => window.print() }, 'Print or save as PDF'),
        h('button', { type: 'button', class: 'rc-link', onclick: () => showForm(true) }, 'Change answers'),
        copyNote),
      h('section', { class: 'sd-section', 'aria-labelledby': 'sd-gaps-title' },
        h('h2', { id: 'sd-gaps-title', text: 'Gaps found' }),
        gaps, strengths),
      h('section', { class: 'sd-section', 'aria-labelledby': 'sd-plan-title' },
        h('h2', { id: 'sd-plan-title', text: 'Your 30 and 90 day plan' }),
        h('div', { class: 'sd-plan' }, planCol(30, res.plan[30]), planCol(90, res.plan[90]))),
      h('p', { class: 'rc-disclaimer' }, h('strong', { text: 'A self-check, not an audit.' }), 'The result comes from your own answers. The mapping to NIST SP 800-218A and OWASP AIMA is ours.'),
      h('section', { class: 'sd-enquiry sd-no-print', 'aria-labelledby': 'sd-enq-title' },
        h('h2', { id: 'sd-enq-title', text: 'Want help closing these gaps?' }),
        h('p', { text: 'We can review your AI features with you and work through the plan. Tell us what you need and we will reply by email.' }),
        h('p', {}, h('a', { class: 'rc-button', href: ENQUIRY }, 'Send us an enquiry'))))

    placeBar('result')
    $('sd-check').hidden = true
    box.hidden = false
    $('sd-result-title').focus()
    window.scrollTo(0, 0)
  }

  async function copyResult(res, today, note) {
    const text = E.resultText(Q, res, today)
    let ok = false
    try { await navigator.clipboard.writeText(text); ok = true } catch (e) {
      const ta = h('textarea', { class: 'visually-hidden', 'aria-hidden': 'true' })
      ta.value = text
      document.body.append(ta)
      ta.select()
      try { ok = document.execCommand('copy') } catch (e2) { ok = false }
      ta.remove()
    }
    note.textContent = ok ? 'Copied as plain text.' : 'Copy did not work in this browser. Use print instead.'
  }

  function linkText(href) {
    if (href.startsWith('/ai-register')) return 'Open the AI register.'
    if (href.startsWith('/stack-pack')) return 'Open your stack pack.'
    return 'Open.'
  }

  function clearAll() {
    answers = {}
    save()
    renderForm()
  }

  // Closed gaps do not print, so open them for printing and put them back after.
  let reopened = []
  window.addEventListener('beforeprint', () => {
    reopened = Array.from(document.querySelectorAll('#sd-result details:not([open])'))
    reopened.forEach(d => { d.open = true })
  })
  window.addEventListener('afterprint', () => { reopened.forEach(d => { d.open = false }); reopened = [] })

  function profileBarFallback() {
    const bar = $('mw-profile-bar')
    if (!bar || bar.childElementCount) return
    if (profile() && profile().fallback) bar.append(h('p', { class: 'sd-bar-fallback', text: 'Saving is not available on this page right now. Your answers stay in this page until you leave it.' }))
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try { Q = await getJSON('data/questions.json') } catch (e) {
      $('sd-status').textContent = 'The questions did not load. Reload the page to try again.'
      return
    }
    try { if (profile().ready) await profile().ready } catch (e) { /* carry on with what is loaded */ }
    try { if (window.MWProfileBar && $('mw-profile-bar')) window.MWProfileBar.mount($('mw-profile-bar'), { tool: TOOL }) } catch (e) { /* the bar is optional */ }
    restore()
    $('sd-builds').hidden = builds()
    renderForm()
    $('sd-form').addEventListener('submit', ev => { ev.preventDefault(); renderResult() })
    $('sd-clear').addEventListener('click', clearAll)
    try {
      profile().onChange(() => {
        $('sd-builds').hidden = builds()
        const before = JSON.stringify(answers)
        restore()
        if (JSON.stringify(answers) !== before && !$('sd-check').hidden) renderForm()
      })
    } catch (e) { /* no live updates without the library */ }
    setTimeout(profileBarFallback, 300)
  })
})()
