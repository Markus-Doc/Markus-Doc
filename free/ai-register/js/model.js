'use strict'

// AI register: the data model, picklists, cleaning, KB facts, CSV and the CycloneDX 1.6 AI BOM.
// Pure functions with no DOM, so the page and the Node test in tests/ use the same code.
// Rows hold picklist ids, KB ids and dates only. Free text (purpose, notes, an agent's typed name)
// lives in a separate notes map that never goes into the stack profile.
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory()
  else root.ARModel = factory()
})(typeof self !== 'undefined' ? self : this, function () {
  const TOOL_ID = 'ai-register'
  const ANSWERS_VERSION = 'register-1'
  const BUILD = '2026.10.22'
  const MAX_ROWS = 60   // the profile library caps each tool's answers at 16 KB
  const NAME_MAX = 60
  const NOTE_MAX = 600

  // Columns of the Australian Government AI register template (National AI Centre, Guidance for AI
  // Adoption). Read from the official Excel file AI-register-template.xlsx on ai.gov.au, sheet
  // "Template", on 22 Oct 2026. Status and Screening outcome use the template's own dropdown values.
  const TEMPLATE_COLUMNS = [
    'Name and version', 'Owner', 'Status', 'Source', 'Purpose/business goals', 'Intended use case(s)',
    'Known limitations and prohibited use', 'Any foreseeable misuse', 'Data sources and type',
    'Registered date', 'Screening outcome', 'Key stakeholders affected'
  ]

  function list(pairs) { return pairs.map(p => ({ id: p[0], label: p[1] })) }

  const PICK = {
    kind: list([['tool', 'AI tool'], ['agent', 'AI agent']]),
    status: list([['pilot', 'Pilot'], ['operational', 'Operational'], ['decommissioned', 'Decommissioned']]),
    risk: list([['normal', 'Normal'], ['elevated', 'Elevated'], ['unacceptable', 'Unacceptable']]),
    owner: list([
      ['business-owner', 'Business owner or director'], ['general-manager', 'General manager or CEO'],
      ['operations', 'Operations manager'], ['it', 'IT manager or provider'], ['finance', 'Finance manager'],
      ['marketing', 'Marketing lead'], ['sales', 'Sales lead'], ['customer-service', 'Customer service lead'],
      ['hr', 'People and culture lead'], ['practice', 'Practice manager'], ['product', 'Product or engineering lead'],
      ['privacy', 'Privacy or risk officer'], ['other-role', 'Another role']
    ]),
    uses: list([
      ['writing', 'Drafting and editing text'], ['research', 'Research and summaries'],
      ['meetings', 'Meeting notes and transcripts'], ['customer-service', 'Answering customer questions'],
      ['marketing', 'Marketing content and images'], ['coding', 'Writing or reviewing code'],
      ['data-analysis', 'Analysing data and reports'], ['documents', 'Reading and extracting from documents'],
      ['knowledge', 'Searching internal knowledge'], ['automation', 'Automating workflows'],
      ['scheduling', 'Scheduling and email triage'], ['recruitment', 'Recruitment and staff matters'],
      ['decisions', 'Recommending or making decisions about people'], ['security', 'Security monitoring'],
      ['other-use', 'Another use']
    ]),
    data: list([
      ['public', 'Public information'], ['internal', 'Internal business information'],
      ['confidential', 'Business confidential (contracts, pricing, IP)'], ['client', 'Client or customer records'],
      ['personal', 'Personal information'], ['sensitive', 'Sensitive information (health, biometric and the like)'],
      ['financial', 'Financial or payment details'], ['employee', 'Staff records'], ['code', 'Source code'],
      ['credentials', 'Passwords, keys or security data']
    ]),
    dtypes: list([
      ['text', 'Text'], ['documents', 'Documents and files'], ['structured', 'Structured data'],
      ['images', 'Images or video'], ['audio', 'Audio'], ['code', 'Code']
    ]),
    users: list([
      ['all-staff', 'All staff'], ['one-team', 'One team'], ['named-roles', 'A few named roles'],
      ['developers', 'Developers'], ['contractors', 'Contractors'], ['customers', 'Customers or the public']
    ]),
    affected: list([
      ['customers', 'Customers or clients'], ['staff', 'Staff'], ['applicants', 'Job applicants'],
      ['partners', 'Suppliers and partners'], ['public', 'The general public'], ['vulnerable', 'Vulnerable people']
    ]),
    limits: list([
      ['no-personal', 'No personal information'], ['no-sensitive', 'No sensitive information'],
      ['no-client', 'No client confidential material'], ['no-decisions', 'Not for decisions about people'],
      ['no-advice', 'Not for medical, legal or financial advice'], ['human-review', 'A person checks every output before use'],
      ['no-public', 'Not for content published without review'], ['business-account', 'Business accounts only, no personal accounts']
    ]),
    misuse: list([
      ['personal-account', 'Staff using a personal account'], ['paste-personal', 'Pasting personal or client information'],
      ['over-reliance', 'Relying on output without checking'], ['mislead', 'Misleading customers'],
      ['extract', 'Extracting confidential data'], ['unapproved-actions', 'Taking actions nobody approved'],
      ['none-identified', 'None identified']
    ]),
    agentRole: list([
      ['support', 'Customer support'], ['sales', 'Sales and leads'], ['research', 'Research'],
      ['coding', 'Coding'], ['operations', 'Operations and back office'], ['finance', 'Finance and invoicing'],
      ['helpdesk', 'IT help desk'], ['scheduling', 'Scheduling and inbox'], ['other-agent', 'Another job']
    ]),
    agentSource: list([
      ['vendor', 'A vendor product'], ['in-house', 'Built by our team'], ['contractor', 'Built by a contractor']
    ]),
    identity: list([
      ['own-identity', 'Its own identity or service account'], ['user-delegated', "Acts as the person using it"],
      ['shared-key', 'A shared API key or login'], ['unknown', 'Not sure']
    ]),
    tools: list([
      ['email', 'Email'], ['calendar', 'Calendar'], ['files', 'Files and documents'], ['crm', 'CRM'],
      ['accounting', 'Accounting and finance'], ['payments', 'Payments'], ['messaging', 'Chat and messaging'],
      ['web', 'Web browsing'], ['code-repo', 'Code repositories'], ['database', 'Databases'],
      ['tickets', 'Help desk tickets'], ['shell', 'Running commands']
    ]),
    oversight: list([
      ['approve-all', 'A person approves every action'], ['approve-high', 'A person approves high impact actions'],
      ['review-after', 'A person reviews afterwards'], ['none', 'No human oversight']
    ]),
    account: list([
      ['personal', 'Personal plan'], ['business', 'Business or team plan'], ['enterprise', 'Enterprise plan'],
      ['api', 'API or cloud account'], ['unsure', 'Not sure']
    ])
  }

  // The KB controls a register reader cares about most, shown per row and written to the BOM.
  const KEY_CONTROLS = ['c6-1', 'c6-6', 'c6-10', 'c7-1', 'c1-3', 'c4-1']
  const LETTERS = { S: 'Documented', P: 'Partly documented', N: 'Not documented', O: 'Out of scope', U: 'Unresolved', R: 'Not researched' }

  // Model families named by well-known products, for the BOM's model components. Ids are KB platform ids.
  const MODEL_FAMILIES = {
    anthropic: { maker: 'anthropic', name: 'Claude' },
    'claude-code': { maker: 'anthropic', name: 'Claude' },
    openai: { maker: 'openai', name: 'GPT' },
    'openai-codex': { maker: 'openai', name: 'GPT' },
    'google-gemini': { maker: 'google-gemini', name: 'Gemini' },
    'meta-ai-models': { maker: 'meta-ai-models', name: 'Llama' },
    mistral: { maker: 'mistral', name: 'Mistral' },
    cohere: { maker: 'cohere', name: 'Command' },
    'xai-grok': { maker: 'xai-grok', name: 'Grok' },
    deepseek: { maker: 'deepseek', name: 'DeepSeek' },
    'alibaba-qwen': { maker: 'alibaba-qwen', name: 'Qwen' }
  }
  // A route on a cloud platform that names a maker's model in its id.
  const ROUTE_MODEL_HINTS = [[/claude/, 'anthropic'], [/gpt|openai/, 'openai'], [/gemini/, 'google-gemini']]

  const DATA_RANK = ['sensitive', 'personal', 'employee', 'client', 'financial', 'credentials', 'confidential', 'code', 'internal', 'public']

  // ---------- helpers ----------

  function ids(name) { return new Set(PICK[name].map(o => o.id)) }
  function label(name, id) {
    const o = PICK[name].find(x => x.id === id)
    return o ? o.label : ''
  }
  function labels(name, arr) { return (arr || []).map(id => label(name, id)).filter(Boolean) }
  function one(name, v, fallback) { return ids(name).has(v) ? v : fallback }
  function many(name, v) {
    const ok = ids(name)
    return Array.isArray(v) ? Array.from(new Set(v.filter(x => ok.has(x)))) : []
  }
  function isDate(v) { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) }
  function today(now) { return (now || new Date()).toISOString().slice(0, 10) }
  function addMonths(iso, n) {
    const d = new Date(iso + 'T00:00:00Z')
    d.setUTCMonth(d.getUTCMonth() + n)
    return d.toISOString().slice(0, 10)
  }
  function shortName(v) {
    if (typeof v !== 'string') return ''
    return v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX)
  }
  function kbId(v) { return typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,59}$/.test(v) ? v : '' }
  function rowId() { return 'r' + Math.random().toString(36).slice(2, 10) }

  // ---------- KB ----------

  // index: /free/stack-check/data/index.json. residency: /free/stack-check/assets/assessment/residency.json (optional).
  function buildKb(index, residency) {
    const kb = { index: index || null, platforms: new Map(), more: new Map(), groups: new Map(), caps: [], routes: new Map(), routesByPlatform: new Map(), accountTypes: new Map(), procurement: new Map(), asAt: '' }
    if (index) {
      for (const p of index.platforms || []) kb.platforms.set(p.id, p)
      for (const p of index.more_platforms || []) if (!kb.platforms.has(p.id)) kb.more.set(p.id, p)
      for (const g of index.groups || []) kb.groups.set(g.id, g)
      kb.caps = index.capabilities || []
      for (const a of index.procurement_account_types || []) kb.accountTypes.set(a.id, a)
      for (const m of index.procurement_models || []) kb.procurement.set(m.id, m)
      kb.asAt = (index.knowledge && index.knowledge.updated_on) || (index.generated_at || '').slice(0, 10)
      kb.codes = index.verdict_codes || {}
    }
    if (residency) {
      kb.levels = new Map((residency.levels || []).map(l => [l.id, l]))
      for (const r of residency.routes || []) {
        kb.routes.set(r.id, r)
        if (!kb.routesByPlatform.has(r.platform_id)) kb.routesByPlatform.set(r.platform_id, [])
        kb.routesByPlatform.get(r.platform_id).push(r)
      }
    }
    return kb
  }

  function platformName(kb, id) {
    const p = kb.platforms.get(id) || kb.more.get(id)
    return p ? p.name : ''
  }

  function controlLetters(kb, platformId) {
    const code = kb.codes && kb.codes[platformId]
    if (!code) return []
    return KEY_CONTROLS.map(cid => {
      const i = kb.caps.findIndex(c => c.id === cid)
      if (i < 0) return null
      const letter = code.charAt(i) || 'R'
      return { id: cid, name: kb.caps[i].name, letter, meaning: LETTERS[letter] || '' }
    }).filter(Boolean)
  }

  // Region in plain words from a residency route.
  function regionText(route) {
    if (!route) return ''
    const stored = { 'in-australia': 'stored in Australia', 'not-in-australia': 'stored outside Australia' }[route.stored] || 'storage location not confirmed'
    const processed = { australia: 'processed in Australia', 'outside-australia': 'processed outside Australia' }[route.processed] || 'processing location not confirmed'
    const operator = route.operator === 'australian' ? 'Australian operator' : route.operator === 'foreign' ? 'foreign operator' : ''
    return [stored, processed, operator].filter(Boolean).join(', ')
  }

  function kbFacts(row, kb) {
    const p = row.platform ? (kb.platforms.get(row.platform) || kb.more.get(row.platform)) : null
    const f = { covered: false, detail: false, provider: '', group: '', procurement: '', terms: '', route: null, region: '', level: '', controls: [], shadow: false }
    if (!p) return f
    f.covered = true
    f.detail = kb.platforms.has(row.platform)
    f.provider = p.name
    const g = kb.groups.get(p.group_id)
    f.group = g ? g.name : ''
    if (p.procurement) {
      const m = kb.procurement.get(p.procurement.model)
      f.procurement = m ? m.name : ''
      f.shadow = !!p.procurement.shadow_ai
    }
    const acct = kb.accountTypes.get(row.account)
    if (acct) f.terms = acct.controls
    const route = row.route ? kb.routes.get(row.route) : null
    if (route) {
      f.route = route
      f.region = regionText(route)
      const lvl = kb.levels && kb.levels.get(route.level)
      f.level = lvl ? lvl.label : ''
    }
    f.controls = controlLetters(kb, row.platform)
    return f
  }

  // ---------- rows ----------

  function newRow(kind, init, now) {
    const t = today(now)
    const r = {
      id: rowId(), kind: kind === 'agent' ? 'agent' : 'tool', platform: '', route: '', account: 'unsure', unlisted: '',
      uses: [], owner: '', data: [], dtypes: [], users: [], affected: [], limits: [], misuse: [],
      risk: '', status: 'operational', registered: t, review: addMonths(t, 6)
    }
    if (r.kind === 'agent') r.agent = { role: '', source: 'vendor', identity: 'unknown', tools: [], oversight: '', runs_on: '' }
    return Object.assign(r, init || {})
  }

  function cleanRow(r, kb) {
    if (!r || typeof r !== 'object') return null
    const kind = r.kind === 'agent' ? 'agent' : 'tool'
    let platform = kbId(r.platform)
    if (platform && kb && kb.index && !kb.platforms.has(platform) && !kb.more.has(platform)) platform = ''
    let route = kbId(r.route)
    if (route && kb && kb.routes.size && (!kb.routes.has(route) || kb.routes.get(route).platform_id !== platform)) route = ''
    const out = {
      id: typeof r.id === 'string' && /^r[a-z0-9]{4,12}$/.test(r.id) ? r.id : rowId(),
      kind, platform, route,
      account: one('account', r.account === 'unknown' ? 'unsure' : r.account, 'unsure'),
      unlisted: platform ? '' : shortName(r.unlisted),
      uses: many('uses', r.uses), owner: one('owner', r.owner, ''),
      data: many('data', r.data), dtypes: many('dtypes', r.dtypes), users: many('users', r.users),
      affected: many('affected', r.affected), limits: many('limits', r.limits), misuse: many('misuse', r.misuse),
      risk: one('risk', r.risk, ''), status: one('status', r.status, 'operational'),
      registered: isDate(r.registered) ? r.registered : '', review: isDate(r.review) ? r.review : ''
    }
    if (kind === 'agent') {
      const a = r.agent || {}
      out.agent = {
        role: one('agentRole', a.role, ''), source: one('agentSource', a.source, 'vendor'),
        identity: one('identity', a.identity, 'unknown'), tools: many('tools', a.tools),
        oversight: one('oversight', a.oversight, ''), runs_on: kbId(a.runs_on)
      }
    }
    if (kind === 'tool' && !out.platform && !out.unlisted) return null
    return out
  }

  // The register's answers section in the profile: inputs only, no free text beyond KB-style short names.
  function cleanAnswers(a, kb) {
    const rows = []
    if (a && Array.isArray(a.rows)) for (const r of a.rows.slice(0, MAX_ROWS)) { const c = cleanRow(r, kb); if (c) rows.push(c) }
    const dismissed = a && Array.isArray(a.dismissed) ? Array.from(new Set(a.dismissed.map(kbId).filter(Boolean))).slice(0, 200) : []
    return { rows, dismissed }
  }

  // Notes are device-only free text keyed by row id: { purpose, notes, name }.
  function cleanNotes(n) {
    const out = {}
    if (!n || typeof n !== 'object') return out
    for (const k of Object.keys(n)) {
      if (!/^r[a-z0-9]{4,12}$/.test(k)) continue
      const v = n[k] || {}
      out[k] = {
        name: shortName(v.name),
        purpose: typeof v.purpose === 'string' ? v.purpose.slice(0, NOTE_MAX) : '',
        notes: typeof v.notes === 'string' ? v.notes.slice(0, NOTE_MAX) : ''
      }
    }
    return out
  }

  // Profile value sets (MWProfile.ENUMS in /free/tools-shared/profile/profile.js, schema 1.0) mapped onto the
  // register's own picklists. "unsure" adds nothing.
  const SENSITIVITY_TO_DATA = { public: ['public'], internal: ['internal'], personal: ['personal'], sensitive: ['sensitive', 'personal'], unsure: [] }
  const PROFILE_STATUS = { 'in-use': 'operational', trialling: 'pilot', planned: 'pilot' }
  const STATUS_TO_PROFILE = { operational: 'in-use', pilot: 'trialling' }

  // The answers as stored: empty and default fields left out, so more rows fit the profile's size cap.
  function compactAnswers(a) {
    const rows = a.rows.map(r => {
      const o = {}
      for (const [k, v] of Object.entries(r)) {
        if (k === 'agent') {
          const ag = {}
          for (const [ak, av] of Object.entries(v || {})) if (!(Array.isArray(av) ? !av.length : av === '' || (ak === 'identity' && av === 'unknown'))) ag[ak] = av
          o.agent = ag
        } else if (!(Array.isArray(v) ? !v.length : v === '' || (k === 'account' && v === 'unsure'))) o[k] = v
      }
      return o
    })
    return { rows, dismissed: a.dismissed.slice() }
  }
  function answersBytes(a) { return new TextEncoder().encode(JSON.stringify(compactAnswers(a))).length }

  // Rows the profile's stack implies that the register does not have yet.
  function rowsFromStack(profile, answers, kb, now) {
    const out = []
    if (!profile || !profile.stack) return out
    const have = new Set(answers.rows.filter(r => r.kind === 'tool').map(r => r.platform + '|' + r.route))
    const havePlatform = new Set(answers.rows.map(r => r.platform).filter(Boolean))
    const haveUnlisted = new Set(answers.rows.map(r => (r.unlisted || '').toLowerCase()).filter(Boolean))
    const dismissed = new Set(answers.dismissed)
    const ctx = profile.context || {}
    const data = SENSITIVITY_TO_DATA[ctx.data_sensitivity] || []
    for (const p of profile.stack.platforms || []) {
      const id = kbId(p && p.id)
      if (!id || dismissed.has(id)) continue
      if (kb.index && !kb.platforms.has(id) && !kb.more.has(id)) continue
      const routes = Array.isArray(p.routes) && p.routes.length ? p.routes.map(kbId).filter(Boolean) : ['']
      for (const route of routes) {
        if (have.has(id + '|' + route) || (!route && havePlatform.has(id))) continue
        out.push(cleanRow(newRow('tool', {
          platform: id, route,
          account: p.account || 'unsure',
          status: PROFILE_STATUS[p.status] || 'operational',
          data: data.slice()
        }, now), kb))
      }
    }
    for (const name of profile.stack.unlisted || []) {
      const n = shortName(name)
      if (!n || haveUnlisted.has(n.toLowerCase())) continue
      out.push(cleanRow(newRow('tool', { unlisted: n, data: data.slice() }, now), kb))
    }
    return out.filter(Boolean)
  }

  // Our suggestion for the screening outcome. Never "Unacceptable": that call is the business's.
  function suggestRisk(row, profile) {
    const why = []
    const ctx = (profile && profile.context) || {}
    if (row.data.includes('sensitive')) why.push('it touches sensitive information')
    if (row.uses.includes('decisions') || row.uses.includes('recruitment') || ctx.ai_decisions_about_people === 'yes') why.push('it informs decisions about people')
    if (row.account === 'personal') why.push('it runs on personal accounts')
    if (row.affected.includes('vulnerable')) why.push('it affects vulnerable people')
    if (row.kind === 'agent' && row.agent && (row.agent.oversight === 'none' || row.agent.oversight === 'review-after') &&
        row.agent.tools.some(t => ['payments', 'email', 'shell', 'accounting', 'database'].includes(t))) why.push('it acts on business systems without prior approval')
    return { level: why.length ? 'elevated' : 'normal', why }
  }

  function displayName(row, notes, kb) {
    const n = (notes && notes[row.id]) || {}
    if (row.kind === 'agent') {
      const base = n.name || (row.agent && row.agent.role ? label('agentRole', row.agent.role) + ' agent' : 'AI agent')
      return base
    }
    if (row.platform) {
      const route = row.route && kb.routes.get(row.route)
      return route ? route.name : (platformName(kb, row.platform) || row.platform)
    }
    return row.unlisted || 'Unnamed tool'
  }

  function sourceText(row, kb) {
    if (row.kind === 'agent') {
      const src = label('agentSource', row.agent && row.agent.source)
      const on = row.agent && row.agent.runs_on ? platformName(kb, row.agent.runs_on) : ''
      return [src, on ? 'runs on ' + on : ''].filter(Boolean).join(', ')
    }
    return row.platform ? platformName(kb, row.platform) : row.unlisted
  }

  function hostingText(row, kb) {
    const f = kbFacts(row, kb)
    if (f.route) return f.route.name + '. ' + cap(f.region)
    if (row.platform && kb.routesByPlatform.has(row.platform)) return 'Route not chosen'
    if (row.platform) return 'No residency route in our knowledge base'
    return 'Not covered by our knowledge base'
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }

  // ---------- CSV ----------

  function csvCell(v) {
    let s = v == null ? '' : String(v)
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s   // stop spreadsheet formula injection
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }

  const CSV_EXTRA = ['Kind', 'Who uses it', 'Hosting route', 'Region', 'Account type', 'Review date',
    'Agent identity', 'Tools the agent can call', 'Human oversight', 'Documented controls (vendor documentation)',
    'Notes', 'KB platform id', 'KB as at']

  function toCsv(rows, notes, kb) {
    const lines = [TEMPLATE_COLUMNS.concat(CSV_EXTRA)]
    for (const r of rows) {
      const n = (notes && notes[r.id]) || {}
      const f = kbFacts(r, kb)
      const a = r.agent || {}
      lines.push([
        displayName(r, notes, kb), label('owner', r.owner), label('status', r.status), sourceText(r, kb),
        n.purpose || '', labels('uses', r.uses).join('; '), labels('limits', r.limits).join('; '),
        labels('misuse', r.misuse).join('; '),
        [labels('data', r.data).join('; '), labels('dtypes', r.dtypes).join('; ')].filter(Boolean).join(' | '),
        r.registered, label('risk', r.risk), labels('affected', r.affected).join('; '),
        label('kind', r.kind), labels('users', r.users).join('; '),
        f.route ? f.route.name : '', f.region, r.kind === 'agent' ? '' : label('account', r.account), r.review,
        r.kind === 'agent' ? label('identity', a.identity) : '', r.kind === 'agent' ? labels('tools', a.tools).join('; ') : '',
        r.kind === 'agent' ? label('oversight', a.oversight) : '',
        f.controls.map(c => c.name + ': ' + c.meaning).join('; '),
        n.notes || '', r.platform, kb.asAt
      ])
    }
    // Semicolons separate several picks inside one cell. The file itself is comma separated.
    return '﻿' + lines.map(l => l.map(csvCell).join(',')).join('\r\n') + '\r\n'
  }

  // ---------- CycloneDX 1.6 AI BOM ----------

  function uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
    const h = []
    for (let i = 0; i < 16; i++) h.push(Math.floor(Math.random() * 256))
    h[6] = (h[6] & 0x0f) | 0x40; h[8] = (h[8] & 0x3f) | 0x80
    const s = h.map(b => b.toString(16).padStart(2, '0')).join('')
    return s.slice(0, 8) + '-' + s.slice(8, 12) + '-' + s.slice(12, 16) + '-' + s.slice(16, 20) + '-' + s.slice(20)
  }
  function prop(name, value) { return { name: 'markuswalker:' + name, value: String(value) } }
  function topData(row) {
    for (const d of DATA_RANK) if (row.data.includes(d)) return d
    return 'unknown'
  }
  function httpUrl(u) { return typeof u === 'string' && /^https:\/\/[^\s"<>]+$/.test(u) }

  // opts: { now: Date, serial: uuid string, label: string, residencyNeed: string, citations: { platformId: [ {url, title} ] } }
  function toBom(rows, notes, kb, opts) {
    opts = opts || {}
    const now = opts.now || new Date()
    const stamp = now.toISOString().replace(/\.\d{3}Z$/, 'Z')
    const services = []
    const components = []
    const deps = new Map()
    const modelRefs = new Set()
    const serviceRefByPlatform = new Map()
    const depend = (from, to) => { if (!deps.has(from)) deps.set(from, new Set()); if (to) deps.get(from).add(to) }
    depend('register')

    for (const r of rows) {
      if (r.status === 'decommissioned' && opts.includeDecommissioned === false) continue
      const f = kbFacts(r, kb)
      const ref = 'service:' + r.id
      const svc = { 'bom-ref': ref, name: displayName(r, notes, kb) }
      const provider = r.kind === 'agent' ? '' : f.provider
      if (provider) svc.provider = { name: provider }
      const uses = labels('uses', r.uses)
      if (r.kind === 'agent') {
        svc.description = 'AI agent' + (r.agent.role ? ' for ' + label('agentRole', r.agent.role).toLowerCase() : '') + '.' + (uses.length ? ' Used for: ' + uses.join(', ') + '.' : '')
      } else if (uses.length) {
        svc.description = 'Used for: ' + uses.join(', ') + '.'
      }
      svc['x-trust-boundary'] = r.kind === 'agent' ? false : true
      if (r.kind !== 'agent') svc.trustZone = f.procurement === 'Self-managed or open source' ? 'self-managed' : 'third-party-saas'
      const dataNames = labels('data', r.data)
      svc.data = [{ flow: 'bi-directional', classification: topData(r), name: 'Data it touches', description: dataNames.length ? dataNames.join(', ') : 'Not recorded' }]
      const refs = []
      if (f.route) for (const e of f.route.evidence || []) if (httpUrl(e.url)) refs.push({ type: 'documentation', url: e.url, comment: 'Residency evidence, checked ' + (f.route.checked_on || kb.asAt) })
      for (const c of (opts.citations && opts.citations[r.platform]) || []) if (httpUrl(c.url)) refs.push({ type: 'documentation', url: c.url, comment: c.title ? 'Data lifecycle documentation: ' + c.title : 'Data lifecycle documentation' })
      const seen = new Set()
      const uniq = refs.filter(x => !seen.has(x.url) && seen.add(x.url))
      if (uniq.length) svc.externalReferences = uniq.slice(0, 8)
      const props = [prop('kind', r.kind), prop('status', label('status', r.status) || 'Not recorded')]
      if (r.owner) props.push(prop('owner_role', label('owner', r.owner)))
      if (r.risk) props.push(prop('screening_outcome', label('risk', r.risk)))
      if (r.registered) props.push(prop('registered_date', r.registered))
      if (r.review) props.push(prop('review_date', r.review))
      if (r.account && r.account !== 'unsure') props.push(prop('account', r.account))
      if (r.users.length) props.push(prop('users', labels('users', r.users).join(', ')))
      if (r.affected.length) props.push(prop('stakeholders_affected', labels('affected', r.affected).join(', ')))
      if (r.limits.length) props.push(prop('limits', labels('limits', r.limits).join(', ')))
      if (r.dtypes.length) props.push(prop('data_types', labels('dtypes', r.dtypes).join(', ')))
      if (r.platform) props.push(prop('kb:platform', r.platform))
      else if (r.kind === 'tool') props.push(prop('kb:covered', 'no'))
      if (f.route) {
        props.push(prop('residency:route', f.route.id), prop('residency:level', f.route.level), prop('residency:stored', f.route.stored), prop('residency:processed', f.route.processed))
        if (f.route.operator) props.push(prop('residency:operator', f.route.operator))
      }
      for (const c of f.controls) props.push(prop('control:' + c.id, c.letter))
      if (r.kind === 'agent') {
        const a = r.agent
        if (a.role) props.push(prop('agent:role', label('agentRole', a.role)))
        props.push(prop('agent:source', label('agentSource', a.source)), prop('agent:identity', label('identity', a.identity)))
        if (a.tools.length) props.push(prop('agent:tools', labels('tools', a.tools).join(', ')))
        if (a.oversight) props.push(prop('agent:human_oversight', label('oversight', a.oversight)))
        if (a.runs_on) props.push(prop('agent:runs_on', a.runs_on))
      }
      svc.properties = props
      services.push(svc)
      depend('register', ref)
      if (r.kind === 'tool' && r.platform && !serviceRefByPlatform.has(r.platform)) serviceRefByPlatform.set(r.platform, ref)

      // The model behind the route, where the KB platform or route names a maker's model family.
      let fam = r.kind === 'tool' && r.platform ? MODEL_FAMILIES[r.platform] : null
      if (!fam && r.kind === 'tool' && r.route) for (const [re, maker] of ROUTE_MODEL_HINTS) if (re.test(r.route)) { fam = MODEL_FAMILIES[maker]; break }
      if (fam) {
        const mref = 'model:' + fam.maker
        if (!modelRefs.has(mref)) {
          modelRefs.add(mref)
          components.push({ type: 'machine-learning-model', 'bom-ref': mref, supplier: { name: platformName(kb, fam.maker) || fam.name }, name: fam.name, version: 'unknown',
            description: 'Model family named by the vendor. The vendor does not pin a version for this route, so none is given.' })
        }
        depend(ref, mref)
      }
    }
    // Agents depend on the platform they run on, when that platform is in the register.
    for (const r of rows) {
      if (r.kind !== 'agent' || !r.agent.runs_on) continue
      const target = serviceRefByPlatform.get(r.agent.runs_on)
      if (target) depend('service:' + r.id, target)
    }
    for (const s of services) if (!deps.has(s['bom-ref'])) depend(s['bom-ref'])
    for (const c of components) if (!deps.has(c['bom-ref'])) depend(c['bom-ref'])

    const metaProps = [
      prop('inventory', 'Vendor-level inventory. Declared by the business, not discovered. No model hashes, datasets or infrastructure.'),
      prop('basis', 'Vendor documentation only. Not a test of the deployment.'),
      prop('register_template', 'Columns follow the Australian Government AI register template (National AI Centre, Guidance for AI Adoption).')
    ]
    if (kb.asAt) metaProps.unshift(prop('kb:as_at', kb.asAt))
    if (opts.residencyNeed) metaProps.push(prop('residency:need', opts.residencyNeed))

    const bom = {
      bomFormat: 'CycloneDX',
      specVersion: '1.6',
      serialNumber: 'urn:uuid:' + (opts.serial || uuid()),
      version: 1,
      metadata: {
        timestamp: stamp,
        lifecycles: [{ phase: 'operations' }],
        tools: { components: [{ type: 'application', name: 'AI register', version: BUILD, externalReferences: [{ type: 'website', url: 'https://www.markuswalker.com/free/ai-register/' }] }] },
        component: { type: 'application', 'bom-ref': 'register', name: shortName(opts.label) || 'Our AI register', version: today(now) },
        properties: metaProps
      }
    }
    if (components.length) bom.components = components
    if (services.length) bom.services = services
    bom.dependencies = Array.from(deps, ([ref, set]) => set.size ? { ref, dependsOn: Array.from(set) } : { ref })
    bom.compositions = [{ aggregate: 'incomplete', assemblies: ['register'] }]
    return bom
  }

  return {
    TOOL_ID, ANSWERS_VERSION, BUILD, MAX_ROWS, NOTE_MAX, NAME_MAX, TEMPLATE_COLUMNS, CSV_EXTRA, PICK, KEY_CONTROLS, LETTERS,
    STATUS_TO_PROFILE, compactAnswers, answersBytes, label, labels, today, addMonths, shortName, buildKb, platformName, kbFacts, regionText, newRow, cleanRow, cleanAnswers,
    cleanNotes, rowsFromStack, suggestRisk, displayName, sourceText, hostingText, toCsv, toBom
  }
})
