// Ask the Atlas: an in-browser questionnaire over the public sample of the Offerings Atlas.
// No model and no server: concerns are routed by keyword, records come from the sample's OKF
// retrieval data, and every citation is checked against the record it came from. The
// model-written Client A run is included as the full version for comparison.
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
  const VERDICT = { supported: 'Supported', partial: 'Partial', 'not-addressed': 'Not addressed', unresolved: 'Unresolved' };
  const RANK = { supported: 0, partial: 1, unresolved: 2, 'not-addressed': 3 };
  let D, byRecord, byControl, byPlatform, byGroup, runToken = 0;

  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const plain = s => String(s ?? '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/`/g, '').replace(/\s+/g, ' ').trim();
  const sentence = s => { const t = plain(s).replace(/^(Source statement|Assessment|Source qualification):\s*/i, ''); const m = t.match(/^(.{30,260}?[.])(\s|$)/); return m ? m[1] : t.slice(0, 240); };
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
  const el = (tag, attrs = {}, html) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (html !== undefined) e.innerHTML = html; return e; };
  const sv = (tag, attrs = {}) => { const e = document.createElementNS(SVG, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
  const wait = ms => reduced ? Promise.resolve() : new Promise(r => setTimeout(r, ms));

  async function load() {
    D = await (await fetch('/atlas/atlas-sample.json')).json();
    byRecord = new Map(D.records.map(r => [r.id, r]));
    byControl = new Map(D.controls.map(c => [c.id, c]));
    byPlatform = new Map(D.platforms.map(p => [p.id, p]));
    byGroup = new Map(D.groups.map(g => [g.id, g]));
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
        const lab = el('label', { class: 'chip' }, `<input type="checkbox" name="stack" value="${esc(p.id)}"> ${esc(shortName(p.name))}`);
        stack.append(lab);
      }
    }
    for (const id of ['claude-code', 'aws', 'okta-ai-agents', 'wiz']) { const box = stack.querySelector(`input[value="${id}"]`); if (box) box.checked = true; }
    const presets = $('concern-presets');
    PRESETS.forEach((text, i) => presets.append(el('label', { class: 'chip' }, `<input type="checkbox" name="concern" value="${i}"${i < 2 ? ' checked' : ''}> ${esc(text)}`)));
    $('atlas-form').addEventListener('submit', e => { e.preventDefault(); runLive(); });
    $('example').addEventListener('click', runExample);
    drawEmpty();
  }

  const shortName = n => n.replace(/\s*\(.*\)$/, '');

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

  function gather(stackIds, r) {
    const records = [];
    for (const c of r.controls) {
      const own = stackIds.map(p => byRecord.get(`${p}--${c}`)).filter(Boolean);
      records.push(...own.map(x => ({ ...x, role: 'in_stack' })));
      if (own.some(x => x.verdict === 'supported')) continue;
      const pool = D.platforms.filter(p => !stackIds.includes(p.id));
      const inGroups = pool.filter(p => r.groups.includes(p.group));
      const cands = (inGroups.length ? inGroups : pool).map(p => byRecord.get(`${p.id}--${c}`))
        .filter(x => x && (x.verdict === 'supported' || x.verdict === 'partial'))
        .sort((a, b) => RANK[a.verdict] - RANK[b.verdict] || (b.basis === 'agent-verified') - (a.basis === 'agent-verified'));
      records.push(...cands.slice(0, 2).map(x => ({ ...x, role: 'alternative' })));
    }
    return records;
  }

  function compose(r, records, stackIds) {
    const parts = [], claims = [], gaps = [], steps = [];
    for (const c of r.controls) {
      const name = byControl.get(c).name;
      const own = records.filter(x => x.c === c && x.role === 'in_stack');
      const alts = records.filter(x => x.c === c && x.role === 'alternative');
      const names = v => own.filter(x => x.verdict === v).map(x => shortName(byPlatform.get(x.p).name));
      const sup = names('supported'), par = names('partial');
      if (sup.length) parts.push(`${name}: your stack supports it through ${list(sup)}${par.length ? `, with ${list(par)} in part` : ''}.`);
      else if (par.length) parts.push(`${name}: your stack covers it only in part, through ${list(par)}.`);
      else parts.push(`${name}: nothing in your stack covers it${alts.length ? `. The sample points to ${list(alts.map(a => `${shortName(byPlatform.get(a.p).name)} (${VERDICT[a.verdict].toLowerCase()})`))}` : ''}.`);
      const none = names('not-addressed').concat(names('unresolved'));
      if (none.length && (sup.length || par.length)) parts[parts.length - 1] = parts[parts.length - 1].replace(/\.$/, `. ${list(none)} ${none.length > 1 ? 'do' : 'does'} not cover it.`);
      // The answer cites the records that carry it: covering records first, at most three per control, then alternatives.
      const carrying = own.filter(x => x.verdict === 'supported' || x.verdict === 'partial').sort((a, b) => RANK[a.verdict] - RANK[b.verdict]).slice(0, 3);
      for (const x of [...carrying, ...alts]) {
        const url = x.sources[0] || '';
        claims.push({ text: `${shortName(byPlatform.get(x.p).name)}, ${name}: ${sentence(x.answer)}`, finding_id: x.id, source_url: url, record: x });
      }
      for (const x of own.filter(o => o.verdict === 'partial').slice(0, 1)) { if (x.gaps) gaps.push(`${shortName(byPlatform.get(x.p).name)}: ${sentence(x.gaps)}`); if (x.options) steps.push(sentence(x.options).replace(/^Proposed next action:\s*/i, '')); }
    }
    for (const c of claims) c.check = c.source_url && c.record.sources.includes(c.source_url) ? 'pass' : (c.source_url ? 'fail' : 'no source');
    return { summary: parts.join(' '), claims, gaps: gaps.slice(0, 4), steps: steps.slice(0, 3) };
  }
  const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

  function frame(maturity, stackIds) {
    const stage = D.stages.find(s => s.id === maturity), pkg = D.packages.find(p => p.maturity_id === maturity);
    const rows = pkg.related_offering_ids.map(id => D.offerings.find(o => o.id === id)).filter(Boolean).map(o => {
      const n = { yes: 0, part: 0, no: 0 };
      for (const c of o.controls) {
        const v = stackIds.map(p => byRecord.get(`${p}--${c}`)?.verdict);
        n[v.includes('supported') ? 'yes' : v.includes('partial') ? 'part' : 'no']++;
      }
      return { ...o, ...n };
    });
    return { stage, pkg, rows };
  }

  // ---------- drawing ----------
  function drawEmpty() {
    const svg = $('trace'); svg.querySelectorAll(':not(title):not(desc)').forEach(n => n.remove());
    svg.setAttribute('viewBox', '0 0 960 220');
    const t = sv('text', { x: 480, y: 116, 'text-anchor': 'middle', style: 'font-size:22px' }); t.textContent = 'Choose your stack and concerns, then walk the knowledge base.';
    svg.append(t);
  }

  function layout(routes, recordsByConcern, base = 0) {
    const cols = { concern: 90, control: 330, record: 610, source: 880 };
    const concerns = routes.map((r, i) => ({ key: `q${i}`, kind: 'concern', label: `${base + i + 1}. ${r.concern.length > 90 ? r.concern.slice(0, 88).replace(/\s+\S*$/, '') + '...' : r.concern}`, i }));
    const controls = [], recs = [], srcs = [];
    routes.forEach((r, i) => r.controls.forEach(c => { if (!controls.find(x => x.id === c)) controls.push({ key: `c:${c}`, id: c, kind: 'control', label: byControl.get(c)?.name || c }); }));
    recordsByConcern.forEach(rs => rs.forEach(x => { if (!recs.find(y => y.id === x.id)) recs.push({ key: `r:${x.id}`, id: x.id, kind: x.role === 'alternative' ? 'alt' : 'record', rec: x, label: shortName(byPlatform.get(x.p)?.name || x.p) }); }));
    recs.forEach(n => (n.rec.sources || []).slice(0, 2).forEach(u => { if (!srcs.find(s => s.id === u)) srcs.push({ key: `s:${u}`, id: u, kind: 'source', label: host(u) }); }));
    const h = Math.max(240, 60 + 24 * Math.max(controls.length * 1.5, recs.length, srcs.length * 0.7));
    const place = (arr, x) => arr.forEach((n, i) => { n.x = x; n.y = 52 + (h - 72) * (arr.length === 1 ? .5 : i / (arr.length - 1)); });
    place(concerns, cols.concern); place(controls, cols.control); place(recs, cols.record); place(srcs, cols.source);
    return { h, nodes: [...concerns, ...controls, ...recs, ...srcs], concerns, controls, recs, srcs };
  }

  function drawTrace(routes, recordsByConcern, base = 0) {
    const svg = $('trace'); svg.querySelectorAll(':not(title):not(desc)').forEach(n => n.remove());
    const L = layout(routes, recordsByConcern, base);
    svg.setAttribute('viewBox', `0 0 960 ${L.h}`);
    for (const [x, t] of [[90, 'CONCERNS'], [330, 'CONTROLS'], [610, 'RECORDS'], [880, 'SOURCES']]) {
      const c = sv('text', { x, y: 14, 'text-anchor': 'middle', class: 'col' }); c.textContent = t; svg.append(c);
    }
    const edges = sv('g'), nodes = sv('g'); svg.append(edges, nodes);
    const find = key => L.nodes.find(n => n.key === key);
    const edge = (a, b, alt) => {
      const p = sv('path', { d: `M${a.x} ${a.y}C${(a.x + b.x) / 2} ${a.y} ${(a.x + b.x) / 2} ${b.y} ${b.x} ${b.y}`, class: 'edge' + (alt ? ' alt' : ''), 'data-a': a.key, 'data-b': b.key });
      edges.append(p); return p;
    };
    const E = [];
    routes.forEach((r, i) => r.controls.forEach(c => E.push({ a: `q${i}`, b: `c:${c}`, q: i })));
    recordsByConcern.forEach((rs, i) => rs.forEach(x => {
      E.push({ a: `c:${x.c}`, b: `r:${x.id}`, q: i, alt: x.role === 'alternative' });
      (x.sources || []).slice(0, 2).forEach(u => E.push({ a: `r:${x.id}`, b: `s:${u}`, q: i }));
    }));
    const seen = new Set();
    for (const e of E) { const k = e.a + '>' + e.b; if (seen.has(k)) continue; seen.add(k); e.el = edge(find(e.a), find(e.b), e.alt); }
    for (const n of L.nodes) {
      const g = sv('g', { class: `node n-${n.kind} dim` + (n.rec ? ` v-${n.rec.verdict}` : ''), 'data-key': n.key, tabindex: n.rec ? 0 : -1, role: n.rec ? 'button' : 'presentation' });
      const r = n.kind === 'concern' ? 7 : n.kind === 'control' ? 6 : n.kind === 'source' ? 3 : 5.5;
      g.append(sv('circle', { cx: n.x, cy: n.y, r }));
      if (n.rec && n.rec.basis === 'agent-verified') g.append(sv('circle', { class: 'ring', cx: n.x, cy: n.y, r: r + 3.5 }));
      if (n.kind !== 'source') {
        const right = n.kind === 'record' || n.kind === 'alt';
        const t = sv('text', { x: n.x + (right ? 10 : n.kind === 'concern' ? -12 : 10), y: n.y + 4, 'text-anchor': right || n.kind === 'control' ? 'start' : 'end' });
        t.textContent = n.label + (n.rec ? ` · ${VERDICT[n.rec.verdict]}` : '');
        if (n.kind === 'concern') { t.setAttribute('x', n.x - 70); t.setAttribute('text-anchor', 'start'); t.setAttribute('y', n.y + 22); wrap(t, n.label, 26); }
        g.append(t);
      }
      const title = sv('title'); title.textContent = n.rec ? `${n.label}: ${VERDICT[n.rec.verdict]}, ${n.rec.basis.replace('-', ' ')}` : n.kind === 'source' ? n.id : n.label; g.append(title);
      if (n.rec) { g.addEventListener('click', () => showRecord(n.rec)); g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); showRecord(n.rec); } }); }
      nodes.append(g);
    }
    return { L, E, light: keys => keys.forEach(k => svg.querySelector(`[data-key="${CSS.escape(k)}"]`)?.classList.remove('dim')),
             lightEdge: (a, b) => edges.querySelector(`[data-a="${CSS.escape(a)}"][data-b="${CSS.escape(b)}"]`)?.classList.add('lit') };
  }

  function wrap(t, text, width) {
    t.textContent = '';
    const words = text.split(' '); let line = '', dy = 0;
    const flush = () => { const s = sv('tspan', { x: t.getAttribute('x'), dy: dy ? 13 : 0 }); s.textContent = line; t.append(s); dy++; line = ''; };
    for (const w of words) { if ((line + ' ' + w).trim().length > width && line) flush(); line = (line + ' ' + w).trim(); }
    if (line) flush();
  }

  function tabs(routes, recs) {
    const bar = $('trace-tabs'); bar.innerHTML = '';
    routes.forEach((r, i) => {
      const b = el('button', { type: 'button', class: 'tab', 'aria-pressed': 'false' }, `Concern ${i + 1}`);
      b.title = r.concern;
      b.addEventListener('click', () => show(i));
      bar.append(b);
    });
    const show = i => {
      const T = drawTrace([routes[i]], [recs[i]], i);
      T.L.nodes.forEach(n => T.light([n.key]));
      $('trace').querySelectorAll('.edge').forEach(e => e.classList.add('lit'));
      bar.querySelectorAll('.tab').forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
    };
    return show;
  }

  // ---------- output ----------
  const log = html => { const li = el('li', {}, html); $('trace-log').append(li); li.scrollIntoView({ block: 'nearest' }); };

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
    if ((c.role || r?.role) === 'alternative') meta.innerHTML += '<span>alternative to your stack</span>';
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
      : `Routed by the words ${r.hits.map(h => `<code>${esc(h)}</code>`).join(', ')} to ${esc(r.controls.map(c => byControl.get(c).name).join(', '))}${r.groups.length ? `, and to the ${esc(r.groups.map(g => byGroup.get(g)?.name || g).join(', '))} groups for alternatives` : ''}.`;
    box.append(el('p', { class: 'route' }, how));
    box.append(el('p', { class: 'summary' }, esc(a.summary)));
    const ul = el('ul', { class: 'claims' }); a.claims.forEach(c => ul.append(claimItem(c))); box.append(ul);
    const unknown = a.gaps || a.unknowns;
    if (unknown?.length) { box.append(el('h4', {}, model ? 'What the knowledge base does not settle' : 'Gaps the knowledge base records')); const g = el('ul', { class: 'plain' }); unknown.forEach(x => g.append(el('li', {}, esc(x)))); box.append(g); }
    const steps = a.steps || a.next_steps;
    if (steps?.length) { box.append(el('h4', {}, 'Next steps')); const s = el('ul', { class: 'plain' }); steps.forEach(x => s.append(el('li', {}, esc(x)))); box.append(s); }
    return box;
  }

  function frameBlock(f) {
    const box = el('section', { class: 'frame' });
    box.innerHTML = `<h3>Where you sit: ${esc(f.pkg.name)}</h3><p>${esc(f.stage.typical_situation)}. Planning focus: ${esc(f.stage.planning_focus.toLowerCase())}.</p>
      <p><strong>Do not progress if:</strong> ${esc(f.pkg.do_not_progress_if)}</p>
      <table><thead><tr><th>Engagement that fits</th><th>Minimum deliverable</th><th>Your stack covers</th></tr></thead><tbody>
      ${f.rows.map(o => `<tr><td>${esc(o.name)}</td><td>${esc(o.deliverable)}</td><td>${o.yes} fully, ${o.part} in part, ${o.no} not</td></tr>`).join('')}</tbody></table>`;
    return box;
  }

  function showRecord(r) {
    const card = $('record-card'); const p = byPlatform.get(r.p), c = byControl.get(r.c);
    card.innerHTML = `<button type="button" class="close" aria-label="Close the record">×</button>
      <p class="group-name">${esc(byGroup.get(p.group)?.name || '')}</p><h3>${esc(shortName(p.name))}: ${esc(c.name)}</h3>
      <p><span class="tag ${esc(r.verdict)}">${esc(VERDICT[r.verdict])}</span> <span class="tag${r.basis === 'agent-verified' ? ' verified' : ''}">${esc(r.basis.replace('-', ' '))}</span></p>
      <p><strong>Control.</strong> ${esc(c.definition)}</p><p>${esc(plain(r.answer))}</p>
      ${r.gaps ? `<p><strong>Gaps.</strong> ${esc(plain(r.gaps))}</p>` : ''}
      ${r.evidence?.length ? `<p><strong>Evaluator proof.</strong> Quoted verbatim from the stored page and checked as an exact substring:</p>` + r.evidence.map(e => `<blockquote>${esc(e.passage)}</blockquote><p><code>${esc(e.url)}</code><br>fetched ${esc(e.fetched_at)}, sha256 ${esc(e.sha256)}</p>`).join('') : ''}
      ${r.sources.length ? `<p><strong>Sources.</strong></p><ul class="plain">${r.sources.map(u => `<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u)}</a></li>`).join('')}</ul>` : ''}
      <p class="atlas-hint">OKF concept <code>${esc(r.okf || '')}</code></p>`;
    card.hidden = false; card.querySelector('.close').addEventListener('click', () => { card.hidden = true; }); card.querySelector('.close').focus();
  }

  async function animate(routes, recordsByConcern, model) {
    const token = ++runToken;
    $('trace-log').innerHTML = ''; $('answers').innerHTML = ''; $('record-card').hidden = true;
    $('trace-tabs').innerHTML = '';
    for (let i = 0; i < routes.length; i++) {
      if (token !== runToken) return;
      const r = routes[i], rs = recordsByConcern[i];
      const T = drawTrace([r], [rs], i);
      T.light(['q0']); await wait(260);
      for (const c of r.controls) { T.light([`c:${c}`]); T.lightEdge('q0', `c:${c}`); }
      log(model ? `Concern ${i + 1}: the router model chose ${esc(r.controls.map(c => byControl.get(c)?.name || c).join(', '))}.`
        : r.fallback ? `Concern ${i + 1}: no keyword matched, fell back to Risk Assessment and Classification.`
        : `Concern ${i + 1}: matched ${r.hits.map(h => `<code>${esc(h)}</code>`).join(', ')} and routed to ${esc(r.controls.map(c => byControl.get(c).name).join(', '))}.`);
      await wait(380);
      for (const x of rs) {
        if (token !== runToken) return;
        T.light([`r:${x.id}`]); T.lightEdge(`c:${x.c}`, `r:${x.id}`);
        log(`${x.role === 'alternative' ? 'No supported record in your stack, so it looked further: ' : 'Read '}<code>${esc(x.okf)}</code>: ${esc(VERDICT[x.verdict].toLowerCase())}, ${esc(x.basis.replace('-', ' '))}.`);
        for (const u of (x.sources || []).slice(0, 2)) { T.light([`s:${u}`]); T.lightEdge(`r:${x.id}`, `s:${u}`); }
        await wait(170);
      }
      await wait(500);
    }
    tabs(routes, recordsByConcern)(routes.length - 1);
    return token;
  }

  async function runLive() {
    const stackIds = [...document.querySelectorAll('input[name="stack"]:checked')].map(b => b.value);
    const concerns = [...document.querySelectorAll('input[name="concern"]:checked')].map(b => PRESETS[+b.value])
      .concat($('concern-own').value.split('\n').map(s => s.trim()).filter(Boolean)).slice(0, 6);
    if (!stackIds.length || !concerns.length) { $('answers').innerHTML = '<p class="atlas-hint">Pick at least one platform and one concern.</p>'; return; }
    const routes = concerns.map(route);
    const recs = routes.map(r => gather(stackIds, r));
    const token = await animate(routes, recs, false);
    if (token !== runToken) return;
    const answers = routes.map((r, i) => compose(r, recs[i], stackIds));
    const all = answers.flatMap(a => a.claims), passed = all.filter(c => c.check === 'pass').length;
    log(`Checked ${all.length} citations against the records they came from: ${passed} passed.`);
    routes.forEach((r, i) => $('answers').append(answerBlock(i, r, answers[i], false)));
    $('answers').append(frameBlock(frame($('maturity').value, stackIds)));
  }

  async function runExample() {
    const ex = D.example;
    $('maturity').value = ex.maturity; $('maturity').dispatchEvent(new Event('change'));
    document.querySelectorAll('input[name="stack"]').forEach(b => { b.checked = ex.stack.includes(b.value); });
    const routes = ex.concerns.map(c => ({ concern: c.concern, controls: c.controls, groups: c.groups, hits: [] }));
    const recs = ex.concerns.map(c => c.records.map(id => byRecord.get(id) && { ...byRecord.get(id), role: ex.stack.includes(id.split('--')[0]) ? 'in_stack' : 'alternative' }).filter(Boolean));
    const token = await animate(routes, recs, true);
    if (token !== runToken) return;
    const all = ex.concerns.flatMap(c => c.claims), passed = all.filter(c => c.citation_check === 'pass').length;
    log(`Model-written run: ${esc(ex.models.router)} routed and ${esc(ex.models.answer)} answered, ${ex.usage.calls} calls, ${ex.usage.prompt_tokens.toLocaleString('en-AU')} tokens in. ${passed} of ${all.length} citations passed the check.`);
    ex.concerns.forEach((c, i) => $('answers').append(answerBlock(i, routes[i], { summary: c.summary, claims: c.claims, unknowns: c.unknowns, next_steps: c.next_steps }, true)));
    $('answers').append(frameBlock(frame(ex.maturity, ex.stack)));
  }

  load().catch(err => { $('atlas-scope').textContent = 'The atlas sample could not be loaded. Reload the page to try again.'; console.error(err); });
})();
