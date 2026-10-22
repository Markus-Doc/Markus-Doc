'use strict'

// AI register page. Reads the KB from /stack-check/, keeps rows in the shared stack profile
// (answers.ai-register, picklist ids only) and keeps typed text in a device-only notes map.
;(function () {
  const M = window.ARModel
  const P = window.MWProfile
  const NOTES_KEY = 'mw-ai-register-notes-v1'
  const INDEX_URL = '/stack-check/data/index.json'
  const RESIDENCY_URL = '/stack-check/assets/assessment/residency.json'
  const ANSWERS_BUDGET = 15000
  const CELLS_URL = id => '/stack-check/data/cells/' + encodeURIComponent(id) + '.json'

  const state = { kb: M.buildKb(null, null), answers: { rows: [], dismissed: [] }, notes: {}, editing: null, saving: false, lastRemoved: null }
  const $ = id => document.getElementById(id)

  // ---------- small DOM helpers ----------
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag)
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue
      if (k === 'class') n.className = v
      else if (k === 'text') n.textContent = v
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v)
      else n.setAttribute(k, v === true ? '' : v)
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) n.append(kid.nodeType ? kid : document.createTextNode(String(kid)))
    return n
  }
  function fmtDate(iso) {
    if (!iso) return ''
    try { return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z')) } catch (e) { return iso }
  }
  function status(msg, ok, action) {
    const box = $('ar-status')
    box.textContent = ''
    box.classList.toggle('is-ok', !!ok)
    box.setAttribute('role', ok ? 'status' : 'alert')
    if (!msg) return
    box.append(msg)
    if (action) box.append(' ', el('button', { type: 'button', class: 'ar-link', onclick: action.run }, action.label))
  }

  // ---------- storage ----------
  function mode() { try { return P.mode() } catch (e) { return 'memory' } }
  function notesPersist() { return mode() === 'device' || mode() === 'account' }
  function loadNotes() {
    if (!notesPersist()) return {}
    try { return M.cleanNotes(JSON.parse(window.localStorage.getItem(NOTES_KEY) || '{}')) } catch (e) { return {} }
  }
  function saveNotes() {
    try {
      if (notesPersist()) window.localStorage.setItem(NOTES_KEY, JSON.stringify(state.notes))
      else window.localStorage.removeItem(NOTES_KEY)
    } catch (e) { /* storage blocked, notes last for this page only */ }
  }
  function save() {
    state.saving = true
    try {
      // The profile library drops a tool's whole answers section over 16 KB, so stop short of that.
      if (M.answersBytes(state.answers) > ANSWERS_BUDGET) { status('Your register is too large to save with your stack. Download the CSV to keep a full copy, or remove some rows.'); return }
      P.setAnswers(M.TOOL_ID, M.compactAnswers(state.answers), M.ANSWERS_VERSION)
    }
    catch (e) { status('We could not save the register to your profile. Download the CSV to keep a copy.') }
    finally { state.saving = false }
  }
  // A KB tool added here also joins the shared stack, so other tools see it.
  function addToStack(row) {
    if (!row.platform || !state.kb.platforms.has(row.platform)) return
    state.saving = true
    try {
      P.update(d => {
        d.stack = d.stack || { platforms: [], unlisted: [], preset: null }
        d.stack.platforms = d.stack.platforms || []
        let p = d.stack.platforms.find(x => x && x.id === row.platform)
        if (!p) {
          const st = M.STATUS_TO_PROFILE[row.status]
          if (!st) return   // a decommissioned tool does not join the stack
          p = { id: row.platform, routes: [], status: st }
          d.stack.platforms.push(p)
        }
        if (row.account && row.account !== 'unsure' && !p.account && enumHas('account', row.account)) p.account = row.account
        if (row.route) { p.routes = p.routes || []; if (!p.routes.includes(row.route)) p.routes.push(row.route) }
      })
    } catch (e) { /* the register still holds the row */ }
    finally { state.saving = false }
  }
  function enumHas(name, v) { return !(P.ENUMS && Array.isArray(P.ENUMS[name])) || P.ENUMS[name].indexOf(v) !== -1 }
  function note(id) { return state.notes[id] || (state.notes[id] = { name: '', purpose: '', notes: '' }) }
  function row(id) { return state.answers.rows.find(r => r.id === id) }

  // ---------- table ----------
  function render() {
    const rows = state.answers.rows
    const body = $('ar-rows')
    body.textContent = ''
    $('ar-empty').hidden = rows.length > 0
    $('ar-table-wrap').hidden = rows.length === 0
    $('ar-scroll-hint').hidden = rows.length === 0
    const tools = rows.filter(r => r.kind === 'tool').length
    const agents = rows.length - tools
    const elevated = rows.filter(r => r.risk === 'elevated' || r.risk === 'unacceptable').length
    $('ar-count').textContent = rows.length
      ? [plural(tools, 'tool'), plural(agents, 'agent'), elevated ? elevated + ' Elevated or Unacceptable' : ''].filter(Boolean).join(', ')
      : ''
    const now = M.today()
    for (const r of rows) {
      const kb = state.kb
      const n = state.notes[r.id] || {}
      const f = M.kbFacts(r, kb)
      const name = M.displayName(r, state.notes, kb)
      const sugg = M.suggestRisk(r, safeProfile())
      const riskCell = r.risk
        ? el('span', { class: 'ar-pill is-' + r.risk }, M.label('risk', r.risk))
        : el('span', {}, el('span', { class: 'ar-pill is-empty' }, 'Not set'), el('span', { class: 'ar-sub' }, 'Suggested: ' + M.label('risk', sugg.level)))
      const controls = f.controls.length
        ? el('ul', { class: 'ar-controls' }, f.controls.map(c => el('li', {}, el('span', { class: 'ar-letter is-' + c.letter, 'aria-hidden': 'true' }, c.letter), el('span', {}, c.name, el('span', { class: 'visually-hidden' }, ': ' + c.meaning)))))
        : el('span', { class: 'ar-sub' }, f.covered ? 'Detail not in the free version' : r.kind === 'agent' ? 'See the platform it runs on' : 'Outside our knowledge base')
      const tr = el('tr', { class: state.editing === r.id ? 'is-editing' : null },
        el('th', { scope: 'row' }, name, ' ', el('span', { class: 'ar-kind' }, r.kind === 'agent' ? 'Agent' : 'Tool'),
          f.group ? el('span', { class: 'ar-sub' }, f.group) : null),
        el('td', {}, r.owner ? M.label('owner', r.owner) : el('span', { class: 'ar-sub' }, 'Not set')),
        el('td', {}, M.label('status', r.status)),
        el('td', {}, M.sourceText(r, kb) || el('span', { class: 'ar-sub' }, 'Not set')),
        el('td', {}, n.purpose ? el('span', {}, n.purpose) : null, r.uses.length ? el('span', { class: n.purpose ? 'ar-sub' : null }, M.labels('uses', r.uses).join(', ')) : (n.purpose ? null : el('span', { class: 'ar-sub' }, 'Not set'))),
        el('td', {}, r.data.length ? M.labels('data', r.data).join(', ') : el('span', { class: 'ar-sub' }, 'Not set'), r.dtypes.length ? el('span', { class: 'ar-sub' }, M.labels('dtypes', r.dtypes).join(', ')) : null),
        el('td', {}, r.users.length ? M.labels('users', r.users).join(', ') : el('span', { class: 'ar-sub' }, 'Not set')),
        el('td', {}, r.kind === 'agent' ? agentHosting(r) : M.hostingText(r, kb), r.account !== 'unsure' && r.kind === 'tool' ? el('span', { class: 'ar-sub' }, M.label('account', r.account)) : null),
        el('td', {}, riskCell),
        el('td', {}, fmtDate(r.registered)),
        el('td', {}, r.review ? el('span', { class: r.review < now ? 'ar-overdue' : null }, fmtDate(r.review), r.review < now ? ' (overdue)' : '') : el('span', { class: 'ar-sub' }, 'Not set')),
        el('td', {}, controls),
        el('td', { class: 'ar-col-actions' }, el('div', { class: 'ar-row-actions' },
          el('button', { type: 'button', class: 'ar-link', 'data-edit': r.id, 'aria-label': 'Edit ' + name, onclick: () => openEditor(r.id) }, 'Edit'),
          el('button', { type: 'button', class: 'ar-link is-danger', 'aria-label': 'Remove ' + name, onclick: () => removeRow(r.id) }, 'Remove')))
      )
      body.append(tr)
    }
  }
  function plural(n, word) { return n ? n + ' ' + word + (n === 1 ? '' : 's') : '' }
  function agentHosting(r) {
    const on = r.agent && r.agent.runs_on
    if (!on) return el('span', { class: 'ar-sub' }, 'Platform not set')
    const host = state.answers.rows.find(x => x.kind === 'tool' && x.platform === on)
    return 'Runs on ' + (M.platformName(state.kb, on) || on) + (host ? '. ' + M.hostingText(host, state.kb) : '')
  }
  function safeProfile() { try { return P.get() } catch (e) { return null } }

  // ---------- add and remove ----------
  function addRow(r, fromKb) {
    if (state.answers.rows.length >= M.MAX_ROWS) { status('The register holds up to ' + M.MAX_ROWS + ' rows.'); return null }
    state.answers.rows.push(r)
    if (r.platform) state.answers.dismissed = state.answers.dismissed.filter(x => x !== r.platform)
    save()
    if (fromKb) addToStack(r)
    render()
    return r
  }
  function removeRow(id) {
    const i = state.answers.rows.findIndex(r => r.id === id)
    if (i < 0) return
    const r = state.answers.rows[i]
    const name = M.displayName(r, state.notes, state.kb)
    state.answers.rows.splice(i, 1)
    const stillThere = r.platform && state.answers.rows.some(x => x.platform === r.platform)
    if (r.platform && !stillThere && !state.answers.dismissed.includes(r.platform)) state.answers.dismissed.push(r.platform)
    state.lastRemoved = { row: r, index: i, note: state.notes[id] }
    delete state.notes[id]
    saveNotes()
    save()
    if (state.editing === id) closeEditor(false)
    render()
    status('Removed ' + name + '.', true, { label: 'Undo', run: undoRemove })
    $('ar-add-tool').focus()
  }
  function undoRemove() {
    const lr = state.lastRemoved
    if (!lr) return
    state.answers.rows.splice(Math.min(lr.index, state.answers.rows.length), 0, lr.row)
    if (lr.row.platform) state.answers.dismissed = state.answers.dismissed.filter(x => x !== lr.row.platform)
    if (lr.note) { state.notes[lr.row.id] = lr.note; saveNotes() }
    state.lastRemoved = null
    save()
    render()
    status('Row restored.', true)
  }

  // ---------- picker ----------
  function openPicker() {
    closeEditor(false)
    $('ar-picker').hidden = false
    $('ar-search').value = ''
    $('ar-results').textContent = ''
    $('ar-search').focus()
  }
  function closePicker(focusBack) {
    $('ar-picker').hidden = true
    if (focusBack) $('ar-add-tool').focus()
  }
  function search() {
    const q = $('ar-search').value.trim().toLowerCase()
    const out = $('ar-results')
    out.textContent = ''
    if (q.length < 2) { $('ar-search-hint').textContent = 'Type at least two letters.'; return }
    const kb = state.kb
    const match = p => p.name.toLowerCase().includes(q) || p.id.includes(q)
    const hits = [...kb.platforms.values()].filter(match).map(p => ({ p, detail: true }))
      .concat([...kb.more.values()].filter(match).map(p => ({ p, detail: false })))
      .sort((a, b) => (b.detail - a.detail) || (a.p.name.toLowerCase().indexOf(q) - b.p.name.toLowerCase().indexOf(q)) || a.p.name.localeCompare(b.p.name))
      .slice(0, 12)
    $('ar-search-hint').textContent = kb.index ? (hits.length ? hits.length + (hits.length === 12 ? ' or more' : '') + ' matches. Use the arrow keys to move through them.' : 'No match. Add it by name below.') : 'Our knowledge base did not load. Add the tool by name below.'
    for (const h of hits) {
      const g = kb.groups.get(h.p.group_id)
      const routes = kb.routesByPlatform.get(h.p.id)
      out.append(el('li', {}, el('button', { type: 'button', class: 'ar-result', onclick: () => pick(h.p.id), onkeydown: resultKeys },
        el('span', {}, h.p.name),
        el('small', {}, [g ? g.name : '', h.detail ? 'vendor facts available' : 'name only in the free version', routes ? routes.length + ' hosting route' + (routes.length === 1 ? '' : 's') : ''].filter(Boolean).join(', ')))))
    }
  }
  function resultKeys(e) {
    const items = Array.from($('ar-results').querySelectorAll('.ar-result'))
    const i = items.indexOf(e.currentTarget)
    if (e.key === 'ArrowDown') { e.preventDefault(); (items[i + 1] || items[0]).focus() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); i === 0 ? $('ar-search').focus() : items[i - 1].focus() }
  }
  function pick(platformId) {
    const routes = state.kb.routesByPlatform.get(platformId) || []
    const r = M.newRow('tool', { platform: platformId, route: routes.length === 1 ? routes[0].id : '' })
    if (addRow(r, true)) { closePicker(false); openEditor(r.id) }
  }
  function addUnlisted() {
    const name = M.shortName($('ar-unlisted-name').value)
    if (!name) { status('Type the tool name first.'); $('ar-unlisted-name').focus(); return }
    const r = addRow(M.newRow('tool', { unlisted: name }), false)
    if (r) {
      $('ar-unlisted-name').value = ''
      state.saving = true
      try { P.update(d => { d.stack = d.stack || { platforms: [], unlisted: [], preset: null }; d.stack.unlisted = d.stack.unlisted || []; if (d.stack.unlisted.length < 20 && !d.stack.unlisted.includes(name)) d.stack.unlisted.push(name) }) } catch (e) { /* row kept */ }
      finally { state.saving = false }
      closePicker(false)
      openEditor(r.id)
    }
  }
  function addAgent() {
    closePicker(false)
    const r = addRow(M.newRow('agent', {}), false)
    if (r) openEditor(r.id)
  }

  // ---------- editor ----------
  let uid = 0
  function fieldId(name) { return 'ar-f-' + name + '-' + (++uid) }
  function select(name, labelText, value, options, onChange, hint) {
    const id = fieldId(name)
    const hintId = hint ? id + '-hint' : null
    const s = el('select', { id, class: 'ar-select', 'aria-describedby': hintId, onchange: e => onChange(e.target.value) },
      options.map(o => o.group
        ? el('optgroup', { label: o.group }, o.options.map(x => el('option', { value: x.id, selected: x.id === value }, x.label)))
        : el('option', { value: o.id, selected: o.id === value }, o.label)))
    return el('div', {}, el('label', { class: 'ar-label', for: id }, labelText), s, hint ? el('p', { class: 'ar-hint', id: hintId }, hint) : null)
  }
  function checks(name, legend, values, onChange, hint) {
    const hintId = hint ? fieldId(name + '-hint') : null
    return el('fieldset', { 'aria-describedby': hintId },
      el('legend', { class: 'ar-legend' }, legend),
      hint ? el('p', { class: 'ar-hint', id: hintId }, hint) : null,
      el('div', { class: 'ar-checks' }, M.PICK[name].map(o => {
        const id = fieldId(name)
        return el('label', { class: 'ar-check', for: id },
          el('input', { type: 'checkbox', id, value: o.id, checked: values.includes(o.id), onchange: e => {
            const set = new Set(values)
            e.target.checked ? set.add(o.id) : set.delete(o.id)
            values = M.PICK[name].map(x => x.id).filter(x => set.has(x))
            onChange(values)
          } }), el('span', {}, o.label))
      })))
  }
  function dateField(name, labelText, value, onChange) {
    const id = fieldId(name)
    return el('div', {}, el('label', { class: 'ar-label', for: id }, labelText),
      el('input', { type: 'date', id, class: 'ar-input', value: value || '', onchange: e => onChange(/^\d{4}-\d{2}-\d{2}$/.test(e.target.value) ? e.target.value : '') }))
  }
  function textField(kind, labelText, value, onInput, hint, max) {
    const id = fieldId(kind)
    const hintId = id + '-hint'
    const input = kind === 'area'
      ? el('textarea', { id, class: 'ar-textarea', maxlength: String(max), 'aria-describedby': hintId, oninput: e => onInput(e.target.value) })
      : el('input', { type: 'text', id, class: 'ar-input', maxlength: String(max), autocomplete: 'off', 'aria-describedby': hintId, oninput: e => onInput(e.target.value) })
    input.value = value || ''
    return el('div', {}, el('label', { class: 'ar-label', for: id }, labelText), input, el('p', { class: 'ar-hint', id: hintId }, hint))
  }
  const opts = (name, blank) => (blank ? [{ id: '', label: blank }] : []).concat(M.PICK[name])

  let notesTimer = null
  function change(id, fn, rerenderForm) {
    const r = row(id)
    if (!r) return
    fn(r)
    const clean = M.cleanRow(r, state.kb)
    if (clean) Object.assign(r, clean)
    save()
    if (r.kind === 'tool' && r.platform) addToStack(r)
    render()
    renderFacts(r)
    renderSuggestion(r)
    if (rerenderForm) buildForm(r)
  }
  function changeNote(id, key, value) {
    note(id)[key] = key === 'name' ? value.slice(0, M.NAME_MAX) : value.slice(0, M.NOTE_MAX)
    clearTimeout(notesTimer)
    notesTimer = setTimeout(() => { saveNotes(); render() }, 300)
  }

  function openEditor(id) {
    const r = row(id)
    if (!r) return
    state.editing = id
    $('ar-picker').hidden = true
    $('ar-editor').hidden = false
    $('ar-editor-title').textContent = 'Edit ' + M.displayName(r, state.notes, state.kb)
    renderFacts(r)
    buildForm(r)
    render()
    $('ar-editor').scrollIntoView({ block: 'start' })
    $('ar-editor-title').focus({ preventScroll: true })
  }
  function closeEditor(focusBack) {
    const id = state.editing
    state.editing = null
    $('ar-editor').hidden = true
    saveNotes()
    render()
    if (focusBack && id) {
      const b = document.querySelector('[data-edit="' + id + '"]')
      if (b) b.focus()
    }
  }

  function renderFacts(r) {
    const box = $('ar-facts')
    box.textContent = ''
    if (r.kind === 'agent') return
    const f = M.kbFacts(r, state.kb)
    if (!f.covered) {
      box.append(el('h3', {}, 'What the vendor documents'), el('p', {}, 'This tool is outside our knowledge base, so we cannot fill in vendor facts. Ask the vendor where your data is stored and processed, whether it is used for training, and what admin and audit controls you get.'))
      return
    }
    const dl = el('dl', {})
    const add = (k, v) => { if (v) dl.append(el('dt', {}, k), el('dd', {}, v)) }
    add('Provider', f.provider)
    add('Type', f.procurement)
    if (f.route) {
      add('Hosting route', f.route.name)
      add('Region', M.regionText(f.route).replace(/^./, c => c.toUpperCase()))
      add('Residency level', f.level)
      add('Conditions', f.route.conditions)
    } else if (state.kb.routesByPlatform.has(r.platform)) {
      add('Hosting route', 'Choose the route you use below to see where data is stored and processed.')
    } else {
      add('Hosting route', 'Our knowledge base has no residency record for this platform yet.')
    }
    add('Data terms', f.terms ? 'For a ' + M.label('account', r.account).toLowerCase() + ': ' + f.terms : 'Choose the account type below to see the usual data terms for it.')
    if (f.shadow) add('Shadow AI', 'Anyone can sign up for a personal plan of this product, so staff may use it without approval.')
    if (f.controls.length) {
      dl.append(el('dt', {}, 'Documented controls'), el('dd', {}, el('ul', { class: 'ar-controls' }, f.controls.map(c => el('li', {}, el('span', { class: 'ar-letter is-' + c.letter, 'aria-hidden': 'true' }, c.letter), c.name + ': ' + c.meaning.toLowerCase())))))
    } else if (!f.detail) {
      add('Documented controls', 'This platform is in our catalogue, but its detail is not in the free version.')
    }
    box.append(el('h3', {}, 'What the vendor documents'), dl,
      el('p', { class: 'ar-note' }, 'From vendor documentation as at ' + fmtDate(state.kb.asAt) + '. Not a test of your accounts or settings. ', el('a', { href: '/stack-check/atlas/' }, 'See the knowledge base'), '.'))
  }

  function renderSuggestion(r) {
    const s = document.getElementById('ar-suggest')
    if (!s) return
    const g = M.suggestRisk(r, safeProfile())
    s.textContent = 'Our suggestion: ' + M.label('risk', g.level) + (g.why.length ? ', because ' + g.why.join(' and ') + '.' : ', because none of the usual triggers apply.') + " The government's AI screening tool gives the formal result."
  }

  function buildForm(r) {
    const form = $('ar-form')
    form.textContent = ''
    form.className = 'ar-form'
    const id = r.id
    const n = note(id)
    const kb = state.kb
    const isAgent = r.kind === 'agent'

    // Device-only text first, clearly marked.
    const device = el('div', { class: 'ar-device' },
      el('p', {}, el('strong', {}, 'Kept on this device only. '), notesPersist()
        ? 'What you type here stays in this browser. It never goes into your saved profile, your account or the AI BOM.'
        : 'What you type here lasts until you close this page. It never goes into your saved profile, your account or the AI BOM. Keep your stack on this device or in an account to keep these notes on this device.'),
      isAgent ? textField('text', 'Agent name', n.name, v => changeNote(id, 'name', v), 'A short name your team uses, up to 60 characters.', M.NAME_MAX) : null,
      textField('area', 'Purpose and business goals', n.purpose, v => changeNote(id, 'purpose', v), 'Why this ' + (isAgent ? 'agent' : 'tool') + ' exists and what it aims to achieve. Leave out personal details.', M.NOTE_MAX),
      textField('area', 'Notes', n.notes, v => changeNote(id, 'notes', v), 'Anything else for your own copy. Included in the CSV, left out of the AI BOM.', M.NOTE_MAX))

    const basics = el('div', { class: 'ar-group' }, el('h3', {}, isAgent ? 'About this agent' : 'About this tool'), el('div', { class: 'ar-grid' },
      select('status', 'Status', r.status, opts('status'), v => change(id, x => { x.status = v })),
      select('owner', 'Business owner (a role)', r.owner, opts('owner', 'Choose a role'), v => change(id, x => { x.owner = v }), 'The role accountable for this ' + (isAgent ? 'agent' : 'tool') + '. Add the person in your own copy.'),
      !isAgent && r.platform && kb.routesByPlatform.has(r.platform)
        ? select('route', 'Hosting route', r.route, [{ id: '', label: 'Not sure or another route' }].concat(kb.routesByPlatform.get(r.platform).map(x => ({ id: x.id, label: x.name }))), v => change(id, x => { x.route = v }), 'The route decides where your data is stored and processed.')
        : null,
      !isAgent ? select('account', 'Account type', r.account, opts('account'), v => change(id, x => { x.account = v })) : null,
      dateField('registered', 'Registered date', r.registered, v => change(id, x => { x.registered = v })),
      dateField('review', 'Review by', r.review, v => change(id, x => { x.review = v }))))

    let agent = null
    if (isAgent) {
      const a = r.agent
      const inRegister = Array.from(new Set(state.answers.rows.filter(x => x.kind === 'tool' && x.platform).map(x => x.platform)))
      const platformOpts = [{ id: '', label: 'Choose a platform' }]
      if (inRegister.length) platformOpts.push({ group: 'In your register', options: inRegister.map(p => ({ id: p, label: M.platformName(kb, p) || p })) })
      const others = [...kb.platforms.values()].filter(p => !inRegister.includes(p.id)).sort((x, y) => x.name.localeCompare(y.name))
      if (others.length) platformOpts.push({ group: 'Other platforms in our knowledge base', options: others.map(p => ({ id: p.id, label: p.name })) })
      agent = el('div', { class: 'ar-group' }, el('h3', {}, 'How the agent works'), el('div', { class: 'ar-grid' },
        select('role', 'What it does', a.role, opts('agentRole', 'Choose a job'), v => change(id, x => { x.agent.role = v })),
        select('source', 'Who built it', a.source, opts('agentSource'), v => change(id, x => { x.agent.source = v })),
        select('runs', 'Platform it runs on', a.runs_on, platformOpts, v => change(id, x => { x.agent.runs_on = v })),
        select('identity', 'Identity it acts under', a.identity, opts('identity'), v => change(id, x => { x.agent.identity = v })),
        select('oversight', 'Human oversight', a.oversight, opts('oversight', 'Choose one'), v => change(id, x => { x.agent.oversight = v }))),
        checks('tools', 'Tools and systems it can call', a.tools, v => change(id, x => { x.agent.tools = v })))
    }

    const use = el('div', { class: 'ar-group' }, el('h3', {}, 'Use'),
      checks('uses', 'Intended use cases', r.uses, v => change(id, x => { x.uses = v })),
      checks('users', 'Who uses it', r.users, v => change(id, x => { x.users = v })))
    const data = el('div', { class: 'ar-group' }, el('h3', {}, 'Data'),
      checks('data', 'Data it touches', r.data, v => change(id, x => { x.data = v })),
      checks('dtypes', 'Data types', r.dtypes, v => change(id, x => { x.dtypes = v })))
    const risk = el('div', { class: 'ar-group' }, el('h3', {}, 'Risk'),
      checks('affected', 'Key stakeholders affected', r.affected, v => change(id, x => { x.affected = v })),
      checks('limits', 'Known limitations and prohibited use', r.limits, v => change(id, x => { x.limits = v })),
      checks('misuse', 'Foreseeable misuse', r.misuse, v => change(id, x => { x.misuse = v })),
      select('risk', 'Screening outcome', r.risk, opts('risk', 'Not set'), v => change(id, x => { x.risk = v })),
      el('p', { class: 'ar-suggest', id: 'ar-suggest', 'aria-live': 'polite' }))

    form.append(device, basics, agent, use, data, risk,
      el('div', { class: 'ar-actions' },
        el('button', { type: 'button', class: 'rc-button', onclick: () => closeEditor(true) }, 'Done'),
        el('button', { type: 'button', class: 'ar-secondary', onclick: () => removeRow(id) }, 'Remove this row')))
    renderSuggestion(r)
  }

  // ---------- downloads ----------
  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }))
    const a = el('a', { href: url, download: name })
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }
  function needRows() {
    if (state.answers.rows.length) return true
    status('Add at least one row first.')
    return false
  }
  function downloadCsv() {
    if (!needRows()) return
    saveNotes()
    download('ai-register-' + M.today() + '.csv', M.toCsv(state.answers.rows, state.notes, state.kb), 'text/csv;charset=utf-8')
    status('CSV downloaded. It holds your purpose notes, so store it where your team keeps internal records.', true)
  }
  async function downloadBom() {
    if (!needRows()) return
    const btn = $('ar-bom')
    btn.disabled = true
    const citations = {}
    const ids = Array.from(new Set(state.answers.rows.map(r => r.platform).filter(p => p && state.kb.platforms.has(p))))
    await Promise.all(ids.map(async id => {
      try {
        const res = await fetch(CELLS_URL(id), { credentials: 'same-origin' })
        if (!res.ok) return
        const detail = await res.json()
        const cell = detail && detail.cells && detail.cells['c6-10']
        citations[id] = ((cell && cell.citations) || []).slice(0, 2).map(c => ({ url: c.url, title: c.title }))
      } catch (e) { /* the BOM is still valid without links */ }
    }))
    const profile = safeProfile() || {}
    // Agent names are typed text, so the BOM names agents by their job instead.
    const bom = M.toBom(state.answers.rows, {}, state.kb, { label: profile.label, residencyNeed: profile.context && profile.context.residency_need, citations })
    download('ai-bom-' + M.today() + '.cdx.json', JSON.stringify(bom, null, 2) + '\n', 'application/vnd.cyclonedx+json')
    btn.disabled = false
    status('AI BOM downloaded. It is a vendor-level inventory in CycloneDX 1.6 JSON.', true)
  }

  // ---------- start ----------
  async function loadJson(url) {
    const res = await fetch(url, { credentials: 'same-origin' })
    if (!res.ok) throw new Error(url + ' ' + res.status)
    return res.json()
  }
  function readAnswers() {
    let a = null
    try { a = P.getAnswers(M.TOOL_ID) } catch (e) { a = null }
    state.answers = M.cleanAnswers(a, state.kb)
  }
  function prefill() {
    const added = M.rowsFromStack(safeProfile(), state.answers, state.kb)
    if (!added.length) return
    state.answers.rows.push(...added.slice(0, M.MAX_ROWS - state.answers.rows.length))
    save()
    const msg = $('ar-prefill-note')
    msg.hidden = false
    msg.textContent = 'We added ' + plural(added.length, 'tool') + ' from your AI setup. Check each row and set its owner, purpose and screening outcome.'
  }
  function mountBar() {
    const host = $('ar-profile-bar')
    try {
      const bar = window.MWProfileBar
      // profile-bar.js mounts every [data-mw-profile-bar] itself. mount() is idempotent, so this only covers a late load.
      if (bar && typeof bar.mount === 'function') bar.mount(host)
    } catch (e) { /* the page works without the bar */ }
    if (P.fallback) $('ar-fallback-note').hidden = false
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!M || !P) { status('The register could not start. Reload the page to try again.'); return }
    mountBar()
    $('ar-add-tool').addEventListener('click', openPicker)
    $('ar-add-agent').addEventListener('click', addAgent)
    $('ar-picker-close').addEventListener('click', () => closePicker(true))
    $('ar-search').addEventListener('input', search)
    $('ar-search').addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { const first = $('ar-results').querySelector('.ar-result'); if (first) { e.preventDefault(); first.focus() } }
    })
    $('ar-unlisted-add').addEventListener('click', addUnlisted)
    $('ar-unlisted-name').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addUnlisted() } })
    $('ar-form').addEventListener('submit', e => e.preventDefault())
    $('ar-picker').addEventListener('keydown', e => { if (e.key === 'Escape') closePicker(true) })
    $('ar-editor').addEventListener('keydown', e => { if (e.key === 'Escape' && e.target.tagName !== 'SELECT') closeEditor(true) })
    $('ar-csv').addEventListener('click', downloadCsv)
    $('ar-bom').addEventListener('click', downloadBom)
    $('ar-print').addEventListener('click', () => window.print())

    const [index, residency] = await Promise.all([loadJson(INDEX_URL).catch(() => null), loadJson(RESIDENCY_URL).catch(() => null)])
    state.kb = M.buildKb(index, residency)
    if (!index) status('Our knowledge base did not load, so vendor facts are missing. You can still add tools by name and download the CSV.')
    else $('ar-banner-line').textContent = 'Knowledge base updated ' + fmtDate(state.kb.asAt) + '. Vendor facts come from vendor documentation, not a test of your setup.'

    // Wait for the library to restore the stack from this device or the account before reading it.
    try { if (P.ready && typeof P.ready.then === 'function') await P.ready } catch (e) { /* read whatever is there */ }
    mountBar()
    state.notes = loadNotes()
    readAnswers()
    prefill()
    render()

    P.onChange(() => {
      if (state.saving) return
      // Another tab, an upload or a sign-in changed the stack. Re-read and keep typed notes as they are.
      const wasEditing = state.editing
      readAnswers()
      const fresh = loadNotes()
      for (const k of Object.keys(fresh)) if (!state.notes[k]) state.notes[k] = fresh[k]
      saveNotes()
      prefill()
      render()
      if (wasEditing && row(wasEditing)) { renderFacts(row(wasEditing)); buildForm(row(wasEditing)) }
      else if (wasEditing) closeEditor(false)
      if (P.fallback) $('ar-fallback-note').hidden = false
    })
  })
})()
