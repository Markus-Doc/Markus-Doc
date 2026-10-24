'use strict'

// AI use policy builder page. Drafting lives in draft.js (APDraft). This file reads the profile and the KB index,
// renders the editable policy and handles Copy, Download and Print. Only the four picklist answers are saved,
// through MWProfile.setAnswers('ai-policy', ...). The policy text and the reader's edits stay in this page's
// memory and are lost on reload.
;(function () {
  const D = window.APDraft
  const INDEX_URL = 'https://checkableai.com/stack-check/data/index.json'
  const state = { profile: null, index: null, facts: null, picks: null, doc: null, edited: {}, title: null }
  const $ = id => document.getElementById(id)

  function el(tag, attrs, children) {
    const node = document.createElement(tag)
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'text') node.textContent = v
      else if (v !== false && v !== null && v !== undefined) node.setAttribute(k, v === true ? '' : v)
    }
    for (const c of [].concat(children || [])) if (c) node.append(c)
    return node
  }
  function P() { return window.MWProfile }
  function status(msg) { $('pp-status').textContent = msg }

  async function loadIndex() {
    try {
      const res = await fetch(INDEX_URL, { credentials: 'same-origin' })
      if (res.ok) return await res.json()
    } catch (e) { /* names fall back to ids */ }
    return null
  }

  function fit(area) {
    area.style.height = 'auto'
    area.style.height = (area.scrollHeight + 4) + 'px'
  }

  // ---------- picks ----------

  const PICK_FIELDS = [['owner', 'pp-owner'], ['approver', 'pp-approver'], ['review', 'pp-review'], ['personal', 'pp-personal']]
  function buildPicks() {
    for (const [name, id] of PICK_FIELDS) {
      const sel = $(id)
      for (const o of D.PICK[name]) sel.append(el('option', { value: o.id, text: o.label }))
      sel.addEventListener('change', () => {
        state.picks[name] = sel.value
        state.pickedHere = true
        savePicks()
        redraw()
      })
    }
  }
  function showPicks() { for (const [name, id] of PICK_FIELDS) $(id).value = state.picks[name] }
  function savePicks() {
    try { P().setAnswers(D.TOOL_ID, Object.assign({}, state.picks), D.ANSWERS_VERSION) } catch (e) { /* the page keeps working */ }
  }

  // ---------- policy ----------

  function buildPolicy() {
    const box = $('pp-sections')
    box.textContent = ''
    for (const s of D.SECTIONS) {
      const area = el('textarea', { class: 'pp-body', id: 'pp-s-' + s.id, rows: '4', spellcheck: 'true' })
      const reset = el('button', { type: 'button', class: 'pp-redraft', hidden: true, text: 'Redraft this section' })
      const head = el('div', { class: 'pp-head' }, [el('h3', {}, el('label', { for: area.id, text: s.heading })), reset])
      box.append(el('div', { class: 'pp-section' + (s.level === 2 ? ' is-sub' : ''), 'data-id': s.id }, [head, area]))
      area.addEventListener('input', () => {
        state.edited[s.id] = area.value
        reset.hidden = false
        fit(area)
      })
      reset.addEventListener('click', () => {
        delete state.edited[s.id]
        reset.hidden = true
        redraw()
        area.focus()
      })
    }
    $('pp-title').addEventListener('input', e => { state.title = e.target.value })
  }

  function redraw() {
    state.facts = D.facts(state.profile, state.index)
    state.doc = D.draft(state.facts, state.picks)
    $('pp-from').textContent = D.sourcesLine(state.facts)
    $('pp-meta').textContent = state.doc.meta
    if (state.title === null) $('pp-title').value = state.doc.title
    for (const s of state.doc.sections) {
      if (state.edited[s.id] !== undefined) continue
      const area = $('pp-s-' + s.id)
      area.value = s.text
      fit(area)
    }
  }

  // The policy as the reader sees it now, edits included.
  function current() {
    return {
      title: $('pp-title').value,
      meta: state.doc.meta,
      sections: state.doc.sections.map(s => Object.assign({}, s, { text: $('pp-s-' + s.id).value }))
    }
  }

  // ---------- actions ----------

  async function copy() {
    const text = D.toMarkdown(current())
    try {
      await navigator.clipboard.writeText(text)
      status('Policy copied as Markdown.')
    } catch (e) {
      const t = el('textarea', { class: 'visually-hidden', 'aria-hidden': 'true' })
      t.value = text
      document.body.append(t)
      t.select()
      let ok = false
      try { ok = document.execCommand('copy') } catch (err) { ok = false }
      t.remove()
      status(ok ? 'Policy copied as Markdown.' : 'Copy did not work in this browser. Use Download instead.')
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([D.toMarkdown(current())], { type: 'text/markdown' }))
    const a = el('a', { href: url, download: 'ai-use-policy.md' })
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    status('Downloaded ai-use-policy.md.')
  }

  // Print uses a plain copy of the policy, since text boxes print with scroll bars and cut-off text.
  function fillPrint() {
    const doc = current()
    const box = $('pp-print')
    box.textContent = ''
    box.append(el('h1', { text: doc.title }))
    for (const line of doc.meta.split('\n')) box.append(el('p', { text: line }))
    for (const s of doc.sections) {
      box.append(el(s.level === 1 ? 'h2' : 'h3', { text: s.heading }))
      for (const b of D.blocks(s.text)) {
        box.append(b.type === 'ul' ? el('ul', {}, b.items.map(i => el('li', { text: i }))) : el('p', { text: b.text }))
      }
    }
  }

  // ---------- start ----------

  async function start() {
    buildPicks()
    buildPolicy()
    $('pp-copy').addEventListener('click', copy)
    $('pp-download').addEventListener('click', download)
    $('pp-printbtn').addEventListener('click', () => { fillPrint(); window.print() })
    window.addEventListener('beforeprint', fillPrint)

    const lib = P()
    try { if (lib.ready) await lib.ready } catch (e) { /* use what get() gives */ }
    state.profile = lib.get()
    state.picks = D.cleanPicks(lib.getAnswers(D.TOOL_ID), D.facts(state.profile, null))
    showPicks()
    redraw()
    $('pp-app').hidden = false

    state.index = await loadIndex()
    if (state.index) redraw()

    lib.onChange(p => {
      state.profile = p
      // Saved picks win. With none saved, the defaults follow the business size the profile now holds.
      const saved = p && p.answers ? p.answers[D.TOOL_ID] : null
      state.picks = saved ? D.cleanPicks(saved, D.facts(p, null)) : (state.pickedHere ? state.picks : D.cleanPicks(null, D.facts(p, null)))
      showPicks()
      redraw()
    })
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!D || !window.MWProfile) { status('The policy builder did not load. Reload the page to try again.'); return }
    start().catch(() => status('Something went wrong drafting the policy. Reload the page to try again.'))
  })
})()
