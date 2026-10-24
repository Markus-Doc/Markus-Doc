'use strict'

// /my-stack/: view and edit the shared stack profile. Every change goes through window.MWProfile, which keeps
// it where the user chose (memory, this browser, or their account). The page reads the platform list from the
// AI Stack Check's published knowledge base at /stack-check/data/index.json. It builds DOM nodes only.
;(function () {
  const $ = id => document.getElementById(id)
  const P = window.MWProfile
  const kb = { platforms: {}, list: [], groups: {}, capabilities: 0, loaded: false }

  const MODE = {
    memory: ['Not saved yet', 'Gone when you close this page.'],
    device: ['In this browser', 'Lost if you clear browser data or change device.'],
    account: ['In your account', 'Follows you to every tool and device.']
  }
  const STATUS = [['', 'Status not set'], ['in-use', 'In use'], ['trialling', 'Trialling'], ['planned', 'Planned']]
  const ACCOUNT = [['', 'Plan not set'], ['personal', 'Personal plans'], ['business', 'Business plan'], ['enterprise', 'Enterprise plan'], ['api', 'API or cloud account'], ['unsure', 'Not sure']]

  const CONTEXT = [
    { id: 'uses_ai', type: 'one', legend: 'How does your business use AI?', options: [
      ['none', 'We do not use AI tools'], ['off-the-shelf', 'Staff use AI products we buy or subscribe to'], ['builds', 'We build or deploy our own AI features, apps or agents']] },
    { id: 'ai_capabilities', type: 'many', legend: 'What do your AI tools do? Choose all that apply.', options: [
      ['text-generation', 'Write or summarise text'], ['voice-generation', 'Listen to or produce speech'], ['image-generation', 'Create images or video'],
      ['code-generation', 'Write code'], ['automation', 'Take actions through tools or other systems (agents)'], ['externally-facing', 'Talk directly to customers or the public']] },
    { id: 'chat_only', type: 'bool', legend: 'Chat assistants only', label: 'We only use chat assistants, with no agents or automations' },
    { id: 'ai_decisions_about_people', type: 'one', legend: 'Does AI make, or help make, decisions that significantly affect people?', options: [
      ['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']] },
    { id: 'data_sensitivity', type: 'one', legend: 'What is the most sensitive information that goes into your AI tools?', options: [
      ['public', 'Only public information'], ['internal', 'Internal business information'], ['personal', 'Personal information about customers or staff'],
      ['sensitive', 'Sensitive information, such as health, financial or government identifiers'], ['unsure', 'Not sure']] },
    { id: 'residency_need', type: 'one', legend: 'Where does your data need to stay?', options: [
      ['none', 'No requirement'], ['stored', 'Stored in Australia'], ['processed', 'Stored and processed in Australia'],
      ['sovereign', 'Sovereign: stored and processed in Australia by an Australian operator'], ['unsure', 'Not sure']] },
    { id: 'personal_accounts', type: 'one', legend: 'Do staff use personal AI accounts for work?', options: [
      ['none', 'No'], ['some', 'Some do'], ['most', 'Most do'], ['unsure', 'Not sure']] },
    { id: 'regulated', type: 'bool', legend: 'Regulated sector', label: 'We are regulated, for example by APRA, as a health service or as a government supplier' }
  ]
  const BUSINESS = [
    { id: 'sector', type: 'select', legend: 'Sector', options: [
      ['professional-services', 'Accounting, legal or other professional services'], ['health', 'Health care'], ['aged-care', 'Aged care'],
      ['disability', 'Disability services (NDIS)'], ['education', 'Education or training'], ['financial-services', 'Banking, insurance, super or other financial services'],
      ['software', 'Software, cloud or IT services'], ['retail', 'Retail or e-commerce'], ['energy-utilities', 'Energy, water or other utilities'],
      ['telecommunications', 'Telecommunications'], ['manufacturing', 'Manufacturing'], ['other', 'Something else']] },
    { id: 'entity_type', type: 'select', legend: 'Kind of organisation', options: [
      ['private-business', 'A private business'], ['not-for-profit', 'A not-for-profit or charity'], ['government-body', 'A government body']] },
    { id: 'turnover', type: 'select', legend: 'Annual turnover', options: [
      ['up-to-3m', '$3 million or less'], ['over-3m-to-10m', 'More than $3 million, up to $10 million'], ['over-10m-to-50m', 'More than $10 million, up to $50 million'],
      ['over-50m', 'More than $50 million'], ['unsure', 'Not sure']] },
    { id: 'headcount', type: 'select', legend: 'People who work in the business', options: [['1-19', '1 to 19'], ['20-199', '20 to 199'], ['200-plus', '200 or more']] },
    { id: 'states', type: 'many', legend: 'States and territories you operate in', options: [
      ['nsw', 'NSW'], ['vic', 'Victoria'], ['qld', 'Queensland'], ['wa', 'Western Australia'], ['sa', 'South Australia'], ['tas', 'Tasmania'], ['act', 'ACT'], ['nt', 'Northern Territory']] }
  ]

  function el(tag, attrs, children) {
    const node = document.createElement(tag)
    for (const k of Object.keys(attrs || {})) {
      const v = attrs[k]
      if (v === null || v === undefined || v === false) continue
      if (k === 'text') node.textContent = v
      else if (k === 'on') for (const ev of Object.keys(v)) node.addEventListener(ev, v[ev])
      else if (k === 'checked' || k === 'selected') node[k] = !!v
      else node.setAttribute(k, v === true ? '' : String(v))
    }
    for (const c of children || []) if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c)
    return node
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many) }
  function say(node, text, isError) {
    node.textContent = text || ''
    node.classList.toggle('is-error', !!isError)
  }
  function status(text) { $('ms-status').textContent = text || '' }

  // Re-rendering replaces nodes, so keep focus on the control with the same id.
  function keepFocus(fn) {
    const active = document.activeElement
    const id = active && active.id
    fn()
    if (id && document.activeElement !== active) {
      const again = document.getElementById(id)
      if (again) again.focus()
    }
  }

  function edit(fn) {
    try { P.update(fn) } catch (e) { status(e.message) }
  }

  function platformName(id) { return kb.platforms[id] ? kb.platforms[id].name : id }
  function groupName(id) { const p = kb.platforms[id]; return p && kb.groups[p.group_id] ? kb.groups[p.group_id] : '' }

  // ---- Save options

  function renderMode() {
    const mode = P.mode()
    const s = P.account.status()
    $('ms-mode').textContent = s.state === 'checking' ? 'Checking your account' : MODE[mode][0]
    $('ms-mode-help').textContent = MODE[mode][1]
    const inAccount = mode === 'account'
    const draft = accountsDraft()
    $('ms-signed-in').hidden = !inAccount
    $('ms-signed-out').hidden = inAccount || draft
    $('ms-draft').hidden = inAccount || !draft
    $('ms-email').textContent = s.email || 'your account'
    $('ms-sync-state').textContent = s.saving ? 'Saving.' : s.error ? s.error : s.lastSync ? 'Saved.' : ''
    const device = $('ms-device')
    device.setAttribute('aria-pressed', String(mode === 'device'))
    device.textContent = mode === 'device' ? 'Remove from this browser' : 'Keep in this browser'
    device.disabled = inAccount
    say($('ms-device-msg'), inAccount ? 'Saved to your account, so we do not also keep it here.' : '')
  }

  function authForm(formId, action) {
    const form = $(formId)
    const msg = form.querySelector('.ms-form-msg')
    form.addEventListener('submit', e => {
      e.preventDefault()
      const email = form.elements.email.value.trim()
      const password = form.elements.password.value
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say(msg, 'Enter a valid email address.', true); form.elements.email.focus(); return }
      if (action === 'signUp' && password.length < 10) { say(msg, 'Use a password of at least 10 characters.', true); form.elements.password.focus(); return }
      if (!password) { say(msg, 'Enter your password.', true); form.elements.password.focus(); return }
      const button = form.querySelector('button[type=submit]')
      button.disabled = true
      say(msg, action === 'signUp' ? 'Creating your account.' : 'Signing you in.')
      P.account[action](email, password).then(() => {
        form.reset()
        say(msg, '')
        status('')
        showAuth(null)
        $('ms-signout').focus()
      }).catch(err => say(msg, err.message, true)).finally(() => { button.disabled = false })
    })
  }

  // Accounts are off (greyed out with a Draft tag) on the live site until ACCOUNTS_LIVE is switched on in profile.js.
  function accountsDraft() { return !!(P.account && (P.account.draft === true || P.account.available === false)) }

  // The sign-up and sign-in forms stay folded until one of the two buttons opens them. A second press folds it.
  function showAuth(which) {
    const signup = which === 'signup'
    const signin = which === 'signin'
    $('ms-signup-form').hidden = !signup
    $('ms-signin-form').hidden = !signin
    $('ms-concept').hidden = !signup && !signin
    $('ms-show-signup').setAttribute('aria-expanded', String(signup))
    $('ms-show-signin').setAttribute('aria-expanded', String(signin))
  }
  function toggleAuth(which, focusId) {
    const open = $('ms-show-' + which).getAttribute('aria-expanded') === 'true'
    showAuth(open ? null : which)
    if (!open) $(focusId).focus()
  }

  function wireSave() {
    $('ms-show-signup').addEventListener('click', () => toggleAuth('signup', 'ms-signup-email'))
    $('ms-show-signin').addEventListener('click', () => toggleAuth('signin', 'ms-signin-email'))
    authForm('ms-signup-form', 'signUp')
    authForm('ms-signin-form', 'signIn')
    $('ms-signout').addEventListener('click', () => {
      P.account.signOut().then(() => { status(''); $('ms-show-signin').focus() }).catch(e => status(e.message))
    })
    $('ms-sync').addEventListener('click', () => { P.account.sync().catch(e => status(e.message)) })
    $('ms-download').addEventListener('click', () => {
      try { P.download(); say($('ms-file-msg'), 'Saved stack-profile.json to your downloads.') } catch (e) { say($('ms-file-msg'), e.message, true) }
    })
    $('ms-upload').addEventListener('click', () => $('ms-upload-file').click())
    $('ms-upload-file').addEventListener('change', e => {
      const f = e.target.files && e.target.files[0]
      e.target.value = ''
      if (!f) return
      P.upload(f).then(r => say($('ms-file-msg'), 'Loaded your list' + (r.dropped.length ? '. We left out ' + plural(r.dropped.length, 'entry', 'entries') + ' we could not use.' : '.')))
        .catch(err => say($('ms-file-msg'), err.message, true))
    })
    $('ms-device').addEventListener('click', () => {
      const on = P.mode() === 'device'
      P.setMode(on ? 'memory' : 'device')
        .then(m => say($('ms-device-msg'), m === 'device' ? 'Kept in this browser.' : 'Removed from this browser. It stays on this page until you close it.'))
        .catch(e => say($('ms-device-msg'), e.message, true))
    })
    $('ms-clear').addEventListener('click', () => {
      if (!window.confirm('Clear your list? This removes every platform and answer from where it is saved.')) return
      try { P.clear(); status('') } catch (e) { status(e.message) }
    })
    $('ms-draft-tag').hidden = !accountsDraft()
    $('account').classList.toggle('is-draft', accountsDraft())
    if (!accountsDraft() && window.location.hash === '#account') showAuth('signup')
  }

  // ---- Platforms

  function renderResults() {
    const q = $('ms-find').value.trim().toLowerCase()
    const list = $('ms-results')
    list.replaceChildren()
    if (q.length < 2) return
    if (!kb.loaded) {
      list.appendChild(el('li', { class: 'ms-note', text: 'The platform list has not loaded. You can still add a tool by name below.' }))
      return
    }
    const have = P.get().stack.platforms.map(p => p.id)
    // Names, ids and common product words (Claude, ChatGPT, Copilot) through the shared helper, best match first.
    const found = typeof P.searchPlatforms === 'function' ? P.searchPlatforms(q, kb.list)
      : kb.list.filter(p => p.name.toLowerCase().indexOf(q) !== -1 || p.id.indexOf(q) !== -1)
    const hits = found.filter(p => have.indexOf(p.id) === -1).slice(0, 10)
    if (!hits.length) {
      list.appendChild(el('li', { class: 'ms-note', text: 'No platform matches "' + q + '". Add it by name under "Tools we do not cover yet".' }))
      return
    }
    for (const p of hits) {
      list.appendChild(el('li', {}, [
        el('span', { class: 'ms-result-name' }, [
          el('strong', { text: p.name }),
          el('span', { class: 'ms-hint', text: (kb.groups[p.group_id] || '') + (p.checked ? '' : '. Listed, not yet checked in depth') })
        ]),
        el('button', { type: 'button', class: 'rc-secondary', 'aria-label': 'Add ' + p.name, text: 'Add', on: { click: () => {
          edit(d => { d.stack.platforms.push({ id: p.id, status: 'in-use' }) })
          status('')
          $('ms-find').focus()
        } } })
      ]))
    }
  }

  function selectFor(id, field, choices, value, label) {
    const sel = el('select', { id: 'ms-' + field + '-' + id, 'aria-label': label, on: { change: e => {
      const v = e.target.value
      edit(d => {
        const item = d.stack.platforms.find(x => x.id === id)
        if (!item) return
        if (v) item[field] = v
        else delete item[field]
      })
    } } })
    for (const [v, text] of choices) sel.appendChild(el('option', { value: v, text: text, selected: v === (value || '') }))
    return sel
  }

  function renderPlatforms(p) {
    const list = $('ms-platforms')
    list.replaceChildren()
    const items = p.stack.platforms
    $('ms-empty').hidden = items.length > 0
    $('ms-count').textContent = items.length ? '(' + items.length + ')' : ''
    items.forEach((item, i) => {
      const name = platformName(item.id)
      list.appendChild(el('li', { class: 'ms-platform' }, [
        el('div', { class: 'ms-platform-name' }, [
          el('strong', { text: name }),
          el('span', { class: 'ms-hint', text: groupName(item.id) || (kb.loaded && !kb.platforms[item.id] ? 'Not in the current knowledge base' : '') })
        ]),
        selectFor(item.id, 'status', STATUS, item.status, 'Status of ' + name),
        selectFor(item.id, 'account', ACCOUNT, item.account, 'Plan for ' + name),
        el('button', { type: 'button', class: 'rc-link', id: 'ms-remove-' + item.id, 'aria-label': 'Remove ' + name, text: 'Remove', on: { click: () => {
          edit(d => { d.stack.platforms = d.stack.platforms.filter(x => x.id !== item.id) })
          const next = document.getElementById('ms-remove-' + (items[i + 1] || items[i - 1] || {}).id)
          if (next) next.focus()
          else $('ms-find').focus()
        } } })
      ]))
    })
  }

  function renderUnlisted(p) {
    const list = $('ms-unlisted-list')
    list.replaceChildren()
    for (const name of p.stack.unlisted) {
      list.appendChild(el('li', {}, [
        el('span', { text: name }),
        el('button', { type: 'button', class: 'ms-chip-remove', 'aria-label': 'Remove ' + name, text: 'Remove', on: { click: () => {
          edit(d => { d.stack.unlisted = d.stack.unlisted.filter(x => x !== name) })
          $('ms-unlisted').focus()
        } } })
      ]))
    }
  }

  function wireUnlisted() {
    const form = $('ms-unlisted-form')
    const msg = form.querySelector('.ms-form-msg')
    form.addEventListener('submit', e => {
      e.preventDefault()
      const input = $('ms-unlisted')
      const name = input.value.trim()
      if (!name) { say(msg, 'Type the name of the tool first.', true); return }
      const before = P.get().stack.unlisted.length
      if (before >= P.LIMITS.unlisted) { say(msg, 'You can add up to ' + P.LIMITS.unlisted + ' tools by name.', true); return }
      edit(d => { d.stack.unlisted.push(name) })
      const after = P.get().stack.unlisted
      if (after.length === before) say(msg, after.some(x => x.toLowerCase() === name.toLowerCase()) ? 'That tool is already on your list.' : 'We could not add that. Use the product name only.', true)
      else { say(msg, 'Added ' + after[after.length - 1] + '.'); input.value = '' }
    })
  }

  // ---- Shared questions and business facts

  function fieldControl(section, f, value) {
    const name = 'ms-' + f.id
    if (f.type === 'select') {
      const sel = el('select', { id: name, on: { change: e => edit(d => { if (e.target.value) d[section][f.id] = e.target.value; else delete d[section][f.id] }) } })
      sel.appendChild(el('option', { value: '', text: 'Not answered' }))
      for (const [v, text] of f.options) sel.appendChild(el('option', { value: v, text: text, selected: v === value }))
      return el('div', { class: 'ms-field' }, [el('label', { for: name, text: f.legend }), sel])
    }
    if (f.type === 'bool') {
      return el('fieldset', { class: 'ms-fieldset' }, [
        el('legend', { class: 'visually-hidden', text: f.legend }),
        el('label', { class: 'ms-check' }, [
          el('input', { type: 'checkbox', id: name, checked: value === true, on: { change: e => edit(d => { if (e.target.checked) d[section][f.id] = true; else delete d[section][f.id] }) } }),
          el('span', { text: f.label })
        ])
      ])
    }
    const many = f.type === 'many'
    const set = el('fieldset', { class: 'ms-fieldset' }, [el('legend', { text: f.legend })])
    const box = el('div', { class: 'ms-choices' + (many ? ' ms-choices--many' : '') })
    for (const [v, text] of f.options) {
      const checked = many ? Array.isArray(value) && value.indexOf(v) !== -1 : value === v
      box.appendChild(el('label', { class: 'ms-check' }, [
        el('input', { type: many ? 'checkbox' : 'radio', name: name, id: name + '-' + v, value: v, checked: checked, on: { change: e => edit(d => {
          if (many) {
            const list = Array.isArray(d[section][f.id]) ? d[section][f.id].filter(x => x !== v) : []
            if (e.target.checked) list.push(v)
            if (list.length) d[section][f.id] = list
            else delete d[section][f.id]
          } else {
            d[section][f.id] = v
            if (f.id === 'uses_ai') { if (v === 'builds') d.context.builds = true; else delete d.context.builds }
          }
        }) } }),
        el('span', { text: text })
      ]))
    }
    set.appendChild(box)
    if (!many) {
      set.appendChild(el('button', { type: 'button', class: 'rc-link ms-clear-answer', id: name + '-clear', hidden: value === undefined, text: 'Clear this answer',
        on: { click: () => { edit(d => { delete d[section][f.id]; if (f.id === 'uses_ai') delete d.context.builds }); const first = document.getElementById(name + '-' + f.options[0][0]); if (first) first.focus() } } }))
    }
    return set
  }

  function renderFields(p) {
    const ctx = $('ms-context-fields')
    ctx.replaceChildren(...CONTEXT.map(f => fieldControl('context', f, p.context[f.id])))
    const biz = $('ms-business-fields')
    biz.replaceChildren(...BUSINESS.map(f => fieldControl('business', f, p.business[f.id])))
    const label = $('ms-label')
    if (document.activeElement !== label) label.value = p.label || ''
  }

  // ---- Tools and what applies

  function personalPlanCount(p) {
    return p.stack.platforms.filter(x => {
      const k = kb.platforms[x.id]
      return k && k.procurement && Array.isArray(k.procurement.account_types) && k.procurement.account_types.indexOf('personal') !== -1
    }).length
  }

  function renderTools(p) {
    const ids = p.stack.platforms.map(x => x.id)
    const checked = ids.filter(id => kb.platforms[id] && kb.platforms[id].checked)
    const others = p.stack.unlisted.length
    const bizAnswered = Object.keys(p.business).length
    const stackLink = 'https://checkableai.com/stack-check/' + (checked.length ? '#stack=' + checked.slice(0, 8).join(',') : '')
    const tools = [
      { name: 'AI Stack Check', href: stackLink, what: checked.length
        ? 'Checks ' + (checked.length === 1 ? 'your 1 platform' : checked.length + ' of your platforms') + ' against ' + (kb.capabilities || 'our') + ' controls' + (checked.length > 8 ? '. The link carries the first 8.' : '.')
        : 'Add a platform from the knowledge base to check it.' },
      { name: 'AU Frameworks Check', href: 'https://checkableai.com/readiness-check/', what: bizAnswered || p.context.uses_ai
        ? 'Starts from your business details (' + bizAnswered + ' of 5 answered) and how you use AI.'
        : 'Answer "About your business" above and it starts from those.' },
      { name: 'Stack pack', href: '/stack-pack/', what: ids.length
        ? (ids.length === 1 ? 'One printable page for your platform' : 'One printable page for each of your ' + ids.length + ' platforms') + ', with the questions to ask each vendor.'
        : 'Add platforms to get one page for each.' },
      { name: 'AI register', href: '/ai-register/', what: ids.length + others
        ? 'Starts with ' + plural(ids.length + others, 'row', 'rows') + ', one for each platform and tool you listed.'
        : 'Add platforms and tools to pre-fill your register.' },
      { name: 'Shadow AI check', href: '/shadow-ai/', what: (() => {
        const n = personalPlanCount(p)
        const answer = p.context.personal_accounts
        const lead = n ? plural(n, 'of your platforms sells', 'of your platforms sell') + ' personal plans staff can sign up for themselves.' : 'Looks at personal AI accounts staff use for work.'
        return lead + (answer ? '' : ' Answer the personal accounts question above to start from it.')
      })() }
    ]
    const list = $('ms-tools')
    list.replaceChildren(...tools.map(t => el('li', { class: 'ms-tool' }, [
      el('h3', {}, [el('a', { href: t.href, text: t.name })]),
      el('p', { text: t.what })
    ])))
  }

  // ---- Wiring

  function render() {
    const p = P.get()
    keepFocus(() => {
      renderMode()
      renderPlatforms(p)
      renderUnlisted(p)
      renderFields(p)
      renderTools(p)
      renderResults()
    })
    const from = P.migratedFrom()
    const note = $('ms-migrated')
    if (from.length) {
      const names = from.map(k => k === 'readiness-check-progress-v1' ? 'the AU Frameworks Check' : k === '#stack' ? 'the link you followed' : 'the agent controls self-assessment')
      note.textContent = 'We started your list from answers you gave ' + names.join(' and ') + ' in this browser. Check it, then keep it.'
      note.hidden = false
    }
  }

  async function loadKb() {
    const url = document.getElementById('main').dataset.index
    try {
      const res = await fetch(url, { credentials: 'same-origin' })
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()
      for (const g of data.groups || []) kb.groups[g.id] = g.name
      for (const p of data.platforms || []) { kb.platforms[p.id] = Object.assign({ checked: true }, p); kb.list.push(kb.platforms[p.id]) }
      for (const p of data.more_platforms || []) if (!kb.platforms[p.id]) { kb.platforms[p.id] = Object.assign({ checked: false }, p); kb.list.push(kb.platforms[p.id]) }
      kb.capabilities = Array.isArray(data.capabilities) ? data.capabilities.length : 0
      kb.loaded = true
    } catch (e) {
      status('We could not load the platform list from the knowledge base. Your list is safe, and you can still add tools by name.')
    }
  }

  function start() {
    if (!P || !P.real) { status('The profile library did not load, so this page cannot work. Please reload.'); return }
    wireSave()
    wireUnlisted()
    $('ms-find').addEventListener('input', renderResults)
    $('ms-label').addEventListener('change', e => {
      const typed = e.target.value.trim()
      edit(d => { d.label = typed })
      if (typed && !P.get().label) status('We left the name out because it looks like an email, phone number or key. Use a short name such as "Our practice".')
    })
    P.onChange(render)
    P.onStatus(renderMode)
    render()
    Promise.all([loadKb(), P.ready]).then(render)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
})()
