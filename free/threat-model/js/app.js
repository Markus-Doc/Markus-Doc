'use strict'

// Threat model starter page. Reads the saved stack (MWProfile.get().stack) and the AI register's rows
// (answers['ai-register']), adds tool types and agents picked on this page, and renders the starter
// threat list from TMModel. This page stores only its own picklist answers, with
// MWProfile.setAnswers('threat-model', { types, agents }, '1.0'). The KB index is read from
// /free/stack-check/data/ for platform names and groups, and the page works without it.
;(function () {
  const M = window.TMModel
  const ENQUIRY = 'https://checkableai.com/stack-check/#ck-enquiry'
  const $ = id => document.getElementById(id)
  let KB = M.buildKb(null)
  let indexLoaded = null   // null until the fetch has been tried
  let answers = { types: [], agents: [] }
  let result = null

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

  function P() { return window.MWProfile }
  function profile() { try { return P().get() } catch (e) { return null } }
  function register() { try { return P().getAnswers('ai-register') } catch (e) { return null } }
  function restore() {
    let a = null
    try { a = P().getAnswers(M.TOOL_ID) } catch (e) { a = null }
    answers = M.cleanAnswers(a)
  }
  function save() {
    try { P().setAnswers(M.TOOL_ID, M.cleanAnswers(answers), M.ANSWERS_VERSION) } catch (e) { /* stays in this page */ }
  }

  async function getJSON(url) {
    const r = await fetch(url, { credentials: 'same-origin' })
    if (!r.ok) throw new Error(url + ' returned ' + r.status)
    return r.json()
  }

  // ---- Inputs ----
  function options(select, list, blank) {
    select.replaceChildren(...(blank ? [h('option', { value: '', text: blank })] : []), ...list.map(o => h('option', { value: o.id, text: o.label })))
  }
  function checkbox(name, o, checked, onchange) {
    const input = h('input', { type: 'checkbox', name, value: o.id, checked: checked ? true : null })
    if (onchange) input.addEventListener('change', () => onchange(input))
    return h('label', { class: 'rc-choice' }, input, h('span', { text: o.label }))
  }

  function renderInputs() {
    $('tm-types').replaceChildren(...M.TYPES.map(o => checkbox('tm-type', o, answers.types.includes(o.id), input => {
      answers.types = input.checked ? answers.types.concat(o.id) : answers.types.filter(x => x !== o.id)
      save(); render()
    })))
    const list = $('tm-agents')
    list.replaceChildren(...answers.agents.map((a, i) => h('li', {},
      h('span', {}, (a.role ? M.AGENT_ROLE.find(x => x.id === a.role).label : 'Agent') + ' agent',
        h('span', { class: 'rc-note', text: (a.tools.length ? a.tools.map(t => M.AGENT_TOOLS.find(x => x.id === t).label).join(', ') : 'No tools picked') + '. ' + (a.oversight ? M.OVERSIGHT.find(x => x.id === a.oversight).label : 'Oversight not picked') + '.' })),
      h('button', { type: 'button', class: 'rc-link', onclick: () => { answers.agents.splice(i, 1); save(); render() } }, 'Remove'))))
  }

  function fromLine() {
    const p = profile()
    const stackN = p && p.stack && Array.isArray(p.stack.platforms) ? p.stack.platforms.length : 0
    const reg = register()
    const rows = reg && Array.isArray(reg.rows) ? reg.rows : []
    const agentsN = rows.filter(r => r && r.kind === 'agent').length
    const toolsN = rows.length - agentsN
    const el = $('tm-from')
    if (!stackN && !rows.length) {
      el.replaceChildren('Nothing is saved yet. Pick a few tool types or add an agent below, or save your tools in the ', h('a', { href: 'https://checkableai.com/stack-check/' }, 'AI Stack Check'), ' and your agents in the ', h('a', { href: '/free/ai-register/' }, 'AI register'), '.')
      return
    }
    const parts = []
    if (stackN) parts.push(stackN + ' tool' + (stackN === 1 ? '' : 's') + ' from your saved stack')
    if (toolsN) parts.push(toolsN + ' tool row' + (toolsN === 1 ? '' : 's') + ' from your AI register')
    if (agentsN) parts.push(agentsN + ' agent' + (agentsN === 1 ? '' : 's') + ' from your AI register')
    el.replaceChildren('We are using ' + parts.join(', ') + '. Add more below. To change them, edit the ', h('a', { href: '/free/ai-register/' }, 'AI register'), '.')
  }

  // ---- Result ----
  function finding(r) {
    return h('details', { class: 'rc-finding' + (r.priority === 'higher' ? ' is-high' : '') },
      h('summary', {},
        r.priority === 'higher' ? h('span', { class: 'tm-sev', text: 'Higher' }) : null,
        h('span', { class: 'tm-ref', text: r.ref }),
        h('span', { class: 'rc-finding-title', text: r.name })),
      h('div', { class: 'rc-finding-body tm-finding-body' },
        h('p', { text: r.what }),
        h('h4', { text: 'Why it applies' }),
        h('p', { text: r.why.join(' ') }),
        h('h4', { text: 'What to do first' }),
        h('ul', {}, r.mitigations.map(m => h('li', { text: m }))),
        h('p', { class: 'tm-meta', text: r.source + (r.was ? '. 2025 id: ' + r.was : '') + (r.related.length ? '. Related: ' + r.related.join(', ') : '') + '.' })))
  }

  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }))
    const a = h('a', { href: url, download: name })
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function render() {
    renderInputs()
    fromLine()
    result = M.build({ kb: KB, profile: profile(), register: register(), answers })
    const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    const iso = new Date().toISOString().slice(0, 10)
    const c = result.counts
    const box = $('tm-result')
    const S = M.SOURCES
    const enquiry = document.createDocumentFragment()

    const sources = h('p', { class: 'tm-sources' }, 'Risk lists: ',
      h('a', { href: S.llm.url, rel: 'noopener' }, S.llm.name + ' ' + S.llm.edition), ' and ',
      h('a', { href: S.asi.url, rel: 'noopener' }, S.asi.name + ' ' + S.asi.edition),
      ', from the OWASP GenAI Security Project. Descriptions and mitigations are our short summaries.')

    if (!result.rows.length) {
      box.replaceChildren(
        h('h2', { id: 'tm-result-title', text: 'Your starter threat list' }),
        h('p', { text: result.controls.length ? 'Your saved stack holds security and governance tools only (' + result.controls.join(', ') + '). Pick a tool type or add an agent above to see risks.' : 'Pick a tool type or add an agent above, and the risks appear here.' }),
        sources, enquiry)
      return
    }

    box.replaceChildren(
      h('div', { class: 'tm-print-meta' }, h('p', { class: 'rc-note', text: 'Threat model starter, ' + today + '.' })),
      h('h2', { id: 'tm-result-title', text: 'Your starter threat list' }),
      h('p', { class: 'tm-counts', text: c.rows + ' risk' + (c.rows === 1 ? '' : 's') + ' across ' + result.subjects.length + ' group' + (result.subjects.length === 1 ? '' : 's') + (c.higher ? ', ' + c.higher + ' marked higher priority' : '') + '.' }),
      h('div', { class: 'rc-actions tm-no-print' },
        h('button', { type: 'button', class: 'rc-button', onclick: () => download('threat-model-' + iso + '.csv', M.toCsv(result), 'text/csv;charset=utf-8') }, 'Download CSV'),
        h('button', { type: 'button', class: 'rc-secondary', onclick: () => download('threat-model-' + iso + '.md', M.toMarkdown(result, today), 'text/markdown;charset=utf-8') }, 'Download Markdown'),
        h('button', { type: 'button', class: 'rc-secondary', onclick: () => window.print() }, 'Print')),
      ...result.subjects.map(s => h('div', { class: 'tm-subject' },
        h('h3', { text: s.title }),
        h('p', { class: 'tm-covers', text: s.covers.join(', ') }),
        s.rows.map(finding))),
      result.controls.length ? h('p', { class: 'rc-note', text: 'Security and governance tools in your stack, not modelled here: ' + result.controls.join(', ') + '.' }) : null,
      indexLoaded === false ? h('p', { class: 'rc-note', text: 'Our knowledge base did not load, so saved platforms are shown by id and treated as chat assistants.' }) : null,
      sources,
      enquiry)
  }

  // Closed findings do not print, so open them for printing and put them back after.
  let reopened = []
  window.addEventListener('beforeprint', () => {
    reopened = Array.from(document.querySelectorAll('#tm-result details:not([open])'))
    reopened.forEach(d => { d.open = true })
  })
  window.addEventListener('afterprint', () => { reopened.forEach(d => { d.open = false }); reopened = [] })

  function profileBarFallback() {
    const bar = $('mw-profile-bar')
    if (!bar || bar.childElementCount) return
    if (P() && P().fallback) bar.append(h('p', { class: 'tm-bar-fallback', text: 'Saving is not available on this page right now. Your answers stay in this page until you leave it.' }))
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!M) { $('tm-status').textContent = 'The tool did not load. Reload the page to try again.'; return }
    options($('tm-role'), M.AGENT_ROLE)
    options($('tm-oversight'), M.OVERSIGHT, 'Not sure')
    options($('tm-identity'), M.IDENTITY)
    $('tm-identity').value = 'unknown'
    $('tm-tools').replaceChildren(...M.AGENT_TOOLS.map(o => checkbox('tm-tool', o, false)))
    $('tm-agent-form').addEventListener('submit', ev => {
      ev.preventDefault()
      if (answers.agents.length >= M.MAX_AGENTS) { $('tm-status').textContent = 'This page holds up to ' + M.MAX_AGENTS + ' agents. Use the AI register for more.'; return }
      const tools = Array.from(document.querySelectorAll('input[name="tm-tool"]:checked')).map(i => i.value)
      answers.agents.push(M.cleanAgent({ role: $('tm-role').value, tools, oversight: $('tm-oversight').value, identity: $('tm-identity').value }))
      for (const i of document.querySelectorAll('input[name="tm-tool"]')) i.checked = false
      save(); render()
    })
    try { if (P().ready) await P().ready } catch (e) { /* carry on with what is loaded */ }
    try { if (window.MWProfileBar && $('mw-profile-bar')) window.MWProfileBar.mount($('mw-profile-bar'), { tool: M.TOOL_ID }) } catch (e) { /* the bar is optional */ }
    restore()
    render()
    try { KB = M.buildKb(await getJSON('/free/stack-check/data/index.json')); indexLoaded = true } catch (e) { indexLoaded = false }
    render()
    try { P().onChange(() => { restore(); render() }) } catch (e) { /* no live updates without the library */ }
    setTimeout(profileBarFallback, 300)
  })
})()
