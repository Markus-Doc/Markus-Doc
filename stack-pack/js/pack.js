'use strict'

// The stack pack (decision 0029, tool 2). The user picks a stack, or brings one in the shared stack profile,
// and gets a one-page cheat sheet and a vendor questions pack, both built in the browser from the AI Stack
// Check's published data. It reads data/index.json once (names, controls and one verdict letter per control)
// and then only cells/<platform>.json for the platforms in the stack. The large shards are never loaded.
// Nothing is sent anywhere. Downloads are made with blob URLs.
;(function () {
  const TOOL = 'stack-pack'
  const ANSWERS_VERSION = '1'
  const main = document.getElementById('main')
  const KB = main.dataset.kb || '/stack-check/data/'
  const QUESTIONS = main.dataset.questions || 'data/questions.json'
  const MAX_STACK = 12
  const EXAMPLE = [{ id: 'openai', account: 'enterprise' }, { id: 'windows-m365', account: 'enterprise' }, { id: 'anthropic', account: 'enterprise' }]
  const STATUS = {
    N: { label: 'Not documented', cls: 'n' },
    P: { label: 'Partly documented', cls: 'p' },
    O: { label: 'Outside its category', cls: 'o' },
    S: { label: 'Documented', cls: 's' },
    R: { label: 'Not researched', cls: 'r' },
    U: { label: 'Unresolved', cls: 'r' },
  }
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const state = {
    index: null, questions: null, platforms: {}, capabilities: [], accountTypes: {},
    stack: [], other: [], unlisted: [], includeOut: false, cells: {}, renderToken: 0,
  }

  const $ = id => document.getElementById(id)
  function el(tag, attrs, ...kids) {
    const node = document.createElement(tag)
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue
      if (k === 'class') node.className = v
      else if (k === 'text') node.textContent = v
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v)
      else node.setAttribute(k, v === true ? '' : v)
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) node.append(kid.nodeType ? kid : String(kid))
    return node
  }
  function status(message) { $('sp-status').textContent = message || '' }
  function fmtDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '')
    return m ? Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1] : ''
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')) }
  function firstSentence(s) {
    const m = /^(.+?[.?!])(\s|$)/.exec(s || '')
    return m ? m[1] : (s || '')
  }
  // The KB's prose opens with the verdict ("Not covered.") and can carry research notes after a blank line.
  function lead(s) {
    return String(s || '').split(/\n\s*\n/)[0].replace(/^(Not covered|Covered|Partly covered|Out of scope)\.\s*/, '').trim()
  }
  function safeUrl(u) { return /^https:\/\//.test(u || '') ? u : null }

  async function getJSON(url) {
    const res = await fetch(url, { credentials: 'same-origin' })
    if (!res.ok) throw new Error(res.status + ' ' + url)
    return res.json()
  }

  // ---------- Profile ----------

  function profile() { try { return window.MWProfile ? window.MWProfile.get() : null } catch (e) { return null } }
  function stackKey(list) { return list.map(s => s.id + ':' + (s.account || '')).join(',') }

  function readProfile() {
    const p = profile()
    const rows = (p && p.stack && Array.isArray(p.stack.platforms)) ? p.stack.platforms : []
    state.stack = rows.filter(r => state.platforms[r.id]).slice(0, MAX_STACK)
      .map(r => ({ id: r.id, account: validAccount(r.id, r.account) }))
    state.other = rows.filter(r => !state.platforms[r.id]).map(r => r.id)
    state.unlisted = (p && p.stack && Array.isArray(p.stack.unlisted)) ? p.stack.unlisted.slice(0, 20) : []
    const answers = window.MWProfile && window.MWProfile.getAnswers ? window.MWProfile.getAnswers(TOOL) : null
    state.includeOut = !!(answers && answers.include_out_of_scope)
  }

  function writeProfile() {
    if (!window.MWProfile) return
    try {
      window.MWProfile.update(d => {
        d.stack = d.stack || { platforms: [], unlisted: [], preset: null }
        const old = {}
        for (const r of (d.stack.platforms || [])) old[r.id] = r
        const mine = state.stack.map(s => {
          const row = Object.assign({}, old[s.id] || {}, { id: s.id })
          if (s.account) row.account = s.account
          else delete row.account
          return row
        })
        // Keep ids this page does not know (another tool or a newer KB may), after ours.
        const kept = (d.stack.platforms || []).filter(r => !state.platforms[r.id])
        d.stack.platforms = mine.concat(kept)
        d.answers = d.answers || {}
        d.answers[TOOL] = { version: ANSWERS_VERSION, include_out_of_scope: state.includeOut }
      })
    } catch (e) { status('We could not save your platforms to the profile: ' + e.message) }
  }

  function validAccount(id, account) {
    const types = (state.platforms[id].procurement || {}).account_types || []
    if (account === 'unsure') return account
    return types.includes(account) ? account : (types.length === 1 ? types[0] : '')
  }

  // ---------- Picker ----------

  function renderPicker() {
    const idx = state.index
    $('sp-picker-intro').textContent = 'Choose from the ' + idx.platforms.length + ' platforms in our free data. Set the plan you are on where you know it, because a personal plan gives your business far fewer controls than an enterprise one.'
    const groups = $('sp-groups')
    groups.textContent = ''
    for (const g of idx.groups) {
      const ids = g.platform_ids.filter(id => state.platforms[id])
      if (!ids.length) continue
      const list = el('ul', { class: 'sp-options' })
      for (const id of ids) {
        const p = state.platforms[id]
        const box = el('input', { type: 'checkbox', id: 'sp-opt-' + id, value: id, onchange: e => toggle(id, e.target.checked) })
        list.append(el('li', { 'data-name': (p.name + ' ' + id).toLowerCase(), 'data-id': id }, el('label', { for: 'sp-opt-' + id }, box, el('span', { text: p.name }))))
      }
      groups.append(el('fieldset', { class: 'sp-group' }, el('legend', { text: g.name }), list))
    }
    $('sp-search').addEventListener('input', filter)
    $('sp-example').addEventListener('click', () => {
      state.stack = EXAMPLE.filter(s => state.platforms[s.id]).map(s => ({ id: s.id, account: validAccount(s.id, s.account) }))
      stackChanged()
    })
    syncPicker()
  }

  function filter() {
    const q = $('sp-search').value.trim().toLowerCase()
    // Product words (Claude, ChatGPT, Copilot) find their KB platform through the shared alias search.
    const search = window.MWProfile && typeof window.MWProfile.searchPlatforms === 'function' ? window.MWProfile.searchPlatforms : null
    const aliased = search && q.length > 1 ? new Set(search(q, state.index).map(p => p.id)) : null
    let shown = 0
    for (const li of document.querySelectorAll('#sp-groups li')) {
      const hit = !q || li.dataset.name.includes(q) || (aliased && aliased.has(li.dataset.id))
      li.hidden = !hit
      if (hit) shown++
    }
    for (const fs of document.querySelectorAll('#sp-groups fieldset')) fs.hidden = !fs.querySelector('li:not([hidden])')
    $('sp-search-count').textContent = q ? plural(shown, 'platform') + ' match.' : ''
    const more = q.length > 1 ? (state.index.more_platforms || []).filter(p => p.name.toLowerCase().includes(q) || (aliased && aliased.has(p.id))).slice(0, 5) : []
    const note = $('sp-more-note')
    note.hidden = !more.length
    if (more.length) {
      note.textContent = ''
      note.append(more.map(p => p.name).join(', ') + (more.length === 1 ? ' is' : ' are') + ' in our full knowledge base but not in the free data. ',
        el('a', { href: '/stack-check/?from=stack-pack#ck-enquiry', text: 'Ask us' }), ' and we can include ' + (more.length === 1 ? 'it' : 'them') + ' in a review.')
    }
  }

  function toggle(id, on) {
    if (on && !state.stack.some(s => s.id === id)) {
      if (state.stack.length >= MAX_STACK) { status('The pack takes up to ' + MAX_STACK + ' platforms at a time.'); syncPicker(); return }
      state.stack.push({ id, account: validAccount(id, '') })
    }
    if (!on) state.stack = state.stack.filter(s => s.id !== id)
    stackChanged()
  }

  function syncPicker() {
    for (const box of document.querySelectorAll('#sp-groups input[type=checkbox]')) box.checked = state.stack.some(s => s.id === box.value)
    const wrap = $('sp-chosen')
    wrap.textContent = ''
    $('sp-presets').hidden = state.stack.length > 0
    if (!state.stack.length) {
      wrap.append(el('p', { class: 'rc-note', text: 'No platforms chosen yet. Open "Add platforms" below, or load your stack profile.' }))
    } else {
      const list = el('ul', { class: 'sp-chips', 'aria-label': 'Your chosen platforms' })
      for (const s of state.stack) {
        const p = state.platforms[s.id]
        const types = (p.procurement || {}).account_types || []
        const selId = 'sp-acct-' + s.id
        const select = el('select', { id: selId, onchange: e => { s.account = e.target.value; stackChanged() } },
          el('option', { value: '', text: 'Plan not set' }),
          types.map(t => el('option', { value: t, text: (state.accountTypes[t] || {}).name || t, selected: s.account === t })),
          el('option', { value: 'unsure', text: 'Not sure', selected: s.account === 'unsure' }))
        list.append(el('li', { class: 'sp-chip' },
          el('strong', { text: p.name }),
          el('label', { class: 'visually-hidden', for: selId, text: 'Plan for ' + p.name }), select,
          el('button', { type: 'button', class: 'sp-remove', 'aria-label': 'Remove ' + p.name, onclick: () => toggle(s.id, false) }, 'Remove')))
      }
      wrap.append(list)
    }
    const extra = []
    if (state.other.length) extra.push(plural(state.other.length, 'platform') + ' in your saved profile ' + (state.other.length === 1 ? 'is' : 'are') + ' not in our free data, so ' + (state.other.length === 1 ? 'it is' : 'they are') + ' left out of the pack.')
    if (state.unlisted.length) extra.push('Not in our knowledge base: ' + state.unlisted.join(', ') + '.')
    if (extra.length) wrap.append(el('p', { class: 'rc-note', text: extra.join(' ') }))
  }

  function stackChanged() {
    status('')
    syncPicker()
    writeProfile()
    build()
  }

  // ---------- Data per platform ----------

  function codes(id) { return (state.index.verdict_codes || {})[id] || '' }
  function verdictOf(id, i) { return codes(id)[i] || 'R' }

  async function loadCells(id) {
    if (id in state.cells) return state.cells[id]
    try {
      const data = await getJSON(KB + 'cells/' + encodeURIComponent(id) + '.json')
      state.cells[id] = data && data.cells ? data.cells : null
    } catch (e) { state.cells[id] = null }
    return state.cells[id]
  }

  // One row per control for a platform, joining the verdict letter, the question and the KB detail.
  function rows(id) {
    const cells = state.cells[id] || {}
    return state.capabilities.map((cap, i) => {
      const q = state.questions[cap.id] || {}
      return { cap, i, code: verdictOf(id, i), q, priority: q.priority || 3, cell: cells[cap.id] || null }
    })
  }
  function byPriority(a, b) { return a.priority - b.priority || a.i - b.i }

  function counts(id) {
    const c = { S: 0, P: 0, N: 0, O: 0, R: 0 }
    for (const ch of codes(id)) c[ch in c ? ch : 'R']++
    return c
  }

  // What a vendor publishes and what is missing, for one control, from the cell detail.
  function evidence(row, name) {
    const cell = row.cell
    if (!cell) return { products: '', conditions: '', quote: null, sources: [], missing: '', checked: '', none: true }
    const conf = cell.confirmation || {}
    const products = cell.products && cell.products !== 'None' ? cell.products : ''
    const src = conf.source && conf.source.quote && safeUrl(conf.source.url)
      ? { text: conf.source.quote, url: conf.source.url, date: (conf.source.fetched_at || '').slice(0, 10) } : null
    const sources = []
    const seen = new Set()
    for (const c of cell.citations || []) {
      const url = safeUrl(c.url)
      if (!url || seen.has(url)) continue
      seen.add(url)
      sources.push({ url, title: c.title || '', locator: c.locator && c.locator !== 'Quoted by the confirm agents' ? c.locator : '' })
    }
    let missing = conf.missing || ''
    if (!missing && row.code !== 'S') missing = lead(cell.answer)
    if (row.code === 'O') missing = 'This control sits outside what ' + name + ' is built to do. ' + (missing && !/^Outside|^Not in scope|^Not part of/.test(missing) ? missing : 'Ask how they expect you to cover it, or which other product does.')
    return {
      products, conditions: conf.conditions || '', quote: src, sources, missing,
      checked: cell.checked_on || conf.confirmed_on || '', none: !products && !src && !sources.length,
    }
  }

  // ---------- Build ----------

  async function build() {
    const token = ++state.renderToken
    const sheet = $('sp-sheet')
    const pack = $('sp-questions')
    if (!state.stack.length) { sheet.hidden = true; pack.hidden = true; return }
    status('')
    sheet.hidden = false
    sheet.setAttribute('aria-busy', 'true')
    sheet.textContent = ''
    sheet.append(el('p', { class: 'rc-note', text: 'Building your pack from the knowledge base.' }))
    await Promise.all(state.stack.map(s => loadCells(s.id)))
    if (token !== state.renderToken) return
    renderSheet()
    renderQuestions()
    sheet.removeAttribute('aria-busy')
  }

  function gated(id) { return !!(state.index.free_check && state.index.free_check.gated && state.index.free_check.gated[id]) }

  function strip(id) {
    const s = el('span', { class: 'sp-strip', 'aria-hidden': 'true' })
    for (const ch of codes(id)) s.append(el('i', { class: 'v-' + (STATUS[ch] || STATUS.R).cls }))
    return s
  }

  function preparedLine() {
    const k = state.index.knowledge || {}
    return 'Prepared ' + fmtDate(new Date().toISOString()) + ' from our knowledge base as at ' + fmtDate(k.updated_on || state.index.generated_at) + '.'
  }

  function renderSheet() {
    const sheet = $('sp-sheet')
    sheet.textContent = ''
    const total = state.capabilities.length
    const p = profile()
    const label = p && p.label ? p.label : ''

    // Across the stack: a control counts as documented when any platform documents it, fully or in part.
    const covered = new Set()
    for (const s of state.stack) codes(s.id).split('').forEach((ch, i) => { if (ch === 'S' || ch === 'P') covered.add(i) })
    const openFirst = state.capabilities.map((cap, i) => ({ cap, i, q: state.questions[cap.id] || {} }))
      .filter(r => !covered.has(r.i) && r.q.priority === 1)

    sheet.append(el('header', { class: 'sp-section-head' },
      el('div', {},
        el('p', { class: 'rc-eyebrow', text: 'Cheat sheet' + (label ? ', ' + label : '') }),
        el('h2', { id: 'sp-sheet-title', tabindex: '-1', text: 'Your AI stack on one page' }),
        el('p', { class: 'rc-note', text: preparedLine() })),
      el('div', { class: 'sp-actions sp-noprint' },
        el('button', { type: 'button', class: 'rc-secondary', onclick: () => printPart('sheet') }, 'Print the cheat sheet'))))

    sheet.append(el('div', { class: 'sp-summary' },
      el('p', {}, el('strong', { text: 'Together your ' + plural(state.stack.length, 'platform') + ' document ' + covered.size + ' of our ' + total + ' controls, fully or in part. ' }),
        (total - covered.size) + ' are not documented by any of them.'),
      openFirst.length
        ? el('p', {}, 'Ask about these first, because no platform you picked documents them: ', el('span', { text: openFirst.map(r => r.cap.name).join(', ') + '.' }))
        : el('p', { text: 'Every control we suggest asking about first is documented by at least one of your platforms.' })))

    const grid = el('div', { class: 'sp-cards' + (state.stack.length > 3 ? ' sp-many' : '') })
    for (const s of state.stack) grid.append(card(s))
    sheet.append(grid)

    sheet.append(el('ul', { class: 'sp-key', 'aria-label': 'Key to the control strips' },
      ['S', 'P', 'N', 'O'].map(ch => el('li', {}, el('i', { class: 'v-' + STATUS[ch].cls, 'aria-hidden': 'true' }), STATUS[ch].label))))
    sheet.append(el('p', { class: 'rc-note sp-sheet-foot', text: 'From public vendor documentation only, not testing of any account, tenant or region. Each strip shows our 46 controls in order. The vendor questions pack below has the question for every gap, with sources.' }))
  }

  function card(s) {
    const p = state.platforms[s.id]
    const c = counts(s.id)
    const all = rows(s.id)
    const acct = s.account ? state.accountTypes[s.account] : null
    const gaps = all.filter(r => r.code === 'N' || r.code === 'P').sort(byPriority)
    const on = all.filter(r => (r.code === 'S' || r.code === 'P') && r.cell).sort(byPriority)
    const shownGaps = gaps.slice(0, 5)
    const shownOn = on.slice(0, 5)

    const node = el('article', { class: 'sp-card', 'aria-labelledby': 'sp-card-' + s.id },
      el('header', { class: 'sp-card-head' },
        el('h3', { id: 'sp-card-' + s.id, text: p.name }),
        acct ? el('span', { class: 'sp-tag', text: acct.name }) : null),
      el('p', { class: 'sp-counts' },
        el('strong', { text: 'Documents ' + c.S + ' of ' + state.capabilities.length + ' controls.' }),
        ' ' + (c.P ? c.P + ' partly. ' : '') + c.N + ' not documented.' + (c.O ? ' ' + c.O + ' outside what it does.' : '') + (c.R ? ' ' + c.R + ' not researched.' : '')),
      strip(s.id))

    if (s.account === 'personal' && acct) node.append(el('p', { class: 'sp-warn' }, el('strong', { text: 'Personal plan. ' }), acct.controls || ''))
    if (!state.cells[s.id]) {
      node.append(el('p', { class: 'rc-note', text: gated(s.id)
        ? 'The detail for this platform is in our paid report. The counts above are from the free data.'
        : 'We could not load the detail for this platform just now. The counts above still stand. Reload to try again.' }))
      return node
    }

    const cols = el('div', { class: 'sp-card-cols' })
    cols.append(el('div', {},
      el('h4', { text: 'Notable gaps' }),
      shownGaps.length
        ? el('ul', { class: 'sp-list' }, shownGaps.map(r => el('li', {}, r.cap.name, r.code === 'P' ? el('span', { class: 'sp-muted', text: ' (partly)' }) : null)))
        : el('p', { class: 'rc-note', text: 'None among the controls it is built for.' }),
      gaps.length > shownGaps.length ? el('p', { class: 'sp-muted sp-small', text: 'and ' + (gaps.length - shownGaps.length) + ' more in the vendor questions.' }) : null))
    cols.append(el('div', {},
      el('h4', { text: 'What to switch on' }),
      shownOn.length
        ? el('ul', { class: 'sp-list' }, shownOn.map(r => {
          const ev = evidence(r, p.name)
          const how = firstSentence(ev.conditions)
          return el('li', {}, el('strong', { text: r.cap.name }), ev.products ? ': ' + ev.products + '.' : '', how ? el('span', { class: 'sp-muted sp-cond', text: ' ' + how }) : null)
        }))
        : el('p', { class: 'rc-note', text: 'It documents none of our controls.' }),
      on.length > shownOn.length ? el('p', { class: 'sp-muted sp-small', text: 'and ' + (on.length - shownOn.length) + ' more documented controls.' }) : null))
    node.append(cols)
    const dates = all.map(r => r.cell && r.cell.checked_on).filter(Boolean).sort()
    if (dates.length) node.append(el('p', { class: 'sp-muted sp-small', text: 'Documentation checked ' + (dates[0] === dates[dates.length - 1] ? fmtDate(dates[0]) : fmtDate(dates[0]) + ' to ' + fmtDate(dates[dates.length - 1])) + '.' }))
    return node
  }

  // ---------- Vendor questions ----------

  function packFor(s) {
    const p = state.platforms[s.id]
    const want = state.includeOut ? ['N', 'P', 'O'] : ['N', 'P']
    const items = rows(s.id).filter(r => want.includes(r.code)).sort(byPriority)
      .map(r => Object.assign(r, { ev: evidence(r, p.name) }))
    return { s, p, items, outCount: counts(s.id).O }
  }

  function renderQuestions() {
    const pack = $('sp-questions')
    pack.hidden = false
    pack.textContent = ''
    const packs = state.stack.map(packFor)
    const totalQ = packs.reduce((n, x) => n + x.items.length, 0)
    const totalOut = packs.reduce((n, x) => n + x.outCount, 0)

    pack.append(el('header', { class: 'sp-section-head' },
      el('div', {},
        el('p', { class: 'rc-eyebrow', text: 'Vendor questions' }),
        el('h2', { id: 'sp-questions-title', tabindex: '-1', text: plural(totalQ, 'question') + ' to send your vendors' }),
        el('p', { class: 'rc-note', text: 'Each question comes with what the vendor already publishes, so you only ask about what is missing. Questions we suggest asking first come first.' })),
      el('div', { class: 'sp-actions sp-noprint' },
        el('button', { type: 'button', class: 'rc-secondary', onclick: () => download('stack-pack-vendor-questions.md', packs.map(markdown).join('\n\n---\n\n'), 'text/markdown') }, 'Download all (Markdown)'),
        el('button', { type: 'button', class: 'rc-secondary', onclick: () => download('stack-pack-vendor-questions.txt', packs.map(plainText).join('\n\n' + '='.repeat(60) + '\n\n'), 'text/plain') }, 'Download all (plain text)'),
        el('button', { type: 'button', class: 'rc-secondary', onclick: () => printPart('questions') }, 'Print the questions'))))

    const box = el('input', { type: 'checkbox', id: 'sp-include-out', checked: state.includeOut, onchange: e => { state.includeOut = e.target.checked; writeProfile(); renderQuestions(); $('sp-include-out').focus() } })
    pack.append(el('p', { class: 'sp-toggle sp-noprint' }, el('label', { for: 'sp-include-out' }, box,
      ' Also ask about controls outside what a platform is built to do (' + plural(totalOut, 'control') + ' across your platforms)')))
    pack.append(el('p', { class: 'sp-copy-status', id: 'sp-copy-status', role: 'status', 'aria-live': 'polite' }))

    for (const x of packs) pack.append(vendorBlock(x))
  }

  function vendorBlock(x) {
    const { s, p, items } = x
    const head = el('header', { class: 'sp-vendor-head' },
      el('h3', { id: 'sp-v-' + s.id, text: p.name + ': ' + plural(items.length, 'question') }),
      el('div', { class: 'sp-actions sp-noprint' },
        el('button', { type: 'button', class: 'rc-secondary', 'aria-label': 'Copy the questions for ' + p.name, onclick: () => copy(plainText(x), p.name) }, 'Copy questions'),
        el('button', { type: 'button', class: 'rc-secondary', 'aria-label': 'Download the questions for ' + p.name + ' as Markdown', onclick: () => download('questions-for-' + s.id + '.md', markdown(x), 'text/markdown') }, 'Download (Markdown)')))
    const block = el('article', { class: 'sp-vendor', 'aria-labelledby': 'sp-v-' + s.id }, head)
    if (!state.cells[s.id]) {
      block.append(el('p', { class: 'rc-note', text: gated(s.id) ? 'The evidence for this platform is in our paid report, so the questions below are not pre-answered.' : 'We could not load the evidence for this platform, so the questions below are not pre-answered. Reload to try again.' }))
    }
    if (!items.length) {
      block.append(el('p', { class: 'rc-note', text: p.name + ' documents every control we would ask about here.' }))
      return block
    }
    const list = el('ol', { class: 'sp-qlist' })
    for (const r of items) list.append(questionItem(r, p.name))
    block.append(list)
    return block
  }

  function questionItem(r, name) {
    const st = STATUS[r.code] || STATUS.R
    const ev = r.ev
    const li = el('li', { class: 'sp-q' },
      el('div', { class: 'sp-q-head' },
        el('h4', { text: r.cap.name }),
        el('span', { class: 'sp-badge v-' + st.cls, text: st.label }),
        r.priority === 1 ? el('span', { class: 'sp-badge sp-first', text: 'Ask first' }) : null),
      el('p', { class: 'sp-ask', text: r.q.ask || r.cap.notes }),
      r.q.why ? el('p', { class: 'sp-muted sp-small', text: r.q.why }) : null)

    const pub = el('div', { class: 'sp-ev' }, el('h5', { text: 'What ' + name + ' publishes' + (ev.checked ? ', checked ' + fmtDate(ev.checked) : '') }))
    if (ev.none) pub.append(el('p', { text: r.cell ? 'We found nothing on this in ' + name + "'s public documentation." : 'Not available in the free data.' }))
    if (ev.products) pub.append(el('p', {}, el('span', { class: 'sp-label', text: 'Related features: ' }), ev.products))
    if (ev.conditions && r.code === 'P') pub.append(el('p', { text: ev.conditions }))
    if (ev.quote) pub.append(el('blockquote', {}, el('p', { text: '"' + ev.quote.text + '"' }), el('footer', {}, el('a', { href: ev.quote.url, rel: 'noopener noreferrer', target: '_blank', text: hostOf(ev.quote.url) }), ev.quote.date ? ', fetched ' + fmtDate(ev.quote.date) : '')))
    if (ev.sources.length) pub.append(el('ul', { class: 'sp-sources' }, ev.sources.map(src => el('li', {}, el('a', { href: src.url, rel: 'noopener noreferrer', target: '_blank', text: src.title || hostOf(src.url) }), src.locator ? el('span', { class: 'sp-muted', text: ', ' + src.locator }) : null))))
    li.append(pub)
    if (ev.missing) li.append(el('div', { class: 'sp-ev sp-missing' }, el('h5', { text: 'Still missing' }), el('p', { text: ev.missing })))
    return li
  }

  function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, '') } catch (e) { return u } }

  // ---------- Exports ----------

  function exportIntro(name) {
    return 'We are reviewing how our business uses ' + name + '. For each point below we have noted what your public documentation says and what we could not find. Please confirm or correct each point and send us the documentation for anything missing.'
  }
  function exportFoot() {
    const k = state.index.knowledge || {}
    return 'Prepared with the Stack pack (' + location.origin + '/stack-pack/) from public documentation in the AI Stack Check knowledge base as at ' + fmtDate(k.updated_on || state.index.generated_at) + '. It reflects published documentation only, not testing of any account.'
  }

  function plainText(x) {
    const { p, items } = x
    const out = ['Questions for ' + p.name, '', exportIntro(p.name), '']
    items.forEach((r, n) => {
      const ev = r.ev
      out.push((n + 1) + '. ' + r.cap.name + ' (' + (STATUS[r.code] || STATUS.R).label.toLowerCase() + ')')
      out.push('Question: ' + (r.q.ask || r.cap.notes))
      const pub = []
      if (ev.none) pub.push(r.cell ? 'We found nothing on this in your public documentation.' : 'Not checked.')
      if (ev.products) pub.push('Related features: ' + ev.products + '.')
      if (ev.conditions && r.code === 'P') pub.push(ev.conditions)
      if (ev.quote) pub.push('"' + ev.quote.text + '" (' + ev.quote.url + (ev.quote.date ? ', fetched ' + fmtDate(ev.quote.date) : '') + ')')
      out.push('What you publish' + (ev.checked ? ' (checked ' + fmtDate(ev.checked) + ')' : '') + ': ' + pub.join(' '))
      for (const src of ev.sources) out.push('  Source: ' + (src.title ? src.title + ', ' : '') + src.url)
      if (ev.missing) out.push('What we could not find: ' + ev.missing)
      out.push('')
    })
    if (!items.length) out.push('Nothing to ask: your documentation covers every control we checked.', '')
    out.push(exportFoot())
    return out.join('\n')
  }

  function md(s) { return String(s).replace(/([\\`*_[\]<>#|])/g, '\\$1') }
  function markdown(x) {
    const { p, items } = x
    const out = ['# Questions for ' + md(p.name), '', md(exportIntro(p.name)), '']
    items.forEach((r, n) => {
      const ev = r.ev
      out.push('## ' + (n + 1) + '. ' + md(r.cap.name), '', '*Status in your public documentation: ' + (STATUS[r.code] || STATUS.R).label.toLowerCase() + '*', '')
      out.push('**Question:** ' + md(r.q.ask || r.cap.notes), '')
      out.push('**What you publish' + (ev.checked ? ' (checked ' + fmtDate(ev.checked) + ')' : '') + ':**', '')
      if (ev.none) out.push('- ' + (r.cell ? 'We found nothing on this in your public documentation.' : 'Not checked.'))
      if (ev.products) out.push('- Related features: ' + md(ev.products))
      if (ev.conditions && r.code === 'P') out.push('- ' + md(ev.conditions))
      if (ev.quote) out.push('- > ' + md(ev.quote.text) + ' ([source](' + ev.quote.url + ')' + (ev.quote.date ? ', fetched ' + fmtDate(ev.quote.date) : '') + ')')
      for (const src of ev.sources) out.push('- [' + md(src.title || hostOf(src.url)) + '](' + src.url + ')' + (src.locator ? ', ' + md(src.locator) : ''))
      out.push('')
      if (ev.missing) out.push('**What we could not find:** ' + md(ev.missing), '')
    })
    if (!items.length) out.push('Nothing to ask: your documentation covers every control we checked.', '')
    out.push('---', '', '*' + md(exportFoot()) + '*')
    return out.join('\n')
  }

  function download(name, text, type) {
    const blob = new Blob([text], { type: type + ';charset=utf-8' })
    const a = el('a', { href: URL.createObjectURL(blob), download: name })
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  async function copy(text, name) {
    const say = $('sp-copy-status')
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(text)
      else throw new Error('no clipboard')
      say.textContent = 'Copied the questions for ' + name + '. Paste them into an email to the vendor.'
    } catch (e) {
      const area = el('textarea', { class: 'visually-hidden', 'aria-hidden': 'true' })
      area.value = text
      document.body.append(area)
      area.select()
      let ok = false
      try { ok = document.execCommand('copy') } catch (err) { ok = false }
      area.remove()
      say.textContent = ok ? 'Copied the questions for ' + name + '.' : 'Your browser blocked copying. Use the download button instead.'
    }
  }

  function printPart(part) {
    document.body.classList.add('sp-print-' + part)
    const done = () => { document.body.classList.remove('sp-print-' + part); window.removeEventListener('afterprint', done) }
    window.addEventListener('afterprint', done)
    window.print()
    setTimeout(done, 1500)
  }

  // ---------- Profile bar ----------

  // The shared widget renders the "your stack" bar. Until it is deployed, show a minimal one here with the
  // save options this page's fallback library supports, in the order the contract sets.
  function profileBar() {
    const mount = $('mw-profile-bar')
    // The shared widget mounts itself on [data-mw-profile-bar]. Call it once more in case it loaded first.
    if (window.MWProfileBar && typeof window.MWProfileBar.mount === 'function' && !mount.childElementCount) {
      try { window.MWProfileBar.mount(mount, { tool: TOOL }) } catch (e) { /* fall through */ }
    }
    if (mount.childElementCount || !window.MWProfile) return
    mount.classList.add('sp-bar-fallback')
    const file = el('input', { type: 'file', accept: '.json,application/json', id: 'sp-upload', hidden: true, onchange: async e => {
      const f = e.target.files[0]
      e.target.value = ''
      try { await window.MWProfile.upload(f); status('') } catch (err) { status(err.message || 'We could not read that file.') }
    } })
    const device = el('input', { type: 'checkbox', id: 'sp-device', checked: window.MWProfile.mode() === 'device', onchange: e => window.MWProfile.setMode(e.target.checked ? 'device' : 'memory') })
    mount.append(
      el('p', {}, el('strong', { text: 'Keep your AI tools for next time.' }), ' It is in this page only until you choose.'),
      el('div', { class: 'sp-actions' },
        el('button', { type: 'button', class: 'rc-secondary', onclick: () => window.MWProfile.download() }, 'Download your stack'),
        el('button', { type: 'button', class: 'rc-secondary', onclick: () => file.click() }, 'Upload your previous stack'), file),
      el('p', { class: 'sp-toggle' }, el('label', { for: 'sp-device' }, device, ' Remember it in this browser only')),
      el('p', { class: 'rc-note', text: 'Clearing site data or changing device loses a list kept in the browser. A downloaded file works on any device and in our other tools.' }))
  }

  // ---------- Start ----------

  async function start() {
    try {
      const [index, questions] = await Promise.all([getJSON(KB + 'index.json'), getJSON(QUESTIONS)])
      state.index = index
      state.questions = questions.questions || {}
      state.capabilities = index.capabilities || []
      for (const p of index.platforms || []) state.platforms[p.id] = p
      for (const t of index.procurement_account_types || []) state.accountTypes[t.id] = t
    } catch (e) {
      status('We could not load the knowledge base just now. Reload the page to try again.')
      $('sp-picker-intro').textContent = 'The platform list did not load.'
      return
    }
    const k = state.index.knowledge || {}
    $('sp-banner-line').textContent = 'Knowledge base updated ' + fmtDate(k.updated_on || state.index.generated_at) + '. ' + state.index.platforms.length + ' platforms in the free data, ' + state.capabilities.length + ' controls each.'

    readProfile()
    // A shared link can carry platform ids in the fragment (#stack=openai,anthropic), as on the Stack Check.
    const m = /(?:^|[#&])stack=([a-z0-9,-]+)/.exec(location.hash || '')
    if (!state.stack.length && m) {
      state.stack = m[1].split(',').filter(id => state.platforms[id]).slice(0, MAX_STACK).map(id => ({ id, account: validAccount(id, '') }))
      if (state.stack.length) writeProfile()
    }
    renderPicker()
    profileBar()
    if (window.MWProfile && window.MWProfile.onChange) {
      window.MWProfile.onChange(() => {
        const before = stackKey(state.stack) + '|' + state.includeOut
        readProfile()
        if (stackKey(state.stack) + '|' + state.includeOut === before) return
        syncPicker()
        build()
      })
    }
    build()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
})()
