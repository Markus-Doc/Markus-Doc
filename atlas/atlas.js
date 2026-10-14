// Ask the Atlas: an in-browser questionnaire over the public sample of the Offerings Atlas.
// No model and no server: concerns are routed by keyword, records come from the sample's OKF
// retrieval data, and every citation is checked against the record it came from. The walk is
// drawn as a node network: concerns, controls, the platforms you run, alternatives, the ways a
// gap can be filled, and the offerings that fill them. Gap logic follows atlas decision 0011:
// out of scope versus a real gap, and an evidence label for each gap. The model-written
// Client A run is included as the full version for comparison.
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const SVG = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PRESETS = [
    'How does agent-to-agent (A2A) authorisation work, and how do we stop one agent acting with another agent\'s permissions?',
    'What gateway do we need in front of models and MCP tools?',
    'Can prompts, outputs and agent memory stay in Australia?',
    'How do we make a person approve an agent action before it runs, with evidence of who approved it?',
    'How do we detect and stop prompt injection attacks against our agents?',
    'What audit evidence will we have of what an agent did?',
  ];
  const SCENARIOS = [
    { name: 'Security tools bought, no gateway', stack: ['wiz', 'okta-ai-agents'], concerns: [1, 4, 5], maturity: 'm3',
      note: 'Posture and identity are in place, but nothing sits in the path of model and tool traffic.' },
    { name: 'A gateway and tracing, little else', stack: ['litellm', 'langfuse'], concerns: [0, 3, 2], maturity: 'm2',
      note: 'A team-built platform: traffic is routed and traced, but identity, approval and governance are thin.' },
    { name: 'Model API and coding agents', stack: ['openai', 'github', 'claude-code'], concerns: [4, 5, 1], maturity: 'm1',
      note: 'Developers move fast on vendor tools, and most controls are covered only in part.' },
    { name: 'All in on Microsoft', stack: ['azure', 'microsoft-entra-agent-id', 'microsoft-purview'], concerns: [0, 2, 3], maturity: 'm4',
      note: 'One vendor covers a lot, so the gaps are in the detail of each partial control.' },
  ];
  const VERDICT = { supported: 'Supported', partial: 'Partial', 'not-addressed': 'Not addressed', unresolved: 'Unresolved' };
  const RANK = { supported: 0, partial: 1, unresolved: 2, 'not-addressed': 3 };
  const LABEL = {
    confirmed: 'Confirmed gap', likely: 'Likely gap', unchecked: 'Unchecked gap', disputed: 'Disputed',
    'out-of-scope': 'Out of scope',
  };
  const LABEL_HELP = {
    confirmed: 'Two independent searches to the standard found nothing.',
    likely: 'One search to the standard found nothing.',
    unchecked: 'The researcher found nothing, but no absence check has run yet.',
    disputed: 'A check found a feature, so this goes back to research.',
    'out-of-scope': 'The control is outside what this product is for, on an owner-accepted scope list.',
  };
  // Ways to fill a gap. Each control category has a default engineering and policy route.
  const FILL = {
    verify: { name: 'Confirm the gap first', short: 'Confirm', node: 'Confirm first' },
    configure: { name: 'Configure or upgrade what you own', short: 'Configure', node: 'Configure it' },
    policy: { name: 'Change governance or policy', short: 'Govern', node: 'Change policy' },
    extend: { name: 'Engineer in house', short: 'Engineer', node: 'Engineer it' },
    adopt: { name: 'Adopt a tool or service', short: 'Adopt', node: 'Adopt a tool' },
    managed: { name: 'Run it as a managed service', short: 'Operate', node: 'Operate it' },
    accept: { name: 'Accept the risk, on the record', short: 'Accept', node: 'Accept risk' },
  };
  // A partial record whose gap is about tiers, add-ons or settings can often be closed by
  // configuring or upgrading what the client already owns.
  const CONFIGURABLE = /\b(tier|licen[cs]e|add-on|addon|edition|premium|enterprise plan|enable|enabled|configur|setting|opt[- ]in|preview|beta)\b/i;
  // The engagement: an assessment first, then the workstreams the gaps call for, then upkeep.
  const WORKSTREAMS = [
    { id: 'assess', name: 'Stack assessment', always: true, routes: ['verify'],
      get: 'A validated gap register for your stack, each gap ranked by risk and given a route, and a roadmap you can act on with or without me.' },
    { id: 'configure', name: 'Configure and harden', routes: ['configure'],
      get: 'Settings, tiers and features you already pay for, turned on and evidenced, before anything new is bought.' },
    { id: 'select', name: 'Tool selection and procurement', routes: ['adopt'],
      get: 'A shortlist checked against the atlas, a bounded proof of concept, and contract terms for evidence, data location and roadmap commitments.' },
    { id: 'engineer', name: 'Control engineering', routes: ['extend'],
      get: 'The missing control built into your platforms: gateways, policy as code, sandboxes or telemetry, with tests and runbooks.' },
    { id: 'govern', name: 'Governance and policy', routes: ['policy', 'accept'],
      get: 'Policies, owners and procedures for the gaps that are about people and process, and a risk acceptance register with expiry dates.' },
    { id: 'operate', name: 'Managed assurance', routes: ['managed'],
      get: 'Continuous checks such as red teaming, discovery and detection run for you, with evidence each month.' },
    { id: 'current', name: 'Keep it current', always: true, routes: [],
      get: 'Your stack rechecked against the atlas whenever a vendor ships, so a gap that closes, or a new one, reaches you first.' },
  ];
  const ENGINEER = {
    Identity: 'Issue each agent its own workload identity and broker short-lived, scoped credentials outside the model context.',
    Authorisation: 'Express agent permissions as policy as code, scoped per agent and per tool, with deny by default.',
    Runtime: 'Run tools in an isolated sandbox with egress allow lists and a tested stop switch.',
    'Mediation / Policy Enforcement': 'Put a policy enforcement point in the request path, with routing, quotas and screening rules you own.',
    'Observability & Explainability': 'Instrument agents with OpenTelemetry traces that carry the user, the agent and the session.',
    'Agentic MLSecOps': 'Add the check to your build and release pipeline, with an inventory of the models, tools and packages you ship.',
    Governance: 'Build the register and workflow into the tools your teams already use, with named owners and review dates.',
  };
  const POLICY = {
    Identity: 'Set an agent identity standard: every agent has an owner, a purpose and an expiry.',
    Authorisation: 'Adopt a least-privilege standard for agents, with approval for any new permission.',
    Runtime: 'Define where agents may run and which actions always need a person.',
    'Mediation / Policy Enforcement': 'Write the rules the gateway enforces, and who may change them.',
    'Observability & Explainability': 'Decide what evidence you must keep, for how long, and who reviews it.',
    'Agentic MLSecOps': 'Make the check a release gate, with an owner who can stop a release.',
    Governance: 'Adopt the policy and operating procedure, with an accountable owner and a review cycle.',
  };
  const MANAGED = new Set(['c7-10', 'c7-2', 'c7-9', 'c7-3']);
  const POLICY_FIRST = new Set(['c1-3', 'c5-1']);
  let D, G, byRecord, byControl, byPlatform, byGroup, runToken = 0, lastRun = null, lastNet = null;

  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const plain = s => String(s ?? '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/`/g, '').replace(/\s+/g, ' ').trim();
  const sentence = s => { const t = plain(s).replace(/^(Source statement|Assessment|Source qualification|Proposed next action):\s*/i, ''); const m = t.match(/^(.{30,260}?[.])(\s|$)/); return m ? m[1] : t.slice(0, 240); };
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
  const el = (tag, attrs = {}, html) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (html !== undefined) e.innerHTML = html; return e; };
  const sv = (tag, attrs = {}) => { const e = document.createElementNS(SVG, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
  const wait = ms => reduced ? Promise.resolve() : new Promise(r => setTimeout(r, ms));
  const shortName = n => n.replace(/\s*\(.*\)$/, '');
  const syncAliases = () => document.querySelectorAll('input.alias').forEach(a => { a.checked = !!document.querySelector(`input[name="stack"][value="${CSS.escape(a.dataset.for)}"]`)?.checked; });
  const pname = id => shortName(byPlatform.get(id)?.name || id);
  const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

  async function load() {
    [D, G] = await Promise.all([fetch('/atlas/atlas-sample.json?v=20261014f').then(r => r.json()), fetch('/atlas/atlas-gaps.json?v=20261014f').then(r => r.json())]);
    byRecord = new Map(D.records.map(r => [r.id, r]));
    byControl = new Map(D.controls.map(c => [c.id, c]));
    byPlatform = new Map(D.platforms.map(p => [p.id, p]));
    byGroup = new Map(D.groups.map(g => [g.id, g]));
    $('reserved-count').textContent = String((D.reserved || []).length);
    $('atlas-scope').textContent = `This page holds ${D.platforms.length} of the atlas's ${D.atlas_totals.platforms} platforms and tools, across all ${D.controls.length} controls: ${D.records.length} records out of ${D.atlas_totals.cells.toLocaleString('en-AU')} researched cells, so most of what the atlas knows is not here.`;
    const m = $('maturity');
    for (const s of D.stages) m.append(new Option(`${s.id.toUpperCase()}: ${s.name}`, s.id));
    m.value = 'm2';
    const hint = () => { const s = D.stages.find(x => x.id === m.value); $('maturity-hint').textContent = s.typical_situation + '.'; };
    m.addEventListener('change', hint); hint();
    const stack = $('stack');
    for (const g of D.groups) {
      stack.append(el('p', { class: 'group-name' }, esc(g.name)));
      for (const p of D.platforms.filter(x => x.group === g.id)) {
        stack.append(el('label', { class: 'chip' }, `<input type="checkbox" name="stack" value="${esc(p.id)}"> ${esc(shortName(p.name))}`));
      }
      // A platform the atlas also places in this group: a linked chip that ticks the same platform.
      for (const [pid, extra] of Object.entries(G.also_in || {})) {
        if (!extra.includes(g.id) || !byPlatform.has(pid)) continue;
        stack.append(el('label', { class: 'chip alias', title: `Also in ${byGroup.get(byPlatform.get(pid).group)?.name || ''}` },
          `<input type="checkbox" class="alias" data-for="${esc(pid)}"> ${esc(shortName(byPlatform.get(pid).name))}<span class="visually-hidden"> (same platform as above)</span>`));
      }
      // Platforms in the full atlas that this demo sample leaves out: visible, greyed and not selectable.
      for (const r of (D.reserved || []).filter(x => x.group === g.id)) {
        stack.append(el('label', { class: 'chip reserved', title: 'Reserved for the full version of the atlas, not part of this demo sample.' },
          `<input type="checkbox" disabled aria-disabled="true"> ${esc(shortName(r.name))}<span class="visually-hidden"> (full version only)</span>`));
      }
    }
    for (const id of ['claude-code', 'okta-ai-agents', 'wiz', 'langfuse']) { const box = stack.querySelector(`input[value="${id}"]`); if (box) box.checked = true; }
    stack.addEventListener('change', ev => {
      const b = ev.target; if (!b.matches('input[type="checkbox"]')) return;
      const id = b.classList.contains('alias') ? b.dataset.for : b.value;
      const main = stack.querySelector(`input[name="stack"][value="${CSS.escape(id)}"]`); if (main) main.checked = b.checked;
      syncAliases();
    });
    syncAliases();
    const presets = $('concern-presets');
    PRESETS.forEach((text, i) => presets.append(el('label', { class: 'chip' }, `<input type="checkbox" name="concern" value="${i}"${i < 2 || i === 3 ? ' checked' : ''}> ${esc(text)}`)));
    $('atlas-form').addEventListener('submit', e => { e.preventDefault(); runLive(); });
    $('term').addEventListener('click', ev => {
      const b = ev.target.closest('button.wl'); if (!b || !lastNet) return;
      const id = b.dataset.id;
      if (b.dataset.kind === 'record' && byRecord.has(id)) showRecord(byRecord.get(id));
      else if (b.dataset.kind === 'control') { const n = lastNet.nodes.get(`c:${id}`); if (n) showControl(n.assessed); }
      else if (b.dataset.kind === 'offering') { const n = lastNet.nodes.get(`o:${id}`); if (n) showOffering(n.offering); }
    });
    $('example').addEventListener('click', runExample);
    const sc = $('scenarios');
    SCENARIOS.forEach(s => {
      const b = el('button', { type: 'button', class: 'scenario' }, `<strong>${esc(s.name)}</strong><span>${esc(s.note)}</span>`);
      b.addEventListener('click', () => {
        $('maturity').value = s.maturity; $('maturity').dispatchEvent(new Event('change'));
        document.querySelectorAll('input[name="stack"]').forEach(x => { x.checked = s.stack.includes(x.value); });
        document.querySelectorAll('input[name="concern"]').forEach(x => { x.checked = s.concerns.includes(+x.value); });
        $('concern-own').value = ''; $('full-scan').checked = true;
        runLive();
        $('out-title').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      });
      sc.append(b);
    });
    drawEmpty();
  }

  // ---------- routing and gathering ----------
  function route(concern) {
    const controls = [], groups = [], hits = [];
    for (const r of D.router) {
      const m = concern.match(new RegExp(r.pattern, 'i'));
      if (!m) continue;
      hits.push(m[0].toLowerCase());
      for (const c of r.controls) if (byControl.has(c) && !controls.includes(c)) controls.push(c);
      for (const g of r.groups) if (!groups.includes(g)) groups.push(g);
    }
    return { concern, controls: controls.slice(0, 4).length ? controls.slice(0, 4) : ['c6-7'], groups: groups.slice(0, 3), hits, fallback: !controls.length };
  }

  function alternatives(stackIds, c, groups = []) {
    const pool = D.platforms.filter(p => !stackIds.includes(p.id));
    const inGroups = pool.filter(p => groups.includes(p.group));
    return (inGroups.length ? inGroups : pool).map(p => byRecord.get(`${p.id}--${c}`))
      .filter(x => x && (x.verdict === 'supported' || x.verdict === 'partial'))
      .sort((a, b) => RANK[a.verdict] - RANK[b.verdict] || (b.basis === 'agent-verified') - (a.basis === 'agent-verified'))
      .slice(0, 2);
  }

  function gather(stackIds, r) {
    const records = [];
    for (const c of r.controls) {
      const own = stackIds.map(p => byRecord.get(`${p}--${c}`)).filter(Boolean);
      records.push(...own.map(x => ({ ...x, role: 'in_stack' })));
      if (own.some(x => x.verdict === 'supported')) continue;
      records.push(...alternatives(stackIds, c, r.groups).map(x => ({ ...x, role: 'alternative' })));
    }
    return records;
  }

  // ---------- gap logic (decision 0011) ----------
  // A not-addressed record is out of scope when its platform's accepted list names the control,
  // and otherwise a real gap with an evidence label.
  function gapOf(rec) {
    if (!rec || rec.verdict !== 'not-addressed') return null;
    const scope = G.scope[rec.p];
    if (scope && scope.out_of_scope.includes(rec.c)) return { kind: 'out-of-scope', label: 'out-of-scope', scopeStatus: scope.status };
    const exp = G.experiment[rec.id];
    return { kind: 'in-scope-gap', label: exp ? exp.label : (G.gap_status[rec.id] || 'unchecked'), found: exp?.found, scopeStatus: scope?.status };
  }

  // One control against the whole stack: covered, partly covered or a gap, and how to fill it.
  function assess(stackIds, c, groups) {
    const cap = byControl.get(c);
    const own = stackIds.map(p => byRecord.get(`${p}--${c}`)).filter(Boolean);
    const sup = own.filter(x => x.verdict === 'supported'), par = own.filter(x => x.verdict === 'partial');
    const gaps = own.filter(x => x.verdict === 'not-addressed').map(x => ({ rec: x, ...gapOf(x) }));
    const status = sup.length ? 'covered' : par.length ? 'partial' : 'gap';
    const fills = [];
    if (status !== 'covered') {
      const alts = alternatives(stackIds, c, groups);
      const inScope = gaps.filter(g => g.kind === 'in-scope-gap');
      const disputed = inScope.filter(g => g.label === 'disputed');
      if (disputed.length) fills.push({ type: 'verify', text: `${list(disputed.map(g => pname(g.rec.p)))} may already cover part of this. A recheck found a feature, so the atlas sends it back to research before you buy anything.` });
      else if (status === 'gap' && inScope.some(g => g.label === 'unchecked')) fills.push({ type: 'verify', text: `${list(inScope.filter(g => g.label === 'unchecked').map(g => pname(g.rec.p)))} should cover this but nothing is documented. Confirm with the vendor and its release notes before you fill it another way.` });
      if (POLICY_FIRST.has(c) || cap.category === 'Governance') fills.push({ type: 'policy', text: POLICY[cap.category] });
      const tiered = par.find(x => CONFIGURABLE.test(`${x.gaps} ${x.answer}`));
      if (tiered) fills.push({ type: 'configure', text: `Check the settings and tier you have on ${pname(tiered.p)}: ${sentence(tiered.gaps || tiered.answer)}` });
      if (par.length) fills.push({ type: 'extend', text: `Close what ${list(par.map(x => pname(x.p)))} leave${par.length > 1 ? '' : 's'} open: ${sentence(par[0].gaps || par[0].answer)}` });
      if (alts.length) fills.push({ type: 'adopt', text: `${list(alts.map(a => `${pname(a.p)} (${VERDICT[a.verdict].toLowerCase()})`))} cover${alts.length > 1 ? '' : 's'} this in the sample.`, alts });
      if (!par.length) fills.push({ type: 'extend', text: ENGINEER[cap.category] });
      if (MANAGED.has(c)) fills.push({ type: 'managed', text: 'A managed service can run this continuously while your team builds the capability.' });
      if (!POLICY_FIRST.has(c) && cap.category !== 'Governance') fills.push({ type: 'policy', text: POLICY[cap.category] });
      if (status === 'partial') fills.push({ type: 'accept', text: 'If what is left is low risk for you, accept it for now with a named owner, a reason and an expiry date, and review it when the date comes.' });
    }
    const kept = dedupe(fills);
    const primary = kept.find(f => f.type !== 'verify' && f.type !== 'accept');
    if (primary) primary.primary = true;
    return { c, cap, status, sup, par, gaps, fills: kept, primary: primary?.type };
  }
  const dedupe = fills => fills.filter((f, i) => fills.findIndex(g => g.type === f.type) === i).slice(0, 5);

  // The engagement this stack calls for: each open control is placed in the workstreams of its
  // fill routes, and a workstream is sized by how many open controls it takes on.
  function offerings(assessed, maturity) {
    const open = assessed.filter(a => a.status !== 'covered');
    const pkg = D.packages.find(p => p.maturity_id === maturity);
    const size = n => n >= 6 ? 'Large' : n >= 3 ? 'Medium' : 'Small';
    const rows = WORKSTREAMS.map(w => {
      const closes = w.id === 'assess' ? open : w.id === 'current' ? [] : open.filter(a => w.routes.includes(a.primary));
      const also = w.always ? [] : open.filter(a => !closes.includes(a) && a.fills.some(f => w.routes.includes(f.type)));
      return { ...w, closes, also, routes: w.routes, size: w.always ? null : closes.length ? size(closes.length) : 'Optional' };
    }).filter(w => w.always || w.closes.length || w.also.length)
      .sort((a, b) => (a.id === 'current') - (b.id === 'current') || (b.closes.length > 0) - (a.closes.length > 0));
    // Workstreams that are only ever a fallback are listed after the ones the gaps need.
    return { pkg, stage: D.stages.find(s => s.id === maturity), rows, open };
  }

  function compose(r, records) {
    const parts = [], claims = [];
    for (const c of r.controls) {
      const name = byControl.get(c).name;
      const own = records.filter(x => x.c === c && x.role === 'in_stack');
      const alts = records.filter(x => x.c === c && x.role === 'alternative');
      const names = v => own.filter(x => x.verdict === v).map(x => pname(x.p));
      const sup = names('supported'), par = names('partial');
      if (sup.length) parts.push(`${name}: your stack supports it through ${list(sup)}${par.length ? `, with ${list(par)} in part` : ''}.`);
      else if (par.length) parts.push(`${name}: your stack covers it only in part, through ${list(par)}.`);
      else parts.push(`${name}: nothing in your stack covers it${alts.length ? `. The sample points to ${list(alts.map(a => `${pname(a.p)} (${VERDICT[a.verdict].toLowerCase()})`))}` : ''}.`);
      const carrying = own.filter(x => x.verdict === 'supported' || x.verdict === 'partial').sort((a, b) => RANK[a.verdict] - RANK[b.verdict]).slice(0, 3);
      for (const x of [...carrying, ...alts]) claims.push({ text: `${pname(x.p)}, ${name}: ${sentence(x.answer)}`, finding_id: x.id, source_url: x.sources[0] || '', record: x });
    }
    for (const c of claims) c.check = c.source_url && c.record.sources.includes(c.source_url) ? 'pass' : (c.source_url ? 'fail' : 'no source');
    return { summary: parts.join(' '), claims };
  }

  // ---------- the node network ----------
  function drawEmpty() {
    const svg = $('trace'); svg.querySelectorAll(':not(title):not(desc)').forEach(n => n.remove());
    svg.setAttribute('viewBox', '0 0 800 240');
    const t = sv('text', { x: 400, y: 126, 'text-anchor': 'middle', class: 'empty' }); t.textContent = 'Choose your stack and concerns, then walk the knowledge base.';
    svg.append(t);
  }

  // Layered force layout: each kind keeps its column, and repulsion and edge springs settle the
  // rows, so the walk reads left to right but the graph still behaves like a network.
  const W = 800;
  const LAYER = { concern: 58, control: 205, platform: 375, alt: 375, fill: 598, offering: 712 };
  function network(routes, assessed, offer, stackIds) {
    const nodes = new Map(), edges = [];
    const add = (key, kind, label, extra = {}) => { if (!nodes.has(key)) nodes.set(key, { key, kind, label, ...extra }); return nodes.get(key); };
    const link = (a, b, cls, step) => { if (!edges.some(e => e.a === a && e.b === b)) edges.push({ a, b, cls, step }); };
    routes.forEach((r, i) => add(`q${i}`, 'concern', `${i + 1}. ${r.concern.length > 60 ? r.concern.slice(0, 58).replace(/\s+\S*$/, '') + '...' : r.concern}`, { title: r.concern, route: r }));
    const fromConcern = new Map();
    routes.forEach((r, i) => r.controls.forEach(c => { if (!fromConcern.has(c)) fromConcern.set(c, []); fromConcern.get(c).push(i); }));
    assessed.forEach((a, ai) => {
      add(`c:${a.c}`, 'control', a.cap.name, { status: a.status, assessed: a });
      (fromConcern.get(a.c) || []).forEach(i => link(`q${i}`, `c:${a.c}`, 'route', 1));
      for (const x of [...a.sup, ...a.par]) { add(`p:${x.p}`, 'platform', pname(x.p)); link(`c:${a.c}`, `p:${x.p}`, `v-${x.verdict}`, 2); }
      for (const g of a.gaps) { add(`p:${g.rec.p}`, 'platform', pname(g.rec.p)); link(`c:${a.c}`, `p:${g.rec.p}`, g.kind === 'out-of-scope' ? 'v-out' : `v-gap g-${g.label}`, 2); }
      for (const f of a.fills) {
        if (f.type === 'adopt') for (const x of f.alts) { add(`a:${x.p}`, 'alt', pname(x.p)); link(`c:${a.c}`, `a:${x.p}`, `v-alt v-${x.verdict}`, 3); }
        add(`f:${f.type}`, 'fill', FILL[f.type].node, { title: FILL[f.type].name }); link(`c:${a.c}`, `f:${f.type}`, 'fill', 3);
      }
    });
    for (const o of offer.rows.filter(o => o.closes.length)) {
      add(`o:${o.id}`, 'offering', o.name, { offering: o });
      const feeds = o.id === 'assess' ? Object.keys(FILL) : o.routes;
      for (const t of feeds) if (nodes.has(`f:${t}`)) link(`f:${t}`, `o:${o.id}`, 'offer', 4);
    }
    for (const p of stackIds) if (!nodes.has(`p:${p}`)) add(`p:${p}`, 'platform', pname(p), { idle: true });
    // Initial rows by order of appearance, then relax.
    const N = [...nodes.values()];
    const cols = {};
    for (const n of N) { const k = LAYER[n.kind]; (cols[k] ||= []).push(n); }
    const rows = Math.max(...Object.values(cols).map(a => a.length));
    const H = Math.max(320, 80 + rows * 40);
    for (const arr of Object.values(cols)) arr.forEach((n, i) => { n.x = LAYER[n.kind] + (n.kind === 'alt' ? 24 : 0); n.y = 50 + (H - 90) * (arr.length === 1 ? .5 : i / (arr.length - 1)); n.vy = 0; });
    const byKey = k => nodes.get(k);
    for (let it = 0; it < 220; it++) {
      for (const n of N) n.fy = 0;
      for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
        const a = N[i], b = N[j]; const dx = a.x - b.x; if (Math.abs(dx) > 120) continue;
        const dy = (a.y - b.y) || .5, d2 = dy * dy + dx * dx * .2; const f = 1600 / Math.max(d2, 60);
        a.fy += Math.sign(dy) * f; b.fy -= Math.sign(dy) * f;
      }
      for (const e of edges) { const a = byKey(e.a), b = byKey(e.b); const dy = b.y - a.y; a.fy += dy * .012; b.fy -= dy * .012; }
      for (const n of N) { n.vy = (n.vy + n.fy) * .6; n.y = Math.min(H - 30, Math.max(36, n.y + n.vy)); }
    }
    // Keep labels apart: sort each column and push nodes to at least 34 units apart, then
    // centre the column in the frame.
    for (const arr of Object.values(cols)) {
      arr.sort((a, b) => a.y - b.y);
      const gap = arr.some(n => n.kind === 'concern') ? 88 : arr.some(n => n.kind === 'offering') ? 66 : 34;
      for (let i = 1; i < arr.length; i++) arr[i].y = Math.max(arr[i].y, arr[i - 1].y + gap);
      const span = arr[arr.length - 1].y - arr[0].y, top = Math.max(40, (H - span) / 2);
      const shift = top - arr[0].y; arr.forEach(n => { n.y += shift; });
    }
    const maxY = Math.max(...N.map(n => n.y));
    const Hfit = Math.max(H, maxY + 50);
    return { nodes, edges, H: Hfit, N };
  }

  function drawNetwork(net) {
    const svg = $('trace'); svg.querySelectorAll(':not(title):not(desc)').forEach(n => n.remove());
    svg.setAttribute('viewBox', `0 0 ${W} ${net.H}`);
    for (const [x, t] of [[58, 'CONCERNS'], [232, 'CONTROLS'], [405, 'PLATFORMS'], [628, 'HOW TO FILL'], [752, 'WORKSTREAMS']]) {
      const c = sv('text', { x, y: 16, 'text-anchor': 'middle', class: 'col' }); c.textContent = t; svg.append(c);
    }
    const eg = sv('g'), pg = sv('g'), ng = sv('g'); svg.append(eg, pg, ng);
    for (const e of net.edges) {
      const a = net.nodes.get(e.a), b = net.nodes.get(e.b); const mx = (a.x + b.x) / 2;
      e.d = `M${a.x} ${a.y}C${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`;
      e.el = sv('path', { d: e.d, class: `edge ${e.cls}`, 'data-a': e.a, 'data-b': e.b }); eg.append(e.el);
    }
    for (const n of net.N) {
      const cls = `node n-${n.kind} dim` + (n.status ? ` s-${n.status}` : '') + (n.idle ? ' idle' : '');
      const clickable = n.kind === 'control' || n.kind === 'offering';
      const g = sv('g', { class: cls, 'data-key': n.key, tabindex: clickable ? 0 : -1, role: clickable ? 'button' : 'presentation' });
      const r = { concern: 8, control: 7, platform: 7, alt: 6, fill: 9, offering: 10 }[n.kind];
      if (n.kind === 'fill' || n.kind === 'offering') g.append(sv('rect', { x: n.x - r, y: n.y - r, width: 2 * r, height: 2 * r, rx: n.kind === 'fill' ? 3 : r * .4 }));
      else g.append(sv('circle', { cx: n.x, cy: n.y, r }));
      const left = n.kind === 'concern';
      const t = sv('text', { x: left ? n.x - 14 : n.x + r + 6, y: n.y + 4, 'text-anchor': left ? 'end' : 'start' });
      if (left) { t.setAttribute('x', n.x - 52); t.setAttribute('text-anchor', 'start'); t.setAttribute('y', n.y + 22); wrap(t, n.label, 20); }
      else if (n.kind === 'offering') wrap(t, n.label, 12);
      else t.textContent = n.label;
      g.append(t);
      const title = sv('title'); title.textContent = (n.title || n.label) + (n.status ? `: ${n.status === 'covered' ? 'covered' : n.status === 'partial' ? 'covered in part' : 'a gap'}` : ''); g.append(title);
      if (clickable) {
        const open = () => n.kind === 'control' ? showControl(n.assessed) : showOffering(n.offering);
        g.addEventListener('click', open); g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); } });
      }
      ng.append(g); n.el = g;
    }
    return {
      light: key => net.nodes.get(key)?.el.classList.remove('dim'),
      edge: async e => {
        e.el.classList.add('lit');
        if (reduced) return;
        const dot = sv('circle', { r: 3.2, class: 'pulse' }); pg.append(dot);
        const len = e.el.getTotalLength(), t0 = performance.now(), dur = 420;
        await new Promise(res => { const step = now => { const k = Math.min(1, (now - t0) / dur); const p = e.el.getPointAtLength(len * k); dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); k < 1 ? requestAnimationFrame(step) : res(); }; requestAnimationFrame(step); });
        dot.remove();
      },
    };
  }

  function wrap(t, text, width) {
    t.textContent = '';
    const words = text.split(' '); let line = '', dy = 0;
    const flush = () => { const s = sv('tspan', { x: t.getAttribute('x'), dy: dy ? 13 : 0 }); s.textContent = line; t.append(s); dy++; line = ''; };
    for (const w of words) { if ((line + ' ' + w).trim().length > width && line) flush(); line = (line + ' ' + w).trim(); }
    if (line) flush();
  }

  // ---------- the traversal terminal ----------
  // Streams each hop as the walk runs: what was visited, why, and the record behind it. Wiki
  // links open the record or control. Capped so a full scan cannot grow the page.
  let t0 = 0;
  const TERM_MAX = 600;
  const wl = (kind, id, text) => `<button type="button" class="wl" data-kind="${kind}" data-id="${esc(id)}">[[${esc(text)}]]</button>`;
  const kv = (k, v, cls = '') => `<span class="k">${esc(k)}=</span><span class="v ${cls}">${esc(v)}</span>`;
  function term(html, cls = '') {
    const box = $('term'); if (!box) return;
    const ms = t0 ? ((performance.now() - t0) / 1000).toFixed(2).padStart(5, '0') : '00.00';
    box.append(el('div', { class: `ln ${cls}` }, `<span class="ts">[+${ms}s]</span> ${html}`));
    while (box.childElementCount > TERM_MAX) box.firstElementChild.remove();
    box.scrollTop = box.scrollHeight;
  }
  function hop(e, net) {
    const a = net.nodes.get(e.a), b = net.nodes.get(e.b);
    if (a.kind === 'concern') {
      const r = a.route, c = e.b.slice(2);
      const why = r.hits?.length ? `matched ${r.hits.map(h => `"${h}"`).join(', ')}` : r.fallback ? 'no keyword matched, fell back' : 'routed by the model';
      return `<span class="op route">route</span> q${e.a.slice(1)} &rarr; ${wl('control', c, `controls/${c}|${byControl.get(c)?.name || c}`)} <span class="why"># ${esc(why)}</span>`;
    }
    if (a.kind === 'control' && (b.kind === 'platform' || b.kind === 'alt')) {
      const c = e.a.slice(2), pid = e.b.slice(2), r = byRecord.get(`${pid}--${c}`);
      if (!r) return null;
      const g = gapOf(r), alt = b.kind === 'alt';
      const vcls = { supported: 'ok', partial: 'warn', 'not-addressed': 'bad', unresolved: 'bad' }[r.verdict];
      const src = r.sources?.[0] ? kv('src', host(r.sources[0])) : kv('src', 'none recorded', 'dim');
      return `<span class="op ${alt ? 'alt' : 'read'}">${alt ? 'alt ' : 'read'}</span> ${wl('record', r.id, `columns/${pid}/${c}`)} ${kv('verdict', r.verdict, vcls)} ${kv('basis', r.basis)}${g ? ' ' + kv('gap', g.label, g.kind === 'out-of-scope' ? 'dim' : 'bad') : ''} ${src}${alt ? ' <span class="why"># nothing in your stack fully covers it</span>' : ''}`;
    }
    if (a.kind === 'control' && b.kind === 'fill') {
      const as = a.assessed, f = as.fills.find(x => `f:${x.type}` === e.b);
      return `<span class="op fill">fill</span> ${wl('control', as.c, `controls/${as.c}|${as.cap.name}`)} &rarr; ${esc(FILL[f.type].name.toLowerCase())}${f.primary ? ' <span class="v ok">recommended</span>' : ''} <span class="why"># ${esc(as.status === 'partial' ? 'covered in part' : 'not covered')}</span>`;
    }
    if (b.kind === 'offering') {
      const o = b.offering;
      return `<span class="op plan">plan</span> ${esc(FILL[e.a.slice(2)]?.name.toLowerCase() || e.a)} &rarr; ${wl('offering', o.id, `workstreams/${o.id}|${o.name}`)} ${kv('covers', String(o.closes.length))}${o.size ? ' ' + kv('size', o.size.toLowerCase()) : ''}`;
    }
    return null;
  }

  // ---------- output ----------
  const log = html => { const li = el('li', {}, html); $('trace-log').append(li); li.scrollIntoView({ block: 'nearest' }); };

  async function walk(net, T, token) {
    const steps = [1, 2, 3, 4];
    for (const n of net.N.filter(n => n.kind === 'platform')) T.light(n.key);
    for (const s of steps) {
      const es = net.edges.filter(e => e.step === s);
      const starts = new Set(es.map(e => e.a));
      if (s === 1) net.N.filter(n => n.kind === 'concern').forEach(n => T.light(n.key)); else starts.forEach(k => T.light(k));
      term(`<span class="stage">## stage ${s}: ${['', 'route concerns to controls', 'read records for your stack', 'find alternatives and ways to fill', 'group routes into workstreams'][s]} (${es.length} hops)</span>`);
      log({ 1: 'Routed each concern to the controls it is about.', 2: 'Read the records for every platform you run against those controls, and sorted each gap into out of scope or a real gap.',
            3: 'For each open control, looked for alternatives in the sample and the ways the gap could be filled.', 4: 'Grouped the ways to fill each gap into the workstreams of an engagement.' }[s]);
      const batch = es.length > 60 ? 10 : 4;
      for (let i = 0; i < es.length; i += batch) {
        if (token !== runToken) return false;
        await Promise.all(es.slice(i, i + batch).map(e => { const line = hop(e, net); if (line) term(line); return T.edge(e).then(() => T.light(e.b)); }));
      }
      await wait(160);
    }
    return true;
  }

  function claimItem(c) {
    const r = c.record || byRecord.get(c.finding_id);
    const li = el('li', { class: (c.role || r?.role) === 'alternative' ? 'alt' : '' });
    li.innerHTML = `${esc(plain(c.text))}${c.source_url ? ` <a href="${esc(c.source_url)}" target="_blank" rel="noopener noreferrer">${esc(host(c.source_url))}</a>` : ''}`;
    const meta = el('div', { class: 'claim-meta' });
    if (r) meta.innerHTML += `<span class="tag ${esc(r.verdict)}">${esc(VERDICT[r.verdict])}</span>`;
    const basis = c.basis || r?.basis;
    if (basis) meta.innerHTML += `<span class="tag${basis === 'agent-verified' ? ' verified' : ''}">${esc(basis.replace('-', ' '))}</span>`;
    const check = c.check || c.citation_check;
    meta.innerHTML += `<span class="tag ${check === 'pass' ? 'pass' : 'fail'}">citation check ${esc(check)}</span>`;
    if (r) { const b = el('button', { type: 'button' }, 'Open the record'); b.addEventListener('click', () => showRecord(r)); meta.append(b); }
    else meta.innerHTML += '<span>record outside the public sample</span>';
    li.append(meta);
    return li;
  }

  function answerBlock(i, r, a, model) {
    const box = el('article', { class: 'answer' });
    box.append(el('h3', {}, `${i + 1}. ${esc(r.concern)}`));
    const how = model ? `Routed by a model to ${esc(r.controls.map(c => byControl.get(c)?.name || c).join(', '))}.`
      : r.fallback ? 'No keyword matched, so it fell back to Risk Assessment and Classification.'
      : `Routed by the words ${r.hits.map(h => `<code>${esc(h)}</code>`).join(', ')} to ${esc(r.controls.map(c => byControl.get(c).name).join(', '))}.`;
    box.append(el('p', { class: 'route' }, how));
    box.append(el('p', { class: 'summary' }, esc(a.summary)));
    const ul = el('ul', { class: 'claims' }); a.claims.forEach(c => ul.append(claimItem(c))); box.append(ul);
    const unknown = a.unknowns; const steps = a.next_steps;
    if (unknown?.length) { box.append(el('h4', {}, 'What the knowledge base does not settle')); const g = el('ul', { class: 'plain' }); unknown.forEach(x => g.append(el('li', {}, esc(x)))); box.append(g); }
    if (steps?.length) { box.append(el('h4', {}, 'Next steps')); const s = el('ul', { class: 'plain' }); steps.forEach(x => s.append(el('li', {}, esc(x)))); box.append(s); }
    return box;
  }

  const labelTag = label => `<span class="tag lab-${esc(label)}" title="${esc(LABEL_HELP[label] || '')}">${esc(LABEL[label] || label)}</span>`;
  const fillTag = t => `<span class="fill-tag f-${t}">${esc(FILL[t].short)}</span>`;

  function report(assessed, offer, stackIds) {
    const box = el('section', { class: 'report', 'aria-labelledby': 'report-title' });
    const n = s => assessed.filter(a => a.status === s).length;
    const toClose = n('partial') + n('gap');
    box.innerHTML = `<h2 id="report-title" class="atlas-h2">What your stack covers</h2>
      <p class="report-head">${toClose ? `<strong>${toClose} of ${assessed.length} controls have a gap to close.</strong> ${n('gap') ? `${n('gap')} ${n('gap') > 1 ? 'are' : 'is'} not covered at all, and ${n('partial')} ${n('partial') === 1 ? 'is' : 'are'} only partly covered.` : `All ${n('partial')} are partly covered, so something in your stack touches them but leaves part of the control open.`}` : `<strong>All ${assessed.length} controls are covered.</strong>`}</p>
      <p class="report-sum"><span class="sum s-covered"><strong>${n('covered')}</strong> covered</span><span class="sum s-partial"><strong>${n('partial')}</strong> partly covered</span><span class="sum s-gap"><strong>${n('gap')}</strong> not covered</span><span class="sum-note">across the ${assessed.length} controls your concerns${$('full-scan').checked ? ' and the full scan' : ''} reached, for ${esc(list(stackIds.map(pname)))}.</span></p>`;
    const covered = assessed.filter(a => a.status === 'covered');
    if (covered.length) {
      box.append(el('h3', { class: 'report-h3' }, 'Covered'));
      const ul = el('ul', { class: 'covered-list' });
      for (const a of covered) ul.append(el('li', {}, `<button type="button" class="link">${esc(a.cap.name)}</button> <span class="by">by ${esc(list(a.sup.map(x => pname(x.p))))}</span>`));
      ul.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => showControl(covered[i])));
      box.append(ul);
    }
    const open = assessed.filter(a => a.status !== 'covered').sort((a, b) => (a.status === 'partial') - (b.status === 'partial'));
    if (open.length) {
      box.append(el('h3', { class: 'report-h3' }, 'Gaps to fill, and how'));
      for (const a of open) {
        const card = el('article', { class: `gap-card s-${a.status}` });
        const gl = a.gaps.map(g => `${esc(pname(g.rec.p))} ${labelTag(g.label)}`).join(' ');
        card.innerHTML = `<header><h4>${esc(a.cap.name)}</h4><span class="tag ${a.status === 'partial' ? 'partial' : 'not-addressed'}">${a.status === 'partial' ? `Partly covered, by ${esc(list(a.par.map(x => pname(x.p))))}` : 'Not covered by anything you run'}</span></header>
          <p class="cat">${esc(a.cap.category)}: ${esc(a.cap.definition)}</p>
          ${gl ? `<p class="gap-labels">${gl}</p>` : ''}
          <ol class="fills">${a.fills.map(f => `<li${f.primary ? ' class="primary"' : ''}>${fillTag(f.type)} <span>${esc(f.text)}</span>${f.primary ? ' <span class="rec">Recommended</span>' : ''}</li>`).join('')}</ol>`;
        box.append(card);
      }
    }
    return box;
  }

  function offerBlock(offer) {
    const box = el('section', { class: 'offer', 'aria-labelledby': 'offer-title' });
    box.innerHTML = `<h2 id="offer-title" class="atlas-h2">What I would propose</h2>
      <p>You sit at <strong>${esc(offer.stage.name.toLowerCase())}</strong>: ${esc(offer.stage.planning_focus.toLowerCase())}. For a stack like yours I would start with an assessment, then take on only the workstreams your gaps call for. Each workstream is a fixed package with its own statement of work, so you can buy one, several or none.</p>`;
    if (!offer.open.length) { box.append(el('p', {}, 'Nothing in the sample is open for these controls. The assessment would confirm that against the full atlas, and keeping it current would watch for change.')); }
    const ol = el('ol', { class: 'offer-list' });
    offer.rows.forEach(o => {
      const li = el('li', { class: `offer-item w-${o.id}` });
      const what = o.id === 'assess' ? `All ${offer.open.length} open controls in this run` : o.id === 'current' ? 'Every control in your stack, as vendors ship' : o.closes.length ? list(o.closes.map(a => a.cap.name)) : 'None as the first choice';
      li.innerHTML = `<header><h3>${esc(o.name)}</h3>${o.size ? `<span class="tag size">${esc(o.size)}</span>` : `<span class="tag fits">${o.id === 'assess' ? 'Start here' : 'Ongoing'}</span>`}</header>
        <p class="deliv"><strong>You get:</strong> ${esc(o.get)}</p>
        <p class="closes"><strong>Covers:</strong> ${esc(what)}.</p>
        ${o.also?.length ? `<p class="also">Also an option for ${esc(list(o.also.map(a => a.cap.name)))}.</p>` : ''}
        ${o.routes.length ? `<p class="routes">${o.routes.map(fillTag).join(' ')}</p>` : ''}`;
      ol.append(li);
    });
    box.append(ol);
    box.append(el('div', { class: 'engage' }, `<h3>How an engagement runs</h3>
      <ol class="engage-steps">
      <li><strong>Discovery call.</strong> Your stack, your concerns and what is driving them, much like this page. No charge.</li>
      <li><strong>Stack assessment.</strong> Fixed scope and fee. I confirm each gap against the full atlas and your own configuration, rank them by risk and agree a route for each one.</li>
      <li><strong>Proposal and statement of work.</strong> The workstreams you choose, with deliverables, acceptance evidence, timing, price and terms, agreed in writing before any work starts.</li>
      <li><strong>Delivery.</strong> Each workstream ends with evidence you can check: the setting, the control, the contract clause or the signed policy.</li>
      <li><strong>Handover.</strong> Owners, runbooks and the evidence pack, so your team runs it without me.</li>
      <li><strong>Keep it current.</strong> Optional. Your stack is rechecked when vendors ship, so the gap register stays true.</li></ol>
      <p><a class="button" href="/#/contact">Talk about your stack</a></p>
      <p class="atlas-hint">Indicative. The workstreams come from the gaps this page finds, and my packaged offerings are being shaped from what assessments like this turn up. Do not progress past this stage if: ${esc(offer.pkg.do_not_progress_if.replace(/\.$/, '').toLowerCase())}.</p>`));
    return box;
  }

  // ---------- the absence-check ladder, simulated ----------
  // Real labels are almost all unchecked today. This shows what decision 0011's checks would do,
  // using experiment 002's observed rates. Seeded, so the same stack gives the same result.
  function simulateLadder() {
    if (!lastRun) return;
    const box = $('ladder-out');
    const gaps = lastRun.assessed.flatMap(a => a.gaps.filter(g => g.kind === 'in-scope-gap').map(g => ({ a, g })));
    if (!gaps.length) { box.innerHTML = '<p class="atlas-hint">No real gaps in this run to check. Out-of-scope cells need no absence check.</p>'; return; }
    const R = G.experiment_rates; let held = 0, disputed = 0, open = 0;
    const rows = gaps.map(({ a, g }) => {
      if (G.experiment[g.rec.id]) { const l = G.experiment[g.rec.id].label; l === 'disputed' ? disputed++ : held++; return { a, g, label: l, real: true }; }
      const h = [...g.rec.id].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) >>> 0, 7) % 1000 / 1000;
      const label = h < R.held * .45 ? 'confirmed' : h < R.held ? 'likely' : h < R.held + R.disputed ? 'disputed' : 'unchecked';
      label === 'disputed' ? disputed++ : label === 'unchecked' ? open++ : held++;
      return { a, g, label };
    });
    box.innerHTML = `<p>${held} of ${gaps.length} gaps would hold, ${disputed} would go back to research because a check found a feature, and ${open} would need deep research or, last of all, a person.</p>
      <ul class="ladder-list">${rows.map(r => `<li>${esc(pname(r.g.rec.p))}, ${esc(r.a.cap.name)}: ${labelTag('unchecked')} <span aria-hidden="true">→</span> ${labelTag(r.label)}${r.real ? ` <span class="real">observed in experiment 002: ${esc(G.experiment[r.g.rec.id].found)}</span>` : ' <span class="sim">simulated</span>'}</li>`).join('')}</ul>`;
  }

  function showRecord(r) {
    const card = $('record-card'); const p = byPlatform.get(r.p), c = byControl.get(r.c); const g = gapOf(r);
    card.innerHTML = `<button type="button" class="close" aria-label="Close the record">×</button>
      <p class="group-name">${esc(byGroup.get(p.group)?.name || '')}</p><h3>${esc(shortName(p.name))}: ${esc(c.name)}</h3>
      <p><span class="tag ${esc(r.verdict)}">${esc(VERDICT[r.verdict])}</span> <span class="tag${r.basis === 'agent-verified' ? ' verified' : ''}">${esc(r.basis.replace('-', ' '))}</span>${g ? ' ' + labelTag(g.label) : ''}</p>
      ${g ? `<p class="atlas-hint">${esc(LABEL_HELP[g.label])}${g.found ? ' ' + esc(g.found) : ''}</p>` : ''}
      <p><strong>Control.</strong> ${esc(c.definition)}</p><p>${esc(plain(r.answer))}</p>
      ${r.gaps ? `<p><strong>Gaps.</strong> ${esc(plain(r.gaps))}</p>` : ''}
      ${r.evidence?.length ? `<p><strong>Evaluator proof.</strong> Quoted verbatim from the stored page and checked as an exact substring:</p>` + r.evidence.map(e => `<blockquote>${esc(e.passage)}</blockquote><p><code>${esc(e.url)}</code><br>fetched ${esc(e.fetched_at)}, sha256 ${esc(e.sha256)}</p>`).join('') : ''}
      ${r.sources.length ? `<p><strong>Sources.</strong></p><ul class="plain">${r.sources.map(u => `<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u)}</a></li>`).join('')}</ul>` : ''}
      <p class="atlas-hint">OKF concept <code>${esc(r.okf || '')}</code></p>`;
    openCard(card);
  }

  function showControl(a) {
    const card = $('record-card');
    const rows = [...a.sup, ...a.par, ...a.gaps.map(g => g.rec)];
    card.innerHTML = `<button type="button" class="close" aria-label="Close">×</button>
      <p class="group-name">${esc(a.cap.category)}</p><h3>${esc(a.cap.name)}</h3><p>${esc(a.cap.definition)}</p>
      <ul class="plain">${rows.map(r => `<li>${esc(pname(r.p))}: ${esc(VERDICT[r.verdict])}${gapOf(r) ? ', ' + esc(LABEL[gapOf(r).label].toLowerCase()) : ''} <button type="button" class="link" data-id="${esc(r.id)}">open</button></li>`).join('')}</ul>
      ${a.fills.length ? `<p><strong>How to fill it.</strong></p><ol class="fills">${a.fills.map(f => `<li>${fillTag(f.type)} <span>${esc(f.text)}</span></li>`).join('')}</ol>` : ''}`;
    card.querySelectorAll('button.link').forEach(b => b.addEventListener('click', () => showRecord(byRecord.get(b.dataset.id))));
    openCard(card);
  }

  function showOffering(o) {
    const card = $('record-card');
    card.innerHTML = `<button type="button" class="close" aria-label="Close">×</button>
      <p class="group-name">Workstream${o.size ? ', ' + esc(o.size.toLowerCase()) : ''}</p><h3>${esc(o.name)}</h3>
      <p><strong>You get:</strong> ${esc(o.get)}</p><p><strong>Covers in your stack:</strong> ${esc(list(o.closes.map(a => a.cap.name)))}.</p>
      <p><a class="text-link" href="/#/contact">Talk about this workstream</a></p>`;
    openCard(card);
  }

  function openCard(card) { card.hidden = false; const x = card.querySelector('.close'); x.addEventListener('click', () => { card.hidden = true; }); x.focus(); }

  function reset() {
    $('trace-log').innerHTML = ''; $('answers').innerHTML = ''; $('results').innerHTML = ''; $('record-card').hidden = true;
  }

  async function run(routes, recs, stackIds, maturity, model, answers) {
    const token = ++runToken; reset();
    const controls = [...new Set(routes.flatMap(r => r.controls))];
    if ($('full-scan').checked) for (const c of D.controls) if (!controls.includes(c.id)) controls.push(c.id);
    const groupsFor = c => [...new Set(routes.filter(r => r.controls.includes(c)).flatMap(r => r.groups || []))];
    const assessed = controls.map(c => assess(stackIds, c, groupsFor(c)));
    const offer = offerings(assessed, maturity);
    const shown = $('full-scan').checked ? assessed.filter(a => routes.some(r => r.controls.includes(a.c)) || a.status !== 'covered').slice(0, 18) : assessed;
    const net = network(routes, shown, { ...offer, rows: offer.rows }, stackIds);
    const T = drawNetwork(net); lastNet = net;
    $('term').innerHTML = ''; t0 = performance.now();
    term(`<span class="cmd">$ atlas walk --stack ${esc(stackIds.join(','))} --maturity ${esc(maturity)} --concerns ${routes.length}${$('full-scan').checked ? ' --full-scan' : ''}${model ? ' --replay client-a' : ''}</span>`);
    term(`load atlas-sample.json ${kv('platforms', String(D.platforms.length))} ${kv('controls', String(D.controls.length))} ${kv('records', String(D.records.length))}`);
    term(`load atlas-gaps.json ${kv('scope_lists', String(Object.keys(G.scope).length))} ${kv('labelled_gaps', String(Object.keys(G.gap_status).length))} ${kv('observed', String(Object.keys(G.experiment).length))} <span class="why"># decision 0011</span>`);
    term(`graph ${kv('nodes', String(net.N.length))} ${kv('edges', String(net.edges.length))}`);
    log(model ? `Model-written run: ${esc(D.example.models.router)} routed the concerns.` : `Matched ${routes.filter(r => !r.fallback).length} of ${routes.length} concerns by keyword.`);
    if (!await walk(net, T, token)) return;
    const all = answers.flatMap(a => a.claims), passed = all.filter(c => (c.check || c.citation_check) === 'pass').length;
    log(`Checked ${all.length} citations against the records they came from: ${passed} passed.`);
    term(`<span class="op read">check</span> citations ${kv('total', String(all.length))} ${kv('pass', String(passed), passed === all.length ? 'ok' : 'warn')}`);
    const cnt = s => assessed.filter(a => a.status === s).length;
    term(`<span class="op plan">done</span> ${kv('covered', String(cnt('covered')), 'ok')} ${kv('partial', String(cnt('partial')), 'warn')} ${kv('gaps', String(cnt('gap')), 'bad')} ${kv('workstreams', String(offer.rows.length))}`, 'end');
    lastRun = { assessed, stackIds };
    const res = $('results');
    res.append(report(assessed, offer, stackIds));
    const ladder = el('section', { class: 'ladder', 'aria-labelledby': 'ladder-title' }, `<h2 id="ladder-title" class="atlas-h2">How sure is each gap?</h2>
      <p>The atlas labels a gap by the checks it has survived, not by a model's confidence. Today most gaps are unchecked. Run the ladder to see what the absence checks would do to this stack's gaps.</p>
      <button type="button" class="button button-quiet" id="ladder-run">Run the absence-check ladder</button><div id="ladder-out" aria-live="polite"></div>`);
    res.append(ladder); $('ladder-run').addEventListener('click', simulateLadder);
    res.append(offerBlock(offer));
    const det = el('details', { class: 'answers-details' }, `<summary>Cited answers to each concern</summary>`);
    routes.forEach((r, i) => det.append(answerBlock(i, r, answers[i], model)));
    $('answers').append(det);
  }

  function runLive() {
    syncAliases();
    const stackIds = [...document.querySelectorAll('input[name="stack"]:checked')].map(b => b.value);
    const concerns = [...document.querySelectorAll('input[name="concern"]:checked')].map(b => PRESETS[+b.value])
      .concat($('concern-own').value.split('\n').map(s => s.trim()).filter(Boolean)).slice(0, 6);
    if (!stackIds.length || !concerns.length) { reset(); $('results').innerHTML = '<p class="atlas-hint">Pick at least one platform and one concern.</p>'; return; }
    const routes = concerns.map(route);
    const recs = routes.map(r => gather(stackIds, r));
    run(routes, recs, stackIds, $('maturity').value, false, routes.map((r, i) => compose(r, recs[i])));
  }

  function runExample() {
    const ex = D.example;
    $('maturity').value = ex.maturity; $('maturity').dispatchEvent(new Event('change'));
    document.querySelectorAll('input[name="stack"]').forEach(b => { b.checked = ex.stack.includes(b.value); }); syncAliases();
    const routes = ex.concerns.map(c => ({ concern: c.concern, controls: c.controls, groups: c.groups, hits: [] }));
    const recs = ex.concerns.map(c => c.records.map(id => byRecord.get(id) && { ...byRecord.get(id), role: ex.stack.includes(id.split('--')[0]) ? 'in_stack' : 'alternative' }).filter(Boolean));
    run(routes, recs, ex.stack, ex.maturity, true, ex.concerns.map(c => ({ summary: c.summary, claims: c.claims, unknowns: c.unknowns, next_steps: c.next_steps })));
  }

  load().catch(err => { $('atlas-scope').textContent = 'The atlas sample could not be loaded. Reload the page to try again.'; console.error(err); });
})();
