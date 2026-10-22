'use strict'

// AI use policy builder: reads the stack profile and drafts a policy. Pure functions with no DOM, so the page and
// the Node test in tests/ use the same code.
//
// The sections follow the "[Organisation] AI policy" part of the National AI Centre's AI policy guide and template
// (Guidance for AI Adoption, Department of Industry, Science and Resources). Headings read from the official Word
// file https://www.ai.gov.au/sites/default/files/2026-06/AI-policy-guide-and-template.docx, linked from
// https://www.ai.gov.au/staying-safe-and-responsible/essential-ai-practices/create-ai-policy (industry.gov.au's
// /publications/guidance-for-ai-adoption/ai-policy-guide-and-template redirects there), checked 22 Oct 2026.
// The 2026-05 copy of the file has the same headings. The one change is Australian spelling: "human-centred" where
// the template has "human-centered". The template's Introduction and "Using the template" are guidance for the
// writer, not policy, so they are left out.
//
// Inputs: profile.stack, profile.business, profile.context and answers['ai-register'].rows. Our own answers
// (answers['ai-policy']) hold picklist ids only. The policy text never goes into the profile.
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory()
  else root.APDraft = factory()
})(typeof self !== 'undefined' ? self : this, function () {
  const TOOL_ID = 'ai-policy'
  const ANSWERS_VERSION = '1.0'
  const TEMPLATE = {
    name: 'AI policy guide and template',
    by: 'National AI Centre, Guidance for AI Adoption',
    page: 'https://www.ai.gov.au/staying-safe-and-responsible/essential-ai-practices/create-ai-policy',
    file: 'https://www.ai.gov.au/sites/default/files/2026-06/AI-policy-guide-and-template.docx',
    checked: '22 October 2026'
  }

  // The template's structure: id, heading, level (1 section, 2 subsection).
  const SECTIONS = [
    ['purpose', 'Purpose', 1],
    ['scope', 'Scope', 1],
    ['statements', 'Policy statements', 1],
    ['ethical', 'Ethical and human-centred use', 2],
    ['accountability', 'Clear accountability', 2],
    ['risk', 'Risk and impact assessment', 2],
    ['quality', 'Quality, reliability and security', 2],
    ['fairness', 'Fairness and inclusion', 2],
    ['transparency', 'Transparency and contestability', 2],
    ['oversight', 'Human oversight and control', 2],
    ['governance', 'Governance and compliance', 1],
    ['roles', 'Roles and responsibilities', 2],
    ['new-use', 'New AI use case procedures', 2],
    ['incidents', 'Incident management', 2],
    ['review', 'Policy review', 1]
  ].map(s => ({ id: s[0], heading: s[1], level: s[2] }))

  function list(pairs) { return pairs.map(p => ({ id: p[0], label: p[1] })) }

  // The picklists this tool asks and saves.
  const PICK = {
    owner: list([
      ['business-owner', 'Business owner or director'], ['general-manager', 'General manager or CEO'],
      ['operations', 'Operations manager'], ['it', 'IT manager or provider'], ['privacy', 'Privacy or risk officer']
    ]),
    approver: list([
      ['business-owner', 'Business owner or director'], ['general-manager', 'General manager or CEO'],
      ['partners', 'The partners'], ['board', 'The board']
    ]),
    review: list([['6', 'Every six months'], ['12', 'Every year'], ['24', 'Every two years']]),
    personal: list([
      ['not-allowed', 'Business accounts only'],
      ['public-only', 'Personal accounts for public information only']
    ])
  }

  // Labels for the AI register's picklists (ai-register/js/model.js PICK). The test checks they still match.
  const REG = {
    owner: {
      'business-owner': 'Business owner or director', 'general-manager': 'General manager or CEO',
      operations: 'Operations manager', it: 'IT manager or provider', finance: 'Finance manager',
      marketing: 'Marketing lead', sales: 'Sales lead', 'customer-service': 'Customer service lead',
      hr: 'People and culture lead', practice: 'Practice manager', product: 'Product or engineering lead',
      privacy: 'Privacy or risk officer', 'other-role': 'Another role'
    },
    data: {
      public: 'Public information', internal: 'Internal business information',
      confidential: 'Business confidential (contracts, pricing, IP)', client: 'Client or customer records',
      personal: 'Personal information', sensitive: 'Sensitive information (health, biometric and the like)',
      financial: 'Financial or payment details', employee: 'Staff records', code: 'Source code',
      credentials: 'Passwords, keys or security data'
    },
    agentRole: {
      support: 'Customer support', sales: 'Sales and leads', research: 'Research', coding: 'Coding',
      operations: 'Operations and back office', finance: 'Finance and invoicing', helpdesk: 'IT help desk',
      scheduling: 'Scheduling and inbox', 'other-agent': 'Another job'
    },
    tools: {
      email: 'Email', calendar: 'Calendar', files: 'Files and documents', crm: 'CRM',
      accounting: 'Accounting and finance', payments: 'Payments', messaging: 'Chat and messaging',
      web: 'Web browsing', 'code-repo': 'Code repositories', database: 'Databases',
      tickets: 'Help desk tickets', shell: 'Running commands'
    },
    oversight: {
      'approve-all': 'A person approves every action', 'approve-high': 'A person approves high impact actions',
      'review-after': 'A person reviews afterwards', none: 'No human oversight'
    }
  }

  const SECTOR = {
    'professional-services': 'professional services', health: 'health', 'aged-care': 'aged care',
    disability: 'disability', education: 'education', 'financial-services': 'financial services',
    software: 'software', retail: 'retail', 'energy-utilities': 'energy and utilities',
    telecommunications: 'telecommunications', manufacturing: 'manufacturing'
  }
  const CARE_SECTORS = ['health', 'aged-care', 'disability', 'education', 'financial-services']
  const HIGH_IMPACT_TOOLS = ['email', 'payments', 'accounting', 'crm', 'database', 'shell', 'code-repo']

  // ---------- helpers ----------

  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v) }
  function arr(v) { return Array.isArray(v) ? v : [] }
  function str(v) { return typeof v === 'string' ? v : '' }
  function pickLabel(name, id) { const o = PICK[name].find(x => x.id === id); return o ? o.label : '' }
  function ok(name, v) { return PICK[name].some(o => o.id === v) }
  function lower(s) { return s && !/^[A-Z]{2}/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s }
  function andList(items) {
    if (items.length < 2) return items.join('')
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1]
  }
  function uniq(a) { return Array.from(new Set(a)) }
  function addMonths(iso, n) {
    const d = new Date(iso + 'T00:00:00Z')
    d.setUTCMonth(d.getUTCMonth() + n)
    return d.toISOString().slice(0, 10)
  }
  function auDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '')
    if (!m) return ''
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return Number(m[3]) + ' ' + months[Number(m[2]) - 1] + ' ' + m[1]
  }

  // KB names for platform ids, from /stack-check/data/index.json. Missing or failed index: ids stand in.
  function kbNames(index) {
    const names = new Map()
    if (isObj(index)) for (const p of arr(index.platforms).concat(arr(index.more_platforms))) {
      if (isObj(p) && typeof p.id === 'string' && typeof p.name === 'string' && !names.has(p.id)) names.set(p.id, p.name)
    }
    return names
  }

  // ---------- facts from the profile ----------

  function facts(profile, index) {
    const p = isObj(profile) ? profile : {}
    const names = kbNames(index)
    const nameOf = id => names.get(id) || id
    const stack = isObj(p.stack) ? p.stack : {}
    const business = isObj(p.business) ? p.business : {}
    const context = isObj(p.context) ? p.context : {}
    const answers = isObj(p.answers) ? p.answers : {}
    const reg = isObj(answers['ai-register']) ? answers['ai-register'] : {}

    const tools = new Map()   // key -> { name, status, owner, personal, risk }
    function tool(key, name) {
      if (!tools.has(key)) tools.set(key, { name, status: 'approved', owner: '', personal: false, risk: '' })
      return tools.get(key)
    }
    for (const raw of arr(stack.platforms)) {
      const item = typeof raw === 'string' ? { id: raw } : raw
      if (!isObj(item) || typeof item.id !== 'string' || !item.id) continue
      const t = tool('p:' + item.id, nameOf(item.id))
      if (item.status === 'trialling') t.status = 'trial'
      if (item.status === 'planned') t.status = 'planned'
      if (item.account === 'personal') t.personal = true
    }
    for (const n of arr(stack.unlisted)) if (typeof n === 'string' && n.trim()) tool('u:' + n.trim().toLowerCase(), n.trim())

    const agents = []
    const data = []
    let decisions = false
    let vulnerable = false
    let customerFacing = arr(context.ai_capabilities).indexOf('externally-facing') !== -1
    for (const r of arr(reg.rows)) {
      if (!isObj(r)) continue
      data.push(...arr(r.data).filter(d => REG.data[d]))
      if (arr(r.uses).indexOf('decisions') !== -1 || arr(r.uses).indexOf('recruitment') !== -1 || arr(r.affected).indexOf('applicants') !== -1) decisions = true
      if (arr(r.affected).indexOf('vulnerable') !== -1) vulnerable = true
      if (arr(r.users).indexOf('customers') !== -1) customerFacing = true
      if (r.kind === 'agent') {
        const a = isObj(r.agent) ? r.agent : {}
        if (r.status === 'decommissioned') continue
        agents.push({
          name: REG.agentRole[a.role] ? REG.agentRole[a.role] + ' agent' : 'AI agent',
          owner: REG.owner[r.owner] || '',
          oversight: str(a.oversight),
          identity: str(a.identity),
          tools: arr(a.tools).filter(x => REG.tools[x]),
          runsOn: a.runs_on ? nameOf(a.runs_on) : '',
          risk: str(r.risk)
        })
        continue
      }
      const key = r.platform ? 'p:' + r.platform : (r.unlisted ? 'u:' + String(r.unlisted).trim().toLowerCase() : '')
      if (!key) continue
      const t = tool(key, r.platform ? nameOf(r.platform) : String(r.unlisted).trim())
      if (r.status === 'decommissioned') { tools.delete(key); continue }
      if (r.status === 'pilot' && t.status === 'approved') t.status = 'trial'
      if (REG.owner[r.owner] && !t.owner) t.owner = REG.owner[r.owner]
      if (r.account === 'personal') t.personal = true
      if (r.risk === 'unacceptable') t.status = 'blocked'
      if (r.risk === 'elevated' && t.risk !== 'unacceptable') t.risk = 'elevated'
    }
    if (context.ai_decisions_about_people === 'yes') decisions = true
    const sens = str(context.data_sensitivity)
    if (sens === 'personal') data.push('personal')
    if (sens === 'sensitive') data.push('personal', 'sensitive')

    return {
      tools: Array.from(tools.values()),
      agents,
      data: Object.keys(REG.data).filter(d => data.indexOf(d) !== -1),
      decisions: decisions ? 'yes' : (context.ai_decisions_about_people === 'no' ? 'no' : 'unsure'),
      vulnerable: vulnerable || CARE_SECTORS.indexOf(business.sector) !== -1,
      customerFacing,
      sector: SECTOR[business.sector] || '',
      headcount: str(business.headcount),
      notForProfit: business.entity_type === 'not-for-profit',
      registerRows: arr(reg.rows).length,
      hasBusiness: Object.keys(business).length > 0 || Object.keys(context).length > 0
    }
  }

  // ---------- picks ----------

  // Saved picks win. Otherwise defaults follow the business size.
  function defaultPicks(f) {
    const small = f.headcount === '1-19' || !f.headcount
    return {
      owner: small ? 'business-owner' : 'general-manager',
      approver: f.headcount === '200-plus' ? 'board' : (small ? 'business-owner' : 'general-manager'),
      review: '12',
      personal: 'not-allowed'
    }
  }
  function cleanPicks(saved, f) {
    const out = defaultPicks(f)
    if (isObj(saved)) for (const k of Object.keys(PICK)) if (ok(k, saved[k])) out[k] = saved[k]
    return out
  }

  // ---------- drafting ----------

  function bullets(items) { return items.map(s => '- ' + s).join('\n') }
  function paras() { return Array.from(arguments).filter(Boolean).join('\n\n') }

  // Returns { title, meta, sections: [{ id, heading, level, text }] }. Text is plain, with "- " bullet lines and
  // blank lines between paragraphs, so it is Markdown as it stands. Square brackets mark what the reader fills in.
  function draft(f, picks, today) {
    const owner = lower(pickLabel('owner', picks.owner))
    const ownerRef = 'the AI policy owner (' + owner + ')'
    const approver = lower(pickLabel('approver', picks.approver))
    const months = Number(picks.review)
    const reviewText = lower(pickLabel('review', picks.review))
    const date = today || new Date().toISOString().slice(0, 10)
    const next = addMonths(date, months)
    const small = f.headcount === '1-19' || !f.headcount
    const large = f.headcount === '200-plus'

    const people = ['staff', 'contractors']
    if (f.notForProfit) people.push('volunteers')
    if (picks.approver === 'board') people.push('board members')

    const approved = f.tools.filter(t => t.status === 'approved' || t.status === 'trial')
    const planned = f.tools.filter(t => t.status === 'planned')
    const blocked = f.tools.filter(t => t.status === 'blocked')
    const personalTools = approved.filter(t => t.personal)
    const elevated = approved.filter(t => t.risk === 'elevated').map(t => t.name)
      .concat(f.agents.filter(a => a.risk === 'elevated').map(a => a.name))

    const T = {}
    T.purpose = paras(
      'This policy sets out how we use AI safely, lawfully and in line with our values. It aims to:',
      bullets([
        'protect our customers, staff and anyone else affected by our use of AI',
        'let staff use approved AI tools to do good work',
        'be open about where and how we use AI',
        'give us a clear way to find and manage AI risks'
      ])
    )

    const toolLines = approved.length
      ? approved.map(t => t.name + (t.status === 'trial' ? ' (trial)' : '') + (t.owner ? ', owner: ' + lower(t.owner) : ''))
      : ['[List the AI tools staff may use. Add them in My stack or the AI register to fill this in.]']
    T.scope = paras(
      'This policy applies to all ' + andList(people) + ' who use, buy or build AI for us. It covers every AI tool we use, whether we buy it, build it or get it inside other software.',
      'An AI system is any technology that uses data to produce predictions, recommendations, content or decisions. This includes generative AI tools, chatbots and AI agents. It does not include ordinary spreadsheet formulas, simple if-then rules or standard reports.',
      'Approved AI tools today (our AI register holds the full record):',
      bullets(toolLines),
      planned.length ? 'Planned, not approved yet: ' + andList(planned.map(t => t.name)) + '.' : '',
      blocked.length ? 'Not approved for use: ' + andList(blocked.map(t => t.name)) + '.' : '',
      'Any AI tool not on this list needs approval from ' + ownerRef + ' before anyone uses it for work. If you are not sure whether something is covered, ask the AI policy owner.'
    )

    T.statements = 'These statements apply to every AI tool in scope, together with our privacy, security and risk rules.'

    T.ethical = paras(
      'We use AI to support people\'s judgement, and people make the final call. AI must not be used to deceive, manipulate or harm anyone.',
      'Our use of AI should reflect Australia\'s AI Ethics Principles and our own values.'
    )

    const missingOwner = approved.filter(t => !t.owner).map(t => t.name)
    const ownerLines = approved.filter(t => t.owner).map(t => t.name + ': ' + lower(t.owner))
      .concat(f.agents.map(a => a.name + ': ' + (a.owner ? lower(a.owner) : '[owner role not set]')))
    T.accountability = paras(
      'Every AI tool has a named owner, chosen before the tool is used. The owner is responsible for how the tool is used, its results and its compliance with this policy. For tools from a vendor, the owner checks the vendor\'s terms on data use, model training and where data is stored.',
      ownerLines.length ? 'Owners by role:\n' + bullets(ownerLines) : '',
      missingOwner.length ? '[Choose an owner for ' + andList(missingOwner) + '.]' : ''
    )

    T.risk = paras(
      'Before we use a new AI tool, or an existing tool for a new purpose, we check its risks and who it could affect. We record the result in our AI register and put controls in place that match the risk.',
      elevated.length ? 'These uses are rated elevated risk and need extra checks before and during use: ' + andList(elevated) + '.' : ''
    )

    const dataRules = ['Never put passwords, keys or other security data into an AI tool.']
    if (f.data.indexOf('personal') !== -1 || f.data.indexOf('employee') !== -1 || f.data.indexOf('client') !== -1) {
      dataRules.push('Personal information and client records only go into tools approved for them, in line with the Privacy Act 1988 and the Australian Privacy Principles.')
    } else {
      dataRules.push('Do not put personal information or client records into an AI tool unless the AI policy owner has approved that tool for it.')
    }
    if (f.data.indexOf('sensitive') !== -1) dataRules.push('Sensitive information, such as health information, needs a privacy check and the AI policy owner\'s approval before any AI tool uses it.')
    dataRules.push(picks.personal === 'public-only'
      ? 'Personal AI accounts may only be used with public information, never with business, client or personal information.'
      : 'Use business accounts for AI tools. Personal AI accounts are not used for work.')
    const allowed = f.data.filter(d => d !== 'credentials').map(d => lower(REG.data[d]))
    T.quality = paras(
      'We test AI tools before we rely on them and keep checking them while they are in use. Staff check AI output for accuracy before they use or share it.',
      bullets(dataRules),
      allowed.length ? 'Information our AI register records going into AI tools today: ' + andList(allowed) + '.' : '',
      personalTools.length ? '[These tools are on personal plans: ' + andList(personalTools.map(t => t.name)) + '. Move them to business plans or limit them to public information.]' : ''
    )

    const fairness = ['AI must not lead to unfair treatment of any person or group, and should support our commitments to inclusion and accessibility.']
    if (f.decisions === 'yes') fairness.push('We use AI in decisions that affect people. A person reviews each of these decisions before it takes effect, and we check the results for unfair patterns.')
    else if (f.decisions === 'no') fairness.push('We do not use AI to make decisions about people. Any plan to do so goes through risk assessment first.')
    else fairness.push('[Confirm whether any AI tool helps make decisions about people, such as hiring, credit or service eligibility. If one does, a person must review each decision.]')
    if (f.vulnerable) fairness.push('We take extra care where AI affects vulnerable people' + (f.sector ? ', as a ' + f.sector + ' organisation' : '') + '.')
    T.fairness = paras.apply(null, fairness)

    T.transparency = paras(
      'We tell people when AI plays a part in something that matters to them, and we help them question an outcome.' + (f.customerFacing ? ' Customer-facing AI tools say they are AI.' : ''),
      'Every approved AI tool is recorded in our AI register. We keep enough information about important AI-assisted decisions to explain them.'
    )

    const oversight = ['People who use AI are responsible for what they do with its output. We must be able to pause, override or switch off any AI tool.']
    if (f.agents.length) {
      oversight.push('AI agents we run:\n' + bullets(f.agents.map(a => {
        const bits = [a.name]
        if (a.runsOn) bits.push('runs on ' + a.runsOn)
        bits.push(a.oversight && REG.oversight[a.oversight] ? lower(REG.oversight[a.oversight]) : '[oversight not set]')
        if (a.tools.length) bits.push('can use ' + andList(a.tools.map(x => lower(REG.tools[x]))))
        return bits.join(', ')
      })))
      oversight.push('Each agent works under its own identity, not a shared login or key. A person approves actions with real impact, such as sending email, making payments or changing records, before the agent takes them.')
      for (const a of f.agents) {
        if (a.oversight === 'none' || !a.oversight) oversight.push('[Set an approval step for the ' + a.name + '.]')
        else if (a.oversight === 'review-after' && a.tools.some(x => HIGH_IMPACT_TOOLS.indexOf(x) !== -1)) oversight.push('[The ' + a.name + ' can take high impact actions with review only afterwards. Decide whether a person should approve them first.]')
        if (a.identity === 'shared-key') oversight.push('[Move the ' + a.name + ' off its shared key or login.]')
      }
    } else {
      oversight.push('We do not run AI agents that act on their own. A new agent needs approval from ' + ownerRef + ' and an entry in the AI register before it runs.')
    }
    T.oversight = paras.apply(null, oversight)

    T.governance = 'These roles keep this policy working.'
    const roles = [
      'AI policy owner (' + owner + '): owns this policy and the AI register, approves new AI tools and makes sure people get the training they need.',
      'Policy approver (' + approver + '): approves this policy and any major change to it.'
    ]
    if (large) {
      roles.push('Compliance monitor ([team or role]): checks the policy is followed, tracks AI incidents and reports to the AI policy owner.')
      roles.push('AI governance committee ([members]): advises on flagged uses and approves high risk AI before it starts.')
    } else if (!small) {
      roles.push('Compliance monitor ([role]): checks the policy is followed and reports to the AI policy owner.')
    }
    roles.push('AI tool owners: each is accountable for one tool, its risk check and its entry in the AI register.')
    roles.push('All ' + andList(people) + ': follow this policy, complete AI training and report AI problems.')
    T.roles = paras(
      bullets(roles),
      small ? 'In a business our size, the AI policy owner also checks that the policy is followed.' : ''
    )

    T['new-use'] = 'Anyone who wants a new AI tool, or a new use for an existing one, asks ' + ownerRef + ' first. The owner screens it as normal, elevated or unacceptable risk, records it in the AI register and sets the checks needed before use. Unacceptable uses do not go ahead.'

    T.incidents = paras(
      'Report any AI mistake, data leak or unexpected behaviour to the tool owner or the AI policy owner straight away. We manage it under our usual incident process. If personal information is involved, we check whether the Notifiable Data Breaches scheme applies.',
      'We can take any AI tool offline and keep working by hand while we fix a problem.'
    )

    T.review = 'We review this policy ' + reviewText + ', and also after a serious AI incident, a major new AI tool, or a change in the law. ' +
      'The AI policy owner leads the review and ' + (/^the /.test(approver) ? approver : 'the ' + approver) + (picks.approver === 'partners' ? ' approve' : ' approves') +
      ' each new version. Next review due: ' + auDate(next) + '.'

    return {
      title: '[Organisation name] AI use policy',
      meta: 'Policy version date: ' + auDate(date) + '\nPolicy owner: ' + owner + '\nApproved by: ' + approver + '\nThis is a starting draft to review and adapt. It is not legal advice.',
      sections: SECTIONS.map(s => ({ id: s.id, heading: s.heading, level: s.level, text: T[s.id] }))
    }
  }

  // ---------- exports ----------

  function toMarkdown(doc) {
    const out = ['# ' + (doc.title || 'AI use policy').trim(), '', doc.meta.split('\n').join('  \n'), '']
    for (const s of doc.sections) {
      out.push((s.level === 1 ? '## ' : '### ') + s.heading, '')
      const t = String(s.text || '').replace(/\r\n/g, '\n').trim()
      if (t) out.push(t, '')
    }
    out.push('---', '', 'Sections follow the ' + TEMPLATE.name + ' (' + TEMPLATE.by + '): ' + TEMPLATE.page, '')
    return out.join('\n')
  }

  // Splits section text into blocks for the print view: { type: 'p', text } or { type: 'ul', items }.
  function blocks(text) {
    const out = []
    for (const chunk of String(text || '').replace(/\r\n/g, '\n').split(/\n\s*\n/)) {
      const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean)
      let para = []
      let items = null
      const flush = () => { if (para.length) { out.push({ type: 'p', text: para.join(' ') }); para = [] } }
      for (const l of lines) {
        if (/^[-*] /.test(l)) { flush(); if (!items) { items = []; out.push({ type: 'ul', items }) } items.push(l.slice(2)) }
        else { items = null; para.push(l) }
      }
      flush()
    }
    return out
  }

  // How much of the profile the draft used, for the one-line note on the page.
  function sourcesLine(f) {
    const bits = []
    bits.push(f.tools.length + ' AI tool' + (f.tools.length === 1 ? '' : 's'))
    bits.push(f.registerRows + ' AI register row' + (f.registerRows === 1 ? '' : 's') + (f.agents.length ? ' (' + f.agents.length + ' agent' + (f.agents.length === 1 ? '' : 's') + ')' : ''))
    bits.push(f.hasBusiness ? 'your AU Frameworks Check answers' : 'no AU Frameworks Check answers yet')
    return 'Drafted from ' + andList(bits) + '.'
  }

  return { TOOL_ID, ANSWERS_VERSION, TEMPLATE, SECTIONS, PICK, REG, facts, defaultPicks, cleanPicks, draft, toMarkdown, blocks, sourcesLine, kbNames, auDate, addMonths }
})
