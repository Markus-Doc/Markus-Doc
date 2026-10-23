'use strict'

// Threat model starter: maps saved AI tools and agents onto the OWASP Top 10 for LLM Applications (2026)
// and the OWASP Top 10 for Agentic Applications (2026). Pure functions with no DOM, so the page and the
// Node test in tests/ use the same code. Inputs are picklist ids and KB platform ids only.
//
// Risk ids and names were checked on 22 Oct 2026 against the OWASP GenAI Security Project:
//   LLM list: https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/ (v1.0, August 2026) and the
//   project's repository github.com/GenAI-Security-Project/GenAI-LLM-Top10 (full 2026 list with names).
//   Agentic list: https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
//   (published 9 Dec 2025), names as used in genai.owasp.org's Q3 2026 exploit round-up.
// The short descriptions and mitigations are our plain-English summaries of the OWASP text, following the
// OKF-AI-Frameworks control pages (knowledge/controls/owasp-*.md). OWASP publishes under CC BY-SA 4.0.
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory()
  else root.TMModel = factory()
})(typeof self !== 'undefined' ? self : this, function () {
  const TOOL_ID = 'threat-model'
  const ANSWERS_VERSION = '1.0'
  const BUILD = '2026.10.22'
  const MAX_AGENTS = 10

  const SOURCES = {
    llm: {
      name: 'OWASP Top 10 for LLM Applications', edition: '2026 (v1.0)', published: 'August 2026',
      url: 'https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/'
    },
    asi: {
      name: 'OWASP Top 10 for Agentic Applications', edition: '2026', published: 'December 2025',
      url: 'https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/'
    }
  }

  // was: the matching 2025 id, for registers keyed on the 2025 edition.
  const RISKS = {
    LLM01: { list: 'llm', name: 'Prompt Injection', was: 'LLM01:2025',
      what: 'Text the model reads, typed or hidden in a file, page or email, changes what it does.',
      mit: ['Treat text from files, web pages and emails as data, never as instructions to follow.',
        'Keep the tool away from actions and data the person using it could not reach themselves.',
        'Test it with planted instructions in a document before you rely on it.'] },
    LLM02: { list: 'llm', name: 'Sensitive Information Disclosure', was: 'LLM02:2025',
      what: 'Confidential, personal or regulated information leaves through the tool to someone who should not have it.',
      mit: ['Use a business account with training on your data switched off.',
        'Tell staff which kinds of information never go in, and check the account settings match.',
        'Limit the sources it can read to what each user is already allowed to see.'] },
    LLM03: { list: 'llm', name: 'Excessive Agency', was: 'LLM06:2025',
      what: 'The system has more functions, permissions or autonomy than the job needs, so a wrong output becomes a damaging action.',
      mit: ['Remove tools and permissions the job does not need.',
        'Require a person to approve high impact actions.',
        'Check authorisation in your own systems, not in the model\'s instructions.'] },
    LLM04: { list: 'llm', name: 'Supply Chain', was: 'LLM03:2025',
      what: 'Models, plug-ins, packages or hosting you depend on are tampered with or not what they claim.',
      mit: ['Use models, plug-ins and packages only from sources you have checked, and pin versions.',
        'Keep a list of the components and where they came from, for example in the AI register.',
        'Check that a suggested package exists and is the one you meant before installing it.'] },
    LLM05: { list: 'llm', name: 'Data and Model Poisoning', was: 'LLM04:2025',
      what: 'The data a tool learns from or searches is altered so its answers are wrong or biased, and it still looks like it works.',
      mit: ['Control who can add or change the documents and data the tool uses.',
        'Keep a record of where each data source came from.',
        'Test answers on known questions after each data change.'] },
    LLM06: { list: 'llm', name: 'Unbounded Consumption', was: 'LLM10:2025',
      what: 'Uncontrolled use runs up a large bill, takes the service down or lets someone copy the model.',
      mit: ['Set spending caps and alerts on the account.',
        'Rate limit each user and each session.',
        'Cap input size and the number of steps per request.'] },
    LLM07: { list: 'llm', name: 'Misinformation', was: 'LLM09:2025',
      what: 'Wrong or unsupported output is credible enough that a person, workflow or agent acts on it.',
      mit: ['Have a person check output before it is used for a decision or sent to a customer.',
        'Ask for sources and check them against the original.',
        'Tell users plainly that answers can be wrong.'] },
    LLM08: { list: 'llm', name: 'Hidden Context Exposure', was: 'LLM07:2025 (System Prompt Leakage, now wider)',
      what: 'The hidden instructions, tool details and other context behind the tool are extracted, along with anything sensitive put there.',
      mit: ['Assume the hidden instructions will be seen, and keep secrets, keys and internal rules out of them.',
        'Enforce access rules in code, not in the prompt.',
        'Use fixed checks, not the model, for rules that must always hold.'] },
    LLM09: { list: 'llm', name: 'Vector and Embedding Weaknesses', was: 'LLM08:2025',
      what: 'Search over your documents returns content a user should not see, or planted content that skews answers.',
      mit: ['Limit each user\'s search to documents they are allowed to open.',
        'Keep data for different clients or teams apart in the search index.',
        'Check new documents before they are added to the index.'] },
    LLM10: { list: 'llm', name: 'Improper Output Handling', was: 'LLM05:2025',
      what: 'Model output goes into a browser, database, shell or another system without checks.',
      mit: ['Treat model output like untrusted user input and validate it before it reaches another system.',
        'Use parameterised queries and safe templates for anything built from output.',
        'Review generated code before it runs.'] },
    ASI01: { list: 'asi', name: 'Agent Goal Hijack', related: ['LLM01'],
      what: 'Content the agent reads redirects its goal or its choice of task, not just one answer.',
      mit: ['Treat every email, page, file and ticket the agent reads as untrusted.',
        'Require a person to approve any action that changes the goal or reaches outside the business.',
        'Log what the agent does and compare it with what it was asked to do.'] },
    ASI02: { list: 'asi', name: 'Tool Misuse and Exploitation', related: ['LLM03'],
      what: 'The agent uses a tool it is allowed to use in an unsafe way, such as deleting, sending or paying the wrong thing.',
      mit: ['Give each tool the narrowest scope it needs, read only where possible.',
        'Require a person to confirm high impact calls.',
        'Set rate and spend limits that stop the agent when it passes them.'] },
    ASI03: { list: 'asi', name: 'Identity and Privilege Abuse',
      what: 'Shared keys, inherited staff logins or cached access let the agent, or someone steering it, reach more than intended.',
      mit: ['Give the agent its own identity, not a shared key or a staff login.',
        'Use short-lived credentials limited to the task.',
        'Make sure you can revoke its access in one step.'] },
    ASI04: { list: 'asi', name: 'Agentic Supply Chain Vulnerabilities', related: ['LLM04'],
      what: 'Tools, plug-ins, MCP servers or updates the agent loads while running are compromised.',
      mit: ['Keep a list of the agent\'s tools, plug-ins and MCP servers with their versions.',
        'Approve new tools before the agent can load them.',
        'Know how to switch off a component that turns out to be compromised.'] },
    ASI05: { list: 'asi', name: 'Unexpected Code Execution',
      what: 'Code or commands the agent writes or runs take over the machine or reach systems they should not.',
      mit: ['Run code and commands in a sandbox with no network access by default.',
        'Never run the agent as an administrator or root account.',
        'Require a person to approve commands that change systems or install packages.'] },
    ASI06: { list: 'asi', name: 'Memory and Context Poisoning',
      what: 'Something planted in what the agent remembers steers its later work.',
      mit: ['Limit what the agent remembers and for how long.',
        'Keep memory separate for each customer or user.',
        'Make sure you can review and clear stored memory.'] },
    ASI07: { list: 'asi', name: 'Insecure Inter-Agent Communication',
      what: 'Messages between agents are faked, read or changed on the way.',
      mit: ['Make agents authenticate to each other.',
        'Accept only expected message types between agents.',
        'Log the messages agents send each other.'] },
    ASI08: { list: 'asi', name: 'Cascading Failures',
      what: 'One bad step spreads across connected agents and systems before anyone notices.',
      mit: ['Add checkpoints where a person or a fixed rule must pass work on.',
        'Set limits that stop a chain of actions when something looks wrong.',
        'Test what happens when one agent gives bad output.'] },
    ASI09: { list: 'asi', name: 'Human-Agent Trust Exploitation',
      what: 'A fluent, confident agent gets a person to approve or disclose something they should not.',
      mit: ['Show people what the agent will actually do before they approve, in plain words not written by the model.',
        'Train approvers to check the action, not the explanation.',
        'Give staff and customers a way to report a suspicious request.'] },
    ASI10: { list: 'asi', name: 'Rogue Agents',
      what: 'The agent drifts outside its job while each single action still looks legitimate.',
      mit: ['Have a kill switch and know who can use it.',
        'Watch for actions outside the agent\'s normal pattern.',
        'Review the agent\'s access and actions on a set schedule.'] }
  }

  function list(pairs) { return pairs.map(p => ({ id: p[0], label: p[1] })) }

  // Tool types. The page offers these when the profile is empty, and KB groups map onto them.
  const TYPES = list([
    ['chat', 'Chat assistant'], ['workplace', 'Workplace assistant on company data'],
    ['coding', 'Coding assistant or agent'], ['customer', 'Chatbot for customers'],
    ['search', 'Search or Q and A over our documents'], ['api', 'Model API in our own app'],
    ['automation', 'Workflow automation with AI steps']
  ])
  const TYPE_GROUP_TITLE = {
    chat: 'Chat assistants', workplace: 'Workplace assistants on company data', coding: 'Coding assistants and agents',
    customer: 'Chatbots for customers', search: 'Search over your documents', api: 'Model APIs in your own apps',
    automation: 'Workflow automation with AI steps'
  }
  // Risk ids per type, most relevant first.
  const TYPE_RISKS = {
    chat: ['LLM02', 'LLM07', 'LLM01'],
    workplace: ['LLM02', 'LLM01', 'LLM09'],
    coding: ['LLM04', 'LLM10', 'LLM01', 'ASI05'],
    customer: ['LLM01', 'LLM07', 'LLM08', 'LLM06'],
    search: ['LLM09', 'LLM05', 'LLM02'],
    api: ['LLM10', 'LLM06', 'LLM08', 'LLM04'],
    automation: ['LLM03', 'LLM01', 'LLM10']
  }
  const TYPE_WHY = {
    chat: { LLM02: 'Staff type and paste business information into it.', LLM07: 'People act on its answers.', LLM01: 'It reads files and pages people give it.' },
    workplace: { LLM02: 'It can read company email, files and chats, so it can surface what a user should not see.', LLM01: 'It reads email and documents that outsiders can write.', LLM09: 'It searches indexed company content to answer.' },
    coding: { LLM04: 'It suggests and installs packages and plug-ins.', LLM10: 'Its code goes into your systems.', LLM01: 'It reads code, issues and web pages that others write.', ASI05: 'Coding agents can run commands on the machine they work on.' },
    customer: { LLM01: 'Anyone can type into it.', LLM07: 'Customers act on what it says, and your business may be held to it.', LLM08: 'Its hidden instructions face the public.', LLM06: 'Public use can run up cost.' },
    search: { LLM09: 'It answers from an index of your documents.', LLM05: 'Anyone who can add documents can change its answers.', LLM02: 'Answers can quote documents a user should not open.' },
    api: { LLM10: 'Your app passes its output to other systems.', LLM06: 'API use is billed per request.', LLM08: 'Your app\'s hidden instructions sit behind every request.', LLM04: 'You depend on the model host and any SDKs.' },
    automation: { LLM03: 'Its AI steps can trigger actions in other systems.', LLM01: 'Its inputs often come from email, forms or the web.', LLM10: 'AI output feeds the next step without a person.' }
  }

  // KB groups (stack-check/data/index.json) to tool types. Groups not listed are security and governance
  // tools, which we treat as controls rather than things to threat model.
  const GROUP_TYPE = {
    'frontier-ai': 'chat', 'enterprise-agents': 'workplace', 'coding-agents': 'coding',
    'data-ai-platforms': 'search', 'data-retrieval': 'search', 'model-hosting': 'api', 'cloud-platforms': 'api',
    'self-hosted': 'api', 'sovereign-hosting': 'api', 'workflow-automation': 'automation', 'agent-frameworks': 'automation'
  }

  // The AI register's agent picklists (ai-register/js/model.js), mirrored here so cleaning works without it.
  const AGENT_ROLE = list([
    ['support', 'Customer support'], ['sales', 'Sales and leads'], ['research', 'Research'],
    ['coding', 'Coding'], ['operations', 'Operations and back office'], ['finance', 'Finance and invoicing'],
    ['helpdesk', 'IT help desk'], ['scheduling', 'Scheduling and inbox'], ['other-agent', 'Another job']
  ])
  const AGENT_TOOLS = list([
    ['email', 'Email'], ['calendar', 'Calendar'], ['files', 'Files and documents'], ['crm', 'CRM'],
    ['accounting', 'Accounting and finance'], ['payments', 'Payments'], ['messaging', 'Chat and messaging'],
    ['web', 'Web browsing'], ['code-repo', 'Code repositories'], ['database', 'Databases'],
    ['tickets', 'Help desk tickets'], ['shell', 'Running commands']
  ])
  const OVERSIGHT = list([
    ['approve-all', 'A person approves every action'], ['approve-high', 'A person approves high impact actions'],
    ['review-after', 'A person reviews afterwards'], ['none', 'No human oversight']
  ])
  const IDENTITY = list([
    ['own-identity', 'Its own identity or service account'], ['user-delegated', 'Acts as the person using it'],
    ['shared-key', 'A shared API key or login'], ['unknown', 'Not sure']
  ])
  const SOURCE = list([['vendor', 'A vendor product'], ['in-house', 'Built by our team'], ['contractor', 'Built by a contractor']])

  // What each tool lets the agent do, as a phrase.
  const ACTS = {
    email: 'send email', payments: 'make payments', accounting: 'change accounting records', database: 'change database records',
    shell: 'run commands', 'code-repo': 'change code', crm: 'update the CRM', files: 'change or share files',
    messaging: 'post messages', calendar: 'change calendars', tickets: 'update help desk tickets', web: 'browse the web'
  }
  const READS = { email: 'email', web: 'web pages', files: 'shared files', tickets: 'help desk tickets', messaging: 'chat messages', crm: 'customer records' }
  const HIGH_IMPACT = ['payments', 'accounting', 'email', 'database', 'shell', 'code-repo']
  const SENSITIVE_DATA = { personal: 'personal information', sensitive: 'sensitive information', client: 'client records', financial: 'financial details', employee: 'staff records', credentials: 'passwords or keys', confidential: 'confidential business information' }

  // ---------- helpers ----------

  function idsOf(l) { return new Set(l.map(o => o.id)) }
  function labelOf(l, id) { const o = l.find(x => x.id === id); return o ? o.label : '' }
  function one(l, v, fb) { return idsOf(l).has(v) ? v : fb }
  function many(l, v) { const ok = idsOf(l); return Array.isArray(v) ? Array.from(new Set(v.filter(x => ok.has(x)))) : [] }
  function joinAnd(a) { return a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s }
  function kbId(v) { return typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,59}$/.test(v) ? v : '' }
  function ref(id) { return RISKS[id].list === 'llm' ? id + ':2026' : id }

  function cleanAgent(a) {
    a = a && typeof a === 'object' ? a : {}
    return {
      role: one(AGENT_ROLE, a.role, ''), tools: many(AGENT_TOOLS, a.tools),
      oversight: one(OVERSIGHT, a.oversight, ''), identity: one(IDENTITY, a.identity, 'unknown'),
      source: one(SOURCE, a.source, 'vendor')
    }
  }

  // The tool's own answers: picklist ids only.
  function cleanAnswers(a) {
    a = a && typeof a === 'object' ? a : {}
    return {
      types: many(TYPES, a.types),
      agents: Array.isArray(a.agents) ? a.agents.slice(0, MAX_AGENTS).map(cleanAgent) : []
    }
  }

  // index: /free/stack-check/data/index.json, optional.
  function buildKb(index) {
    const kb = new Map()
    if (!index) return kb
    for (const p of [].concat(index.platforms || [], index.more_platforms || [])) if (p && p.id && !kb.has(p.id)) kb.set(p.id, { name: p.name || p.id, group: p.group_id || '' })
    return kb
  }

  // ---------- inputs to subjects ----------

  // Tools from the saved stack and the register's tool rows, merged by platform id.
  function collectTools(profile, register, kb) {
    const tools = new Map()
    const controls = []
    function add(key, name, group) {
      if (!tools.has(key)) tools.set(key, { key, name, types: new Set(), data: new Set(), personal: false, customers: false, decisions: false })
      const t = tools.get(key)
      const ty = GROUP_TYPE[group]
      if (ty) t.types.add(ty)
      return t
    }
    const stack = profile && profile.stack && Array.isArray(profile.stack.platforms) ? profile.stack.platforms : []
    for (const s of stack) {
      const id = kbId(s && s.id)
      if (!id) continue
      const p = kb.get(id)
      if (p && !GROUP_TYPE[p.group]) { if (!controls.includes(p.name)) controls.push(p.name); continue }
      const t = add(id, p ? p.name : id, p ? p.group : '')
      if (!p) t.types.add('chat')
      if (s.account === 'personal') t.personal = true
    }
    const rows = register && Array.isArray(register.rows) ? register.rows : []
    for (const r of rows) {
      if (!r || r.kind === 'agent') continue
      const id = kbId(r.platform)
      const name = id ? ((kb.get(id) || {}).name || id) : (typeof r.unlisted === 'string' ? r.unlisted.slice(0, 60).trim() : '')
      if (!name) continue
      const p = id ? kb.get(id) : null
      if (p && !GROUP_TYPE[p.group]) { if (!controls.includes(p.name)) controls.push(p.name); continue }
      const t = add(id || 'u:' + name.toLowerCase(), name, p ? p.group : '')
      const uses = Array.isArray(r.uses) ? r.uses : []
      const users = Array.isArray(r.users) ? r.users : []
      if (uses.includes('coding')) t.types.add('coding')
      if (uses.includes('knowledge') || uses.includes('documents')) t.types.add('search')
      if (uses.includes('automation')) t.types.add('automation')
      if (uses.includes('customer-service') || users.includes('customers')) { t.types.add('customer'); t.customers = true }
      if (uses.includes('decisions')) t.decisions = true
      for (const d of Array.isArray(r.data) ? r.data : []) if (SENSITIVE_DATA[d]) t.data.add(d)
      if (r.account === 'personal') t.personal = true
      if (!t.types.size) t.types.add('chat')
    }
    return { tools: Array.from(tools.values()), controls }
  }

  function agentName(role, platformName, n) {
    const base = role ? labelOf(AGENT_ROLE, role) + ' agent' : 'Agent'
    return base + (platformName ? ' on ' + platformName : '') + (n > 1 ? ' ' + n : '')
  }

  function collectAgents(register, answers, kb) {
    const out = []
    const rows = register && Array.isArray(register.rows) ? register.rows : []
    for (const r of rows) {
      if (!r || r.kind !== 'agent') continue
      const a = cleanAgent(r.agent)
      const pid = kbId(r.platform) || kbId(r.agent && r.agent.runs_on)
      const data = (Array.isArray(r.data) ? r.data : []).filter(d => SENSITIVE_DATA[d])
      const customers = (Array.isArray(r.users) ? r.users : []).includes('customers') || (Array.isArray(r.affected) ? r.affected : []).includes('customers')
      out.push(Object.assign(a, { from: 'register', platform: pid ? ((kb.get(pid) || {}).name || pid) : '', data, customers }))
    }
    for (const a of answers.agents) out.push(Object.assign({}, a, { from: 'page', platform: '', data: [], customers: false }))
    const seen = {}
    for (const a of out) {
      const base = agentName(a.role, a.platform, 0)
      seen[base] = (seen[base] || 0) + 1
      a.name = agentName(a.role, a.platform, seen[base])
    }
    return out
  }

  // ---------- rows ----------

  function row(subject, id, why, higher, extraMit) {
    const r = RISKS[id]
    const mit = []
    for (const m of (extraMit || []).concat(r.mit)) if (!mit.includes(m) && mit.length < 3) mit.push(m)
    return {
      subject, id, ref: ref(id), name: r.name, list: r.list, source: SOURCES[r.list].name + ' ' + SOURCES[r.list].edition,
      was: r.was || '', related: (r.related || []).map(ref), priority: higher ? 'higher' : 'standard',
      what: r.what, why: why.filter(Boolean), mitigations: mit
    }
  }

  function toolRows(tools, pickedTypes) {
    const subjects = []
    for (const ty of TYPES.map(t => t.id)) {
      const members = tools.filter(t => t.types.has(ty))
      const picked = pickedTypes.includes(ty)
      if (!members.length && !picked) continue
      const names = members.map(t => t.name)
      const title = TYPE_GROUP_TITLE[ty]
      const rows = TYPE_RISKS[ty].map(id => {
        const why = [TYPE_WHY[ty][id]]
        let higher = false
        const extra = []
        if (id === 'LLM02') {
          const withData = members.filter(t => t.data.size)
          if (withData.length) {
            const kinds = Array.from(new Set(withData.flatMap(t => Array.from(t.data)))).map(d => SENSITIVE_DATA[d])
            why.push(joinAnd(withData.map(t => t.name)) + ' handle' + (withData.length === 1 ? 's ' : ' ') + joinAnd(kinds) + ', per your AI register.')
            higher = true
          }
          const personal = members.filter(t => t.personal)
          if (personal.length) {
            why.push(joinAnd(personal.map(t => t.name)) + (personal.length === 1 ? ' is' : ' are') + ' used on a personal plan, which the business does not control.')
            extra.push('Move staff from personal plans to a business account you control.')
            higher = true
          }
        }
        if (id === 'LLM07') {
          const dec = members.filter(t => t.decisions)
          if (dec.length) { why.push(joinAnd(dec.map(t => t.name)) + (dec.length === 1 ? ' is' : ' are') + ' used to recommend or make decisions about people.'); higher = true }
          if (ty === 'customer') higher = true
        }
        if (id === 'LLM01' && ty === 'customer') higher = true
        return row(title, id, why, higher, extra)
      })
      subjects.push({ key: 'type:' + ty, kind: 'tools', title, covers: names.length ? names : ['Picked on this page'], rows })
    }
    return subjects
  }

  function agentRows(a) {
    const rows = []
    const s = a.name
    const acts = a.tools.filter(t => ACTS[t])
    const high = a.tools.filter(t => HIGH_IMPACT.includes(t))
    const reads = a.tools.filter(t => READS[t])
    const unapproved = a.oversight === 'none' || a.oversight === 'review-after' || a.oversight === ''
    const approvalText = a.oversight === 'none' ? 'with no human oversight'
      : a.oversight === 'review-after' ? 'and a person only reviews afterwards'
      : a.oversight === '' ? 'and its oversight is not recorded'
      : a.oversight === 'approve-high' ? 'with a person approving high impact actions' : 'with a person approving every action'

    if (reads.length) {
      rows.push(row(s, 'ASI01', ['It reads ' + joinAnd(reads.map(t => READS[t])) + ' that people outside the business can write.',
        high.length && unapproved ? 'It can ' + joinAnd(high.map(t => ACTS[t])) + ' ' + approvalText + '.' : ''], high.length > 0 && unapproved))
    }
    if (acts.length) {
      const extra = []
      if (a.tools.includes('payments')) extra.push('Require a person to approve every payment, with a dollar limit set outside the agent.')
      if (a.tools.includes('email')) extra.push('Hold outgoing email for approval, or limit it to set recipients.')
      if (a.tools.includes('accounting') && !a.tools.includes('payments')) extra.push('Let it draft accounting entries, and have a person post them.')
      if (a.tools.includes('database')) extra.push('Give it read-only database access unless writing is the job.')
      rows.push(row(s, 'ASI02', ['It can ' + joinAnd(acts.map(t => ACTS[t])) + ' ' + approvalText + '.'], high.length > 0 && unapproved, extra))
    }
    if (a.identity !== 'own-identity') {
      const why = a.identity === 'shared-key' ? 'It uses a shared API key or login, so its actions cannot be told apart and the key is hard to revoke.'
        : a.identity === 'user-delegated' ? 'It acts as the person using it, so it holds all of that person\'s access.'
        : 'You are not sure which identity it uses.'
      rows.push(row(s, 'ASI03', [why], a.identity === 'shared-key' || (a.identity === 'unknown' && high.length > 0)))
    }
    if (a.tools.includes('shell') || a.tools.includes('code-repo') || a.role === 'coding') {
      rows.push(row(s, 'ASI05', [a.tools.includes('shell') ? 'It can run commands.' : 'It writes code that can end up running.'], a.tools.includes('shell') && unapproved))
    }
    if (a.data.length || a.tools.some(t => ['crm', 'database', 'email', 'files', 'accounting'].includes(t))) {
      const why = []
      if (a.data.length) why.push('It handles ' + joinAnd(a.data.map(d => SENSITIVE_DATA[d])) + ', per your AI register.')
      const src = a.tools.filter(t => ['crm', 'database', 'email', 'files', 'accounting'].includes(t))
      if (src.length) why.push('It can read ' + joinAnd(src.map(t => labelOf(AGENT_TOOLS, t).toLowerCase())) + ' and can repeat what it reads.')
      rows.push(row(s, 'LLM02', why, a.data.some(d => ['personal', 'sensitive', 'financial', 'credentials'].includes(d)), ['Limit what it can read to the records the task needs.']))
    }
    if (a.source !== 'in-house' || a.platform) {
      rows.push(row(s, 'ASI04', [a.source === 'contractor' ? 'A contractor built it, so its tools and updates come from outside your team.'
        : 'It is a vendor product' + (a.platform ? ' (' + a.platform + ')' : '') + ', so its tools, plug-ins and updates load from outside your control.'], false))
    }
    if (['support', 'helpdesk', 'research', 'scheduling', 'sales'].includes(a.role) && reads.length) {
      rows.push(row(s, 'ASI06', ['It works through many conversations or requests, so content from one can carry into the next.'], false))
    }
    if (a.oversight === 'approve-all' || a.oversight === 'approve-high' || a.customers || ['support', 'sales'].includes(a.role)) {
      const why = []
      if (a.oversight === 'approve-all' || a.oversight === 'approve-high') why.push('People approve what it proposes, so a persuasive proposal can get a bad action approved.')
      if (a.customers || ['support', 'sales'].includes(a.role)) why.push('It talks to customers, who may trust what it says or tells them to do.')
      rows.push(row(s, 'ASI09', why, false))
    }
    if (a.oversight === 'none' || a.oversight === '') {
      rows.push(row(s, 'ASI10', [a.oversight === 'none' ? 'Nobody watches what it does.' : 'Its oversight is not recorded, so it may not be watched.'], a.oversight === 'none' && acts.length > 0))
    }
    if (high.length >= 2 && unapproved) {
      rows.push(row(s, 'ASI08', ['It can ' + joinAnd(high.map(t => ACTS[t])) + ', so one wrong step can flow through several systems before anyone checks.'], true))
    }
    if (!rows.length) {
      rows.push(row(s, 'ASI01', ['Any agent that reads instructions can be redirected. Add its tools to see more specific risks.'], false))
    }
    return rows
  }

  function order(rows) {
    const rank = id => (RISKS[id].list === 'asi' ? 0 : 10) + parseInt(id.slice(-2), 10)
    return rows.slice().sort((x, y) => (x.priority === y.priority ? 0 : x.priority === 'higher' ? -1 : 1) || rank(x.id) - rank(y.id))
  }

  // The whole starter threat list.
  function build(input) {
    input = input || {}
    const kb = input.kb instanceof Map ? input.kb : buildKb(input.index)
    const answers = cleanAnswers(input.answers)
    const { tools, controls } = collectTools(input.profile, input.register, kb)
    const agents = collectAgents(input.register, answers, kb)
    const subjects = []
    for (const a of agents) subjects.push({ key: 'agent:' + a.name, kind: 'agent', title: a.name, covers: [a.from === 'register' ? 'From your AI register' : 'Added on this page'], rows: order(agentRows(a)) })
    if (agents.length >= 2) {
      const t = 'Your agents together'
      subjects.push({ key: 'agents:all', kind: 'agents', title: t, covers: agents.map(a => a.name), rows: [
        row(t, 'ASI07', ['You list ' + agents.length + ' agents. If they pass work or messages to each other, each one trusts the others\' output.'], false),
        row(t, 'ASI08', ['A fault in one agent can feed the next.'], agents.some(a => a.oversight === 'none'))
      ] })
    }
    for (const s of toolRows(tools, answers.types)) { s.rows = order(s.rows); subjects.push(s) }
    const rows = subjects.flatMap(s => s.rows)
    return {
      subjects, rows, controls, answers,
      counts: { tools: tools.length, agents: agents.length, rows: rows.length, higher: rows.filter(r => r.priority === 'higher').length }
    }
  }

  // ---------- exports ----------

  function csvCell(v) {
    let s = String(v === undefined || v === null ? '' : v)
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s   // keep spreadsheets from reading a cell as a formula
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }

  function toCsv(result) {
    const head = ['Subject', 'Covers', 'Risk id', 'Risk', 'List', '2025 id', 'Related', 'Priority', 'What it is', 'Why it applies', 'Mitigation 1', 'Mitigation 2', 'Mitigation 3']
    const lines = [head.map(csvCell).join(',')]
    for (const s of result.subjects) for (const r of s.rows) {
      lines.push([s.title, s.covers.join(', '), r.ref, r.name, r.source, r.was, r.related.join(', '), r.priority, r.what, r.why.join(' '),
        r.mitigations[0] || '', r.mitigations[1] || '', r.mitigations[2] || ''].map(csvCell).join(','))
    }
    return lines.join('\r\n') + '\r\n'
  }

  function md(s) { return String(s).replace(/([\\`*_[\]<>|#])/g, '\\$1') }

  function toMarkdown(result, date) {
    const out = ['# Threat model starter', '',
      'Made with the Checkable AI threat model starter' + (date ? ' on ' + date : '') + '. Risk lists: [' + SOURCES.llm.name + ' ' + SOURCES.llm.edition + '](' + SOURCES.llm.url + ') and [' + SOURCES.asi.name + ' ' + SOURCES.asi.edition + '](' + SOURCES.asi.url + ').', '']
    if (!result.rows.length) { out.push('No tools or agents were given, so there are no risks to list yet.', ''); return out.join('\n') }
    for (const s of result.subjects) {
      out.push('## ' + md(s.title), '', 'Covers: ' + md(s.covers.join(', ')), '')
      for (const r of s.rows) {
        out.push('### ' + r.ref + ' ' + md(r.name) + (r.priority === 'higher' ? ' (higher priority)' : ''), '')
        out.push(md(r.what) + (r.was ? ' 2025 id: ' + md(r.was) + '.' : '') + (r.related.length ? ' Related: ' + r.related.join(', ') + '.' : ''), '')
        out.push('Why it applies: ' + md(r.why.join(' ')), '', 'Mitigations:', '')
        for (const m of r.mitigations) out.push('- ' + md(m))
        out.push('')
      }
    }
    if (result.controls.length) out.push('Security and governance tools in your stack, not modelled here: ' + md(result.controls.join(', ')) + '.', '')
    out.push('A starting point from your saved inputs, not a full threat model or a security test.', '')
    return out.join('\n')
  }

  return {
    TOOL_ID, ANSWERS_VERSION, BUILD, MAX_AGENTS, SOURCES, RISKS, TYPES, AGENT_ROLE, AGENT_TOOLS, OVERSIGHT, IDENTITY, SOURCE,
    cleanAnswers, cleanAgent, buildKb, build, toCsv, toMarkdown, ref
  }
})
