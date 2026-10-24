'use strict'

// Shadow AI self-check page. Loads the question bank and rules, walks the five steps, then renders the
// result from ShadowAIEngine. Answers are option values only and go to the shared stack profile
// (MWProfile.setAnswers('shadow-ai', ...)), which keeps them in memory unless the visitor picks a save
// option. The KB index is read from /stack-check/data/ when present, and the page works without it.
;(function () {
  const TOOL = 'shadow-ai'
  const ENQUIRY = 'https://checkableai.com/stack-check/?from=shadow-ai#ck-enquiry'
  const E = window.ShadowAIEngine
  const $ = id => document.getElementById(id)
  let Q = null, R = null, INDEX = null
  let answers = {}
  let step = 0

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
  let filled = []
  function save() {
    try {
      profile().setAnswers(TOOL, { answers: Object.assign({}, answers) }, Q.version)
      // Share the two answers other tools also use (profile context and business bands), only when they change.
      const shared = E.sharedFields(answers, profile().ENUMS)
      const p = profile().get()
      const changed = Object.keys(shared.context).some(k => (p.context || {})[k] !== shared.context[k]) ||
        Object.keys(shared.business).some(k => (p.business || {})[k] !== shared.business[k])
      if (changed) profile().update(d => { Object.assign(d.context, shared.context); Object.assign(d.business, shared.business) })
    } catch (e) { /* the check carries on in memory */ }
  }
  function restore() {
    let saved = {}
    try {
      const s = profile().getAnswers(TOOL)
      if (s && s.answers) saved = E.cleanAnswers(Q, s.answers)
    } catch (e) { saved = {} }
    let p = null
    try { p = profile().get() } catch (e) { p = null }
    const pre = E.prefillFromProfile(Q, p, saved)
    answers = pre.answers
    filled = pre.filled
  }

  async function getJSON(url) {
    const r = await fetch(url, { credentials: 'same-origin' })
    if (!r.ok) throw new Error(url + ' returned ' + r.status)
    return r.json()
  }

  // ---- Landing ----
  // One stack bar: under the landing intro, and above the enquiry on the result.
  function placeBar(where) {
    const bar = $('mw-profile-bar')
    if (!bar) return
    if (where === 'result') { const enq = document.querySelector('#sa-result .sa-enquiry'); if (enq) enq.before(bar) }
    else $('sa-how').before(bar)
  }
  function showLanding() {
    placeBar('landing')
    $('sa-wizard').hidden = true
    $('sa-result').hidden = true
    $('sa-landing').hidden = false
  }

  // ---- Wizard ----
  function sectionQuestions(i) { return Q.questions.filter(q => q.section === Q.sections[i].id) }

  function renderStep(focus) {
    placeBar('landing')
    $('sa-landing').hidden = true
    $('sa-result').hidden = true
    $('sa-wizard').hidden = false
    const sec = Q.sections[step]
    const steps = $('sa-steps')
    steps.replaceChildren(...Q.sections.map((s, i) => h('li', { class: i === step ? 'is-current' : (i < step ? 'is-done' : ''), 'aria-current': i === step ? 'step' : null, text: s.title })))
    $('sa-step-count').textContent = 'Step ' + (step + 1) + ' of ' + Q.sections.length
    $('sa-step-title').textContent = sec.title
    $('sa-step-intro').textContent = sec.intro || ''
    $('sa-step-body').replaceChildren(...sectionQuestions(step).map(renderQuestion))
    $('sa-back').textContent = step === 0 ? 'Back to the start' : 'Back'
    $('sa-next').textContent = step === Q.sections.length - 1 ? 'See my result' : 'Continue'
    progress()
    if (focus) { $('sa-step-title').focus(); window.scrollTo(0, 0) }
  }

  function renderQuestion(q) {
    const multi = q.type === 'multi'
    const name = 'sa-' + q.id
    const current = answers[q.id]
    const helpId = q.help ? name + '-help' : null
    const opts = q.options.map(o => {
      const checked = multi ? Array.isArray(current) && current.includes(o.value) : current === o.value
      const input = h('input', { type: multi ? 'checkbox' : 'radio', name, value: o.value, checked: checked ? true : null })
      input.addEventListener('change', () => onChange(q, o, input))
      return h('label', { class: 'rc-choice' }, input, h('span', { text: o.label }))
    })
    return h('fieldset', { class: 'sa-q', 'aria-describedby': helpId },
      h('legend', { text: q.text }),
      q.help ? h('p', { class: 'sa-help', id: helpId, text: q.help }) : null,
      multi ? h('p', { class: 'sa-kind', text: 'Pick all that apply.' }) : null,
      h('div', { class: 'sa-options' }, opts))
  }

  function onChange(q, o, input) {
    if (q.type === 'single') {
      answers[q.id] = o.value
    } else {
      let list = Array.isArray(answers[q.id]) ? answers[q.id].slice() : []
      if (input.checked) {
        if (o.exclusive) list = [o.value]
        else list = list.filter(v => !q.options.find(x => x.value === v && x.exclusive)).concat(o.value)
      } else list = list.filter(v => v !== o.value)
      if (list.length) answers[q.id] = list
      else delete answers[q.id]
      // Keep the boxes in step with exclusive options (None, Not sure).
      for (const box of document.querySelectorAll('input[name="sa-' + q.id + '"]')) box.checked = list.includes(box.value)
    }
    save()
    progress()
  }

  function progress() {
    const n = Object.keys(answers).length
    $('sa-progress').textContent = n + ' of ' + Q.questions.length + ' answered'
  }

  // ---- Result ----
  function basisList(ids) {
    return h('ul', { class: 'sa-basis', 'aria-label': 'Basis' }, ids.map(id => {
      const s = R.sources[id]
      if (!s) return null
      if (s.kind === 'decision') return h('li', { title: s.note || '' }, s.title)
      if (s.kind === 'kb') return h('li', {}, h('a', { href: 'https://checkableai.com/stack-check/atlas/' }, s.title))
      return h('li', {}, h('a', { href: s.url, rel: 'noopener' }, s.title))
    }))
  }

  function renderResult() {
    const res = E.evaluate(Q, R, answers)
    const stack = (() => { try { return profile().get().stack } catch (e) { return null } })()
    const kb = E.kbPlatforms(Q, INDEX, E.cleanAnswers(Q, answers), stack)
    const box = $('sa-result')
    const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

    const level = h('div', { class: 'sa-level is-' + res.level.id },
      h('div', {}, h('p', { class: 'rc-eyebrow', text: 'Exposure level' }), h('p', { class: 'sa-level-name', text: res.level.label })),
      h('div', {},
        h('p', { text: res.level.summary }),
        res.reasons.length ? h('p', { class: 'rc-note', text: 'The main reasons:' }) : null,
        res.reasons.length ? h('ul', {}, res.reasons.map(t => h('li', { text: t }))) : null,
        res.level.floor_by ? h('p', { class: 'rc-note', text: 'Personal information in accounts the business does not control sets the level to high on its own.' }) : null))

    const partial = res.answered < res.total
      ? h('p', { class: 'rc-disclaimer' }, h('strong', { text: 'You answered ' + res.answered + ' of ' + res.total + ' questions.' }), 'Unanswered questions add no risk, so the level may be lower than it should be. ', h('button', { type: 'button', class: 'rc-link sa-no-print', onclick: () => { step = 0; renderStep(true) } }, 'Answer the rest'))
      : null

    const risks = res.risks.length
      ? h('div', { class: 'sa-risks' }, res.risks.map(r => h('details', { class: 'rc-finding is-' + r.severity },
          h('summary', {}, h('span', { class: 'sa-sev is-' + r.severity, text: r.severity }), h('span', { class: 'rc-finding-title', text: r.title })),
          h('div', { class: 'rc-finding-body' },
            h('p', { text: r.risk }),
            r.privacy ? h('p', { class: 'sa-app' }, h('strong', { text: 'Privacy Act: ' }), r.privacy) : null,
            basisList(r.basis)))))
      : h('p', { text: 'Your answers raised no risks. Keep the list, the settings and the training current, and re-run the check when you add a tool.' })

    const strengths = res.strengths.length
      ? [h('h3', { text: 'What is working' }), h('ul', { class: 'sa-strengths' }, res.strengths.map(s => h('li', { text: s.title })))]
      : []

    const planCol = (days, list) => h('div', {},
      h('h3', { text: 'Next ' + days + ' days' }),
      list.length ? h('ol', {}, list.map(a => h('li', {},
        h('strong', { text: a.title }),
        h('span', {}, a.detail, a.link ? [' ', h('a', { href: a.link }, linkText(a.link))] : '')))) : h('p', { class: 'rc-note', text: 'Nothing for this stage.' }))

    const kbBlock = kb.length
      ? h('table', { class: 'sa-kb' },
          h('thead', {}, h('tr', {}, h('th', { text: 'Platform' }), h('th', { text: 'Where it came from' }), h('th', { text: 'Account types sold' }), h('th', { text: 'What that account gives you' }))),
          h('tbody', {}, kb.map(p => h('tr', {},
            h('td', { text: p.name }),
            h('td', { 'data-label': 'Where it came from', text: p.inStack ? 'Your saved stack' + (p.account ? ', ' + p.account + ' account' : '') : 'Staff use, not on your saved list' }),
            h('td', { 'data-label': 'Account types sold' }, p.accountTypes.map(t => h('span', { class: 'sa-tag', text: t })), p.shadow ? h('span', { class: 'sa-tag is-shadow', text: 'Sells a personal plan' }) : null),
            h('td', { 'data-label': 'What that account gives you' }, p.controls ? [h('strong', { text: (p.inStack ? p.shownTypeName + '. ' : 'If staff use the ' + p.shownTypeName.toLowerCase() + ': ') }), p.controls] : 'Save which account type you use to see this.')))))
      : h('p', { class: 'rc-note' }, INDEX ? 'Save your AI tools in the ' : 'Our knowledge base did not load, so vendor facts are missing. Save your AI tools in the ', h('a', { href: 'https://checkableai.com/stack-check/' }, 'AI Stack Check'), ' and the platforms in it appear here with their account types and training defaults.')

    box.replaceChildren(...[
      h('div', { class: 'sa-print-meta' }, h('p', { class: 'rc-note', text: 'Shadow AI Check result, ' + today + '. Question bank ' + res.bank + ', rules ' + res.rules + '.' })),
      h('p', { class: 'rc-eyebrow', text: 'Your result' }),
      h('h2', { id: 'sa-result-title', tabindex: '-1', text: 'Your shadow AI exposure' }),
      level,
      partial,
      h('div', { class: 'rc-actions sa-no-print' },
        h('button', { type: 'button', class: 'rc-button', onclick: () => window.print() }, 'Print or save as PDF'),
        h('button', { type: 'button', class: 'rc-secondary', onclick: () => { step = 0; renderStep(true) } }, 'Change answers'),
        h('button', { type: 'button', class: 'rc-link', onclick: startAgain }, 'Clear answers and start again')),
      h('section', { class: 'sa-section', 'aria-labelledby': 'sa-risks-title' },
        h('h2', { id: 'sa-risks-title', text: 'The risks' }),
        res.privacy === 'unsure' ? h('p', { class: 'rc-note', text: 'You were not sure whether the Privacy Act covers you, so the privacy notes say what applies if it does.' }) : null,
        risks, strengths),
      h('section', { class: 'sa-section', 'aria-labelledby': 'sa-plan-title' },
        h('h2', { id: 'sa-plan-title', text: 'Your 30 and 90 day plan' }),
        h('p', { class: 'rc-note', text: 'In the order your risks rank them. None of it needs new software.' }),
        h('div', { class: 'sa-plan' }, planCol(30, res.actions[30]), planCol(90, res.actions[90]))),
      h('section', { class: 'sa-section', 'aria-labelledby': 'sa-kb-title' },
        h('h2', { id: 'sa-kb-title', text: 'Your AI tools in our knowledge base' }),
        h('p', { class: 'rc-note', text: 'The account type decides the controls more than the vendor does. These facts are vendors’ published terms, from the AI Stack Check knowledge base.' }),
        kbBlock,
        h('p', {}, 'Next: list these tools in the ', h('a', { href: '/ai-register/' }, 'AI register'), ', and get the questions to ask each vendor in your ', h('a', { href: '/stack-pack/' }, 'stack pack'), '.')),
      h('p', { class: 'rc-disclaimer' }, h('strong', { text: 'A self-check, not legal advice.' }), 'The result comes from your own answers and the rules shown with each risk. Privacy Act notes say where a principle is relevant, not whether you comply. For advice on your obligations, speak to a privacy lawyer.'),
      h('p', { class: 'sa-privacy sa-no-print' }, h('strong', { text: 'Your answers stay in your browser' }), '. Use the stack bar to keep them for next time.'),
      h('section', { class: 'sa-enquiry sa-no-print', 'aria-labelledby': 'sa-enq-title' },
        h('h2', { id: 'sa-enq-title', text: 'Want help closing these gaps?' }),
        h('p', { text: 'We can work through your result and set up the approved list, business accounts and policy. Tell us what you need and we reply by email.' }),
        h('p', {}, h('a', { class: 'rc-button', href: ENQUIRY }, 'Send us an enquiry')))].filter(Boolean))

    placeBar('result')
    $('sa-landing').hidden = true
    $('sa-wizard').hidden = true
    box.hidden = false
    $('sa-result-title').focus()
    window.scrollTo(0, 0)
  }

  function linkText(href) {
    if (href.startsWith('/ai-register')) return 'Open the AI register.'
    if (href.startsWith('/stack-pack')) return 'Open your stack pack.'
    if (href.startsWith('/readiness-check')) return 'Open the AU Frameworks Check.'
    return 'Open.'
  }

  function startAgain() {
    answers = {}
    save()
    step = 0
    renderStep(true)
  }

  // Closed findings do not print, so open them for printing and put them back after.
  let reopened = []
  window.addEventListener('beforeprint', () => {
    reopened = Array.from(document.querySelectorAll('#sa-result details:not([open])'))
    reopened.forEach(d => { d.open = true })
  })
  window.addEventListener('afterprint', () => { reopened.forEach(d => { d.open = false }); reopened = [] })

  function profileBarFallback() {
    const bar = $('mw-profile-bar')
    if (!bar || bar.childElementCount) return
    if (profile() && profile().fallback) bar.append(h('p', { class: 'sa-bar-fallback', text: 'Saving is not available on this page right now. Your answers stay in this page until you leave it.' }))
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      ;[Q, R] = await Promise.all([getJSON('data/questions.json'), getJSON('data/rules.json')])
    } catch (e) {
      $('sa-status').textContent = 'The questions did not load. Reload the page to try again.'
      return
    }
    try { INDEX = await getJSON('/stack-check/data/index.json') } catch (e) { INDEX = null }
    // In account mode the stack arrives after the page loads, so wait for the library first.
    try { if (profile().ready) await profile().ready } catch (e) { /* carry on with what is loaded */ }
    try { if (window.MWProfileBar && $('mw-profile-bar')) window.MWProfileBar.mount($('mw-profile-bar'), { tool: TOOL }) } catch (e) { /* the bar is optional */ }
    $('sa-qcount').textContent = String(Q.questions.length)
    restore()
    const n = Object.keys(answers).length
    const start = $('sa-start')
    start.disabled = false
    if (n) {
      start.textContent = n > filled.length ? 'Carry on with your saved answers' : 'Start the check'
      $('sa-start-note').textContent = n + ' of ' + Q.questions.length + ' already answered from your saved profile. You can change any of them.'
    }
    start.addEventListener('click', () => { step = 0; renderStep(true) })
    $('sa-back').addEventListener('click', () => {
      if (step === 0) { showLanding(); $('sa-title').focus(); return }
      step--; renderStep(true)
    })
    $('sa-next').addEventListener('click', () => {
      if (step < Q.sections.length - 1) { step++; renderStep(true) } else renderResult()
    })
    try {
      profile().onChange(() => {
        const before = JSON.stringify(answers)
        restore()
        if (JSON.stringify(answers) !== before && !$('sa-wizard').hidden) renderStep(false)
      })
    } catch (e) { /* no live updates without the library */ }
    setTimeout(profileBarFallback, 300)
  })
})()
