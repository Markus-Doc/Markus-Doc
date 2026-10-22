'use strict'

// Owner admin mock. Reads data/snapshot.json (written by tools/admin-snapshot.mjs) and renders three panels:
// the review queue, the run status of both freshness pipelines and their costs. Read only. Every value goes in
// through textContent, never as markup.
;(function () {
  if (window.AdminGuard && window.AdminGuard.blocked(location.hostname)) return

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const VERDICT = { covered: 'Covered', partial: 'Partial', 'not-covered': 'Not covered', 'out-of-scope': 'Out of scope', 'in review': 'In review' }
  const KIND = { change: 'Verdict changed', rejudged: 'Re-checked, kept live', 'owner-check': 'Quote to check', unapproved: 'No approval yet' }

  function el(tag, attrs, kids) {
    const node = document.createElement(tag)
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === false || v == null) continue
      if (k === 'class') node.className = v
      else if (k === 'text') node.textContent = v
      else node.setAttribute(k, v === true ? '' : v)
    }
    for (const kid of [].concat(kids || [])) if (kid != null) node.append(kid instanceof Node ? kid : String(kid))
    return node
  }
  const day = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''))
    return m ? Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1] : 'Unknown date'
  }
  const stamp = (iso) => {
    const d = new Date(iso)
    if (isNaN(d)) return 'an unknown time'
    try {
      return d.toLocaleString('en-AU', { timeZone: 'Australia/Brisbane', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' AEST'
    } catch (e) { return day(iso) }
  }
  const usd = (n) => (typeof n === 'number' ? 'US$' + n.toFixed(2) : 'Not recorded')
  const num = (n) => (typeof n === 'number' ? n.toLocaleString('en-AU') : 'Not recorded')
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many || one + 's')

  function pill(status) {
    const s = String(status || 'unknown')
    const cls = s === 'ok' ? 'is-ok' : s.startsWith('ok,') ? 'is-warn' : s === 'stopped' ? 'is-warn' : 'is-bad'
    const text = s === 'ok' ? 'OK' : s === 'stopped' ? 'Stopped' : s === 'failed' ? 'Failed' : s.charAt(0).toUpperCase() + s.slice(1)
    return el('span', { class: 'ad-pill ' + cls, text })
  }

  function draftActions(label) {
    return el('span', { class: 'ad-actions' }, [
      el('button', { type: 'button', class: 'rc-secondary', disabled: true, 'aria-label': 'Approve ' + label + ' (draft, not available)' }, 'Approve'),
      el('button', { type: 'button', class: 'rc-secondary', disabled: true, 'aria-label': 'Reject ' + label + ' (draft, not available)' }, 'Reject'),
      el('span', { class: 'ad-draft', text: 'Draft' })
    ])
  }

  // A table that stacks into labelled rows on a phone.
  function table(caption, heads, rows) {
    const thead = el('thead', {}, el('tr', {}, heads.map(h => el('th', { scope: 'col', text: h }))))
    const tbody = el('tbody', {}, rows.map(r => el('tr', {}, r.map((cell, i) => el('td', { 'data-label': heads[i] }, cell)))))
    return el('div', { class: 'ad-table-wrap' }, el('table', { class: 'ad-table' }, [el('caption', { text: caption }), thead, tbody]))
  }

  function stats(s) {
    const r = s.review
    const openKb = r.kb_change_issues.open.length + r.framework_issues.open.length
    const last = s.runs.stack_check.runs[0]
    const week = (s.costs.stack_check.weeks[0] || {}).notional_usd || 0
    const fwWeek = (s.costs.frameworks.weeks[0] || {}).notional_usd || 0
    const box = (figure, label) => el('div', { class: 'ad-stat' }, [el('strong', { text: figure }), el('span', { text: label })])
    return [
      box(String(r.waiting_count), 'findings waiting for you'),
      box(String(openKb), 'open KB change issues'),
      box(last ? day(last.date) : 'None', 'last Stack Check refresh'),
      box(usd(Math.round((week + fwWeek) * 100) / 100), 'notional cost this week')
    ]
  }

  function review(s) {
    const r = s.review
    const out = []
    out.push(el('div', { class: 'ad-callout' }, [
      draftActions('all shown'),
      el('p', { class: 'rc-note', text: 'Approvals still happen on the local review page and GitHub.' })
    ]))

    out.push(el('h3', { text: 'Findings waiting for your decision' }))
    if (!r.waiting_count) {
      const a = r.approvals
      out.push(el('p', { text: 'None. All ' + num(a.entries) + ' approval records in the repo are decided'
        + (a.last_decision_on ? ', the newest on ' + day(a.last_decision_on) : '') + '. That covers '
        + num(a.confirmed_findings) + ' agent-confirmed findings on ' + num(a.platforms) + ' platforms.' }))
    } else {
      out.push(table('Findings waiting, ' + r.waiting_count + ' in all' + (r.waiting.length < r.waiting_count ? ', first ' + r.waiting.length + ' shown' : ''),
        ['Platform', 'Control', 'Change', 'Why', 'Decision'],
        r.waiting.map(w => [
          w.platform,
          (w.control_id || '') + (w.control ? ' ' + w.control : ''),
          (VERDICT[w.before] || 'No verdict') + ' to ' + (VERDICT[w.after] || 'No verdict'),
          KIND[w.kind] || w.kind,
          draftActions(w.platform + ' ' + (w.control_id || ''))
        ])))
    }

    out.push(el('h3', { text: 'Open Stack Check KB issues' }))
    const kb = r.kb_change_issues
    if (!kb.read) out.push(el('p', { class: 'rc-note', text: 'GitHub was not read for this snapshot.' }))
    else if (!kb.open.length) out.push(el('p', { text: 'No open kb-change issues.' }))
    else out.push(el('ul', { class: 'ad-issues' }, kb.open.map(i => el('li', {}, [
      el('p', { class: 'ad-issue-title' }, [el('span', { class: 'ad-num', text: '#' + i.number }), ' ', i.title]),
      el('p', { class: 'rc-note', text: 'Opened ' + day(i.opened_on) + '. ' + i.note }),
      draftActions('issue ' + i.number)
    ]))))

    out.push(el('h3', { text: 'Open frameworks KB issues' }))
    const fw = r.framework_issues
    if (!fw.read) out.push(el('p', { class: 'rc-note', text: 'GitHub was not read for every frameworks KB in this snapshot.' }))
    if (!fw.open.length) { if (fw.read) out.push(el('p', { text: 'No open framework-change issues.' })) }
    else out.push(el('ul', { class: 'ad-issues' }, fw.open.map(i => el('li', {}, [
      el('p', { class: 'ad-issue-title' }, [el('span', { class: 'ad-num', text: i.kb + ' #' + i.number }), ' ', i.title]),
      el('p', { class: 'rc-note', text: 'Opened ' + day(i.opened_on) + '. Waits for your review and merge.' }),
      draftActions(i.kb + ' issue ' + i.number)
    ]))))

    const d = r.drafts_pending
    out.push(el('p', { class: 'rc-note', text: 'Change drafts not yet triaged: ' + d.stack_check_changes + ' for the Stack Check, ' + d.framework_changes + ' for the frameworks watch.' }))
    return out
  }

  function runs(s) {
    const out = []
    const sc = s.runs.stack_check
    out.push(el('h3', { text: 'Stack Check refresh' }))
    out.push(el('p', { class: 'rc-note', text: 'Vendor release channels checked, then each flagged platform re-confirmed by the agents. Stopped means the run did not finish. The next run picks up what is left.' }))
    out.push(table('Stack Check refresh runs, newest first', ['Date', 'Run', 'Changes found', 'Platforms re-checked', 'Findings changed', 'Result'],
      sc.runs.map(r => [
        day(r.date) + ', ' + r.started,
        r.run_id,
        plural(r.changes_found, 'change') + ' on ' + plural(r.platforms_with_changes, 'platform'),
        r.platforms.length
          ? el('details', { class: 'ad-more' }, [el('summary', { text: r.platforms_rechecked + ' of ' + r.platforms_to_recheck }), el('p', { text: r.platforms.join(', ') })])
          : r.platforms_rechecked + ' of ' + r.platforms_to_recheck,
        r.findings_changed + (r.rejudged_kept ? ', ' + r.rejudged_kept + ' re-judged and kept' : '') + (r.issues.length ? ' (issues ' + r.issues.map(n => '#' + n).join(', ') + ')' : ''),
        el('span', {}, [pill(r.status), r.deployed ? el('span', { class: 'ad-sub', text: 'Live site updated' }) : null])
      ])))

    const fw = s.runs.frameworks.runs
    out.push(el('h3', { text: 'Frameworks freshness watch' }))
    out.push(el('p', { class: 'rc-note', text: 'Primary sources for the Australian and AI frameworks KBs. Each confirmed change becomes a proposal and an issue for you.' }))
    if (!fw.length) out.push(el('p', { text: 'No runs recorded yet.' }))
    else out.push(table('Frameworks watch runs, newest first', ['Date', 'Channels checked', 'Changes', 'Confirmed', 'Raised', 'Result'],
      fw.map(r => [
        day(r.date) + ', ' + r.started + (r.dry_run ? ' (dry run)' : ''),
        r.channels_due ? r.channels_checked + ' of ' + r.channels_due + (r.channels_failed ? ', ' + r.channels_failed + ' failed' : '') : 'None due',
        String(r.changes),
        r.confirmed + ' confirmed, ' + r.rejected + ' rejected',
        plural(r.proposals, 'proposal') + ', ' + plural(r.kb_lags_raised, 'KB lag') + ', ' + plural(r.gaps_raised, 'gap'),
        pill(r.status)
      ])))
    return out
  }

  function costs(s) {
    const c = s.costs
    const out = []
    out.push(el('p', { class: 'rc-note', text: 'Notional US dollars: the list price the command line reports per call. The runs use a subscription, so this is a guide to API cost, not a charge.' }))
    const rows = (weeks) => weeks.map(w => [w.week, num(w.runs), num(w.model_calls), num(w.minutes), usd(w.notional_usd),
      Object.entries(w.calls_by_model || {}).map(([m, n]) => m + ' ' + n).join(', ') || 'None'])
    const heads = ['Week', 'Runs', 'Model calls', 'Minutes', 'Notional cost', 'Calls by model']
    out.push(el('h3', { text: 'Stack Check refresh' }))
    out.push(table('Stack Check refresh cost by week', heads, rows(c.stack_check.weeks)))
    if (c.stack_check.runs_without_cost_record) out.push(el('p', { class: 'rc-note', text: plural(c.stack_check.runs_without_cost_record, 'earlier run') + ' ran before cost records started, so ' + (c.stack_check.runs_without_cost_record === 1 ? 'it is' : 'they are') + ' not counted.' }))
    out.push(el('h3', { text: 'Frameworks freshness watch' }))
    out.push(table('Frameworks watch cost by week', heads, rows(c.frameworks.weeks)))
    out.push(el('p', { class: 'ad-total' }, ['Total recorded: ', el('strong', { text: usd(c.total_usd) })]))
    return out
  }

  function fill(id, nodes) { document.getElementById(id).replaceChildren(...nodes) }

  function render(s) {
    document.getElementById('ad-banner-text').textContent = 'Mock admin view, dev preview only, read-only snapshot from ' + stamp(s.generated_at) + '.'
    fill('ad-stats', stats(s))
    fill('ad-review-body', review(s))
    fill('ad-runs-body', runs(s))
    fill('ad-costs-body', costs(s))
    document.getElementById('main').hidden = false
  }

  function fail() {
    document.getElementById('ad-banner-text').textContent = 'Mock admin view, dev preview only. The snapshot could not be loaded.'
    document.getElementById('main').hidden = false
    fill('ad-stats', [])
    for (const id of ['ad-review-body', 'ad-runs-body', 'ad-costs-body']) fill(id, [el('p', { class: 'rc-note', text: 'No snapshot data.' })])
  }

  document.addEventListener('DOMContentLoaded', () => {
    fetch('data/snapshot.json', { cache: 'no-store', credentials: 'same-origin' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('status ' + r.status))))
      .then(render)
      .catch(fail)
  })
})()
