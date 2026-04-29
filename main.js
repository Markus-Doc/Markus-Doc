/* Cyberfolio Command Centre v2.7 — spatial portfolio, screen-focus interaction. AU English. */
import * as THREE from 'three'

/* ─── DOM refs ────────────────────────────────────────────────────── */
const $ = (s) => document.querySelector(s)
const canvas = $('#scene'), appEl = $('#app')
const loaderEl = $('#loader'), loaderBar = $('#loaderBar'), loaderStep = $('#loaderStep')
const errorScreen = $('#errorScreen'), errorDetail = $('#errorDetail')
const dockItems = [...document.querySelectorAll('.dock-item')]
const hudTitle = $('#hudTitle'), hudBody = $('#hudBody'), hudBadge = $('#hudBadge')
const clockEl = $('#clock')
const storyPanels = [...document.querySelectorAll('.story-panel')]
const hudStatsEl = $('#hudStats')
const screenLayer = $('#screenContentLayer')
const screenPanel = $('#screenFocusPanel')
const backBtn = $('#backBtn')

/* ─── Loader ──────────────────────────────────────────────────────── */
const loaderSteps = [
  [12, 'Establishing telemetry'], [28, 'Mounting threat intelligence'], [46, 'Loading security controls'],
  [64, 'Validating sensor array'], [80, 'Configuring SIEM connectors'], [96, 'Hardening perimeter']
]
let li = 0
const tick = setInterval(() => {
  if (li >= loaderSteps.length) return
  const [p, t] = loaderSteps[li++]
  loaderBar.style.width = p + '%'; loaderStep.textContent = t
}, 220)
function finishLoader() {
  clearInterval(tick)
  loaderBar.style.width = '100%'; loaderStep.textContent = 'Online'
  appEl.hidden = false
  setTimeout(() => loaderEl.classList.add('is-hidden'), 380)
}
function showError(err) {
  console.error('[cyberfolio]', err)
  appEl.hidden = true; loaderEl.classList.add('is-hidden')
  errorScreen.hidden = false
  errorDetail.textContent = (err && (err.stack || err.message || String(err))) || 'unknown'
}

try {
  const probe = document.createElement('canvas')
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('WebGL is not available.')
} catch (e) { showError(e); throw e }

/* ─── Theme config ────────────────────────────────────────────────── */
const THEMES = {
  'dark': {
    fog:0x02060f, fogDensity:0.022, exposure:1.18,
    ambient:{color:0x9bd6ff,intensity:0.55},
    lights:{key:{color:0x6ee7ff,intensity:6.2},fill:{color:0xa78bfa,intensity:5.0},rose:{color:0xfb7185,intensity:2.6},under:{color:0x22d3ee,intensity:1.6},sun:{color:0xffffff,intensity:1.0}},
    mat:{hull:{color:0x0a1426},panel:{color:0x0c1a30},trim:{color:0x16273f},rubber:{color:0x05080f},steel:{color:0x6a7a8c},cyan:{color:0x9bf3ff,emissive:0x18b5d4,emissiveIntensity:1.10},violet:{color:0xc4b5fd,emissive:0x6d28d9,emissiveIntensity:0.95},rose:{color:0xfecdd3,emissive:0xe11d48,emissiveIntensity:0.85}}
  },
  'azure-glass': {
    fog:0xb8d9f5, fogDensity:0.015, exposure:1.05,
    ambient:{color:0xffffff,intensity:1.6},
    lights:{key:{color:0x2a90e0,intensity:3.8},fill:{color:0x8888d8,intensity:2.8},rose:{color:0xc04060,intensity:1.4},under:{color:0x4090c0,intensity:1.2},sun:{color:0xe0f2ff,intensity:2.0}},
    mat:{hull:{color:0xb8d4ec},panel:{color:0xcce4f6},trim:{color:0xa0c8e4},rubber:{color:0x708090},steel:{color:0x7a90a8},cyan:{color:0x0e6aad,emissive:0x093a70,emissiveIntensity:0.55},violet:{color:0x4a3490,emissive:0x2e1f6a,emissiveIntensity:0.50},rose:{color:0xb02040,emissive:0x801030,emissiveIntensity:0.45}}
  },
  'digital-sky': {
    fog:0xd0e8f8, fogDensity:0.012, exposure:1.08,
    ambient:{color:0xffffff,intensity:1.8},
    lights:{key:{color:0x60a8d8,intensity:3.2},fill:{color:0xa0a8e0,intensity:2.4},rose:{color:0xd06080,intensity:1.2},under:{color:0x60a8c8,intensity:1.0},sun:{color:0xf0f8ff,intensity:2.2}},
    mat:{hull:{color:0xc8dcea},panel:{color:0xdae8f2},trim:{color:0xb0c8dc},rubber:{color:0x8090a0},steel:{color:0x90a0b0},cyan:{color:0x2878b0,emissive:0x1050a0,emissiveIntensity:0.45},violet:{color:0x6858a8,emissive:0x402878,emissiveIntensity:0.40},rose:{color:0xc06070,emissive:0x904050,emissiveIntensity:0.38}}
  },
  'cyber-ice': {
    fog:0xe0f6ff, fogDensity:0.010, exposure:1.12,
    ambient:{color:0xffffff,intensity:2.0},
    lights:{key:{color:0x80d8ff,intensity:4.0},fill:{color:0xa0b8ff,intensity:2.8},rose:{color:0xff8096,intensity:1.0},under:{color:0x60e8ff,intensity:1.4},sun:{color:0xffffff,intensity:2.5}},
    mat:{hull:{color:0xd8eef8},panel:{color:0xe8f6ff},trim:{color:0xc0e0f4},rubber:{color:0x90a8b8},steel:{color:0xa8c0d0},cyan:{color:0x0090c8,emissive:0x0060a0,emissiveIntensity:0.60},violet:{color:0x4040c0,emissive:0x2020a0,emissiveIntensity:0.55},rose:{color:0xc02050,emissive:0x901030,emissiveIntensity:0.50}}
  },
  'neon-cyberpunk': {
    fog:0x000510, fogDensity:0.025, exposure:1.35,
    ambient:{color:0x100020,intensity:0.40},
    lights:{key:{color:0x00ffff,intensity:8.0},fill:{color:0xff00ff,intensity:6.0},rose:{color:0xff0066,intensity:3.5},under:{color:0x00ff88,intensity:2.0},sun:{color:0xffffff,intensity:0.6}},
    mat:{hull:{color:0x040408},panel:{color:0x060810},trim:{color:0x0a0820},rubber:{color:0x020204},steel:{color:0x202840},cyan:{color:0x00ffff,emissive:0x00cccc,emissiveIntensity:2.0},violet:{color:0xff00ff,emissive:0xcc00cc,emissiveIntensity:1.8},rose:{color:0xff0066,emissive:0xcc0044,emissiveIntensity:1.6}}
  },
  'quantum-blue': {
    fog:0x020a28, fogDensity:0.020, exposure:1.25,
    ambient:{color:0x102060,intensity:0.65},
    lights:{key:{color:0x3a8fff,intensity:7.0},fill:{color:0x5040ff,intensity:4.5},rose:{color:0xff4080,intensity:2.0},under:{color:0x2060ff,intensity:1.8},sun:{color:0x80c0ff,intensity:1.2}},
    mat:{hull:{color:0x060e28},panel:{color:0x081430},trim:{color:0x0c1c40},rubber:{color:0x040810},steel:{color:0x304870},cyan:{color:0x3a8fff,emissive:0x1860e0,emissiveIntensity:1.40},violet:{color:0x8060ff,emissive:0x5040e0,emissiveIntensity:1.20},rose:{color:0xff4080,emissive:0xe02060,emissiveIntensity:1.00}}
  },
  'cloud-minimal': {
    fog:0xeef6fc, fogDensity:0.008, exposure:1.00,
    ambient:{color:0xffffff,intensity:2.2},
    lights:{key:{color:0x8ab8d8,intensity:2.8},fill:{color:0xa0a8c8,intensity:1.8},rose:{color:0xd08898,intensity:0.8},under:{color:0x88b8cc,intensity:0.8},sun:{color:0xffffff,intensity:2.8}},
    mat:{hull:{color:0xd8e8f0},panel:{color:0xe4eff8},trim:{color:0xc8dcea},rubber:{color:0x9098a8},steel:{color:0xa0adb8},cyan:{color:0x4888b0,emissive:0x2858a0,emissiveIntensity:0.35},violet:{color:0x7068a8,emissive:0x503888,emissiveIntensity:0.30},rose:{color:0xb87888,emissive:0x986878,emissiveIntensity:0.28}}
  },
  'hacker-terminal': {
    fog:0x000800, fogDensity:0.028, exposure:1.20,
    ambient:{color:0x002200,intensity:0.45},
    lights:{key:{color:0x00ff41,intensity:6.0},fill:{color:0xffb000,intensity:3.0},rose:{color:0xff4400,intensity:1.8},under:{color:0x00cc33,intensity:1.4},sun:{color:0x80ff80,intensity:0.7}},
    mat:{hull:{color:0x010801},panel:{color:0x020c02},trim:{color:0x041404},rubber:{color:0x010201},steel:{color:0x182818},cyan:{color:0x00ff41,emissive:0x00cc33,emissiveIntensity:1.80},violet:{color:0xffb000,emissive:0xcc8800,emissiveIntensity:1.50},rose:{color:0xff4400,emissive:0xcc2800,emissiveIntensity:1.30}}
  },
  'aurora-tech': {
    fog:0x030d1a, fogDensity:0.020, exposure:1.22,
    ambient:{color:0x0a1535,intensity:0.50},
    lights:{key:{color:0x00d4ff,intensity:6.5},fill:{color:0x9d4eff,intensity:5.0},rose:{color:0x00ff9d,intensity:2.5},under:{color:0x00b896,intensity:1.8},sun:{color:0xb0e0ff,intensity:0.9}},
    mat:{hull:{color:0x060e20},panel:{color:0x081428},trim:{color:0x0c1c38},rubber:{color:0x040810},steel:{color:0x284060},cyan:{color:0x00d4ff,emissive:0x0090d0,emissiveIntensity:1.60},violet:{color:0x9d4eff,emissive:0x7030e0,emissiveIntensity:1.40},rose:{color:0x00ff9d,emissive:0x00cc80,emissiveIntensity:1.20}}
  },
  'arctic-network': {
    fog:0xd4eef8, fogDensity:0.013, exposure:1.06,
    ambient:{color:0xffffff,intensity:1.75},
    lights:{key:{color:0x60b8e0,intensity:3.5},fill:{color:0x9898e0,intensity:2.5},rose:{color:0xe06080,intensity:1.2},under:{color:0x50c0e0,intensity:1.2},sun:{color:0xf0faff,intensity:2.3}},
    mat:{hull:{color:0xbcd4e8},panel:{color:0xcce4f0},trim:{color:0xa8ccde},rubber:{color:0x788898},steel:{color:0x8898a8},cyan:{color:0x1888c0,emissive:0x0a5890,emissiveIntensity:0.58},violet:{color:0x5048a0,emissive:0x342878,emissiveIntensity:0.52},rose:{color:0xc03060,emissive:0x901040,emissiveIntensity:0.48}}
  }
}

let sceneL = {}
let activeTheme = localStorage.getItem('cf-theme') || 'dark'
if (!THEMES[activeTheme]) activeTheme = 'dark'

function applyTheme(name) {
  const t = THEMES[name]; if (!t) return
  activeTheme = name
  localStorage.setItem('cf-theme', name)
  document.documentElement.setAttribute('data-theme', name)
  document.querySelectorAll('.swatch-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === name))
  if (!scene) return
  scene.fog.color.setHex(t.fog)
  scene.fog.density = t.fogDensity
  renderer.toneMappingExposure = t.exposure
  if (sceneL.ambient) { sceneL.ambient.color.setHex(t.ambient.color); sceneL.ambient.intensity = t.ambient.intensity }
  if (sceneL.key)   sceneL.key.color.setHex(t.lights.key.color)
  if (sceneL.fill)  sceneL.fill.color.setHex(t.lights.fill.color)
  if (sceneL.rose)  sceneL.rose.color.setHex(t.lights.rose.color)
  if (sceneL.under) sceneL.under.color.setHex(t.lights.under.color)
  if (sceneL.sun)   sceneL.sun.color.setHex(t.lights.sun.color)
  const energy = window.TWEAKS ? window.TWEAKS.sceneEnergy : 50
  const ef = 0.18 + (energy / 100) * 1.64
  if (sceneL.key)   sceneL.key.intensity   = t.lights.key.intensity   * ef
  if (sceneL.fill)  sceneL.fill.intensity  = t.lights.fill.intensity  * ef
  if (sceneL.rose)  sceneL.rose.intensity  = t.lights.rose.intensity  * ef
  if (sceneL.under) sceneL.under.intensity = t.lights.under.intensity * ef
  if (sceneL.sun)   sceneL.sun.intensity   = t.lights.sun.intensity   * ef
  for (const [k, v] of Object.entries(t.mat)) {
    if (!M[k]) continue
    M[k].color.setHex(v.color)
    if (v.emissive !== undefined)          M[k].emissive.setHex(v.emissive)
    if (v.emissiveIntensity !== undefined) M[k].emissiveIntensity = v.emissiveIntensity
  }
  setTimeout(() => { if (typeof panelRepainters !== 'undefined') panelRepainters.forEach(fn => fn()) }, 20)
}

/* ─── Renderer / scene / camera ──────────────────────────────────── */
const IS_MOBILE = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024)
if (IS_MOBILE) document.body.classList.add('is-mobile')

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !IS_MOBILE,
  alpha: true,
  powerPreference: IS_MOBILE ? 'default' : 'high-performance'
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.18
renderer.shadowMap.enabled = !IS_MOBILE
if (!IS_MOBILE) renderer.shadowMap.type = THREE.PCFSoftShadowMap

const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(0x02060f, 0.022)
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 240)
camera.position.set(0, 5.6, 16.5)
const desiredCam = camera.position.clone()
const desiredTgt = new THREE.Vector3(0, 1.6, 0)
const targetLook = desiredTgt.clone()

const root = new THREE.Group()
scene.add(root)

/* ─── Materials ───────────────────────────────────────────────────── */
const M = {
  hull:   new THREE.MeshStandardMaterial({ color: 0x0a1426, roughness: 0.62, metalness: 0.40 }),
  panel:  new THREE.MeshStandardMaterial({ color: 0x0c1a30, roughness: 0.42, metalness: 0.55 }),
  trim:   new THREE.MeshStandardMaterial({ color: 0x16273f, roughness: 0.35, metalness: 0.78 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x05080f, roughness: 0.95, metalness: 0.05 }),
  steel:  new THREE.MeshStandardMaterial({ color: 0x6a7a8c, roughness: 0.32, metalness: 0.85 }),
  cyan:   new THREE.MeshStandardMaterial({ color: 0x9bf3ff, emissive: 0x18b5d4, emissiveIntensity: 1.10, roughness: 0.30, metalness: 0.18 }),
  violet: new THREE.MeshStandardMaterial({ color: 0xc4b5fd, emissive: 0x6d28d9, emissiveIntensity: 0.95, roughness: 0.30, metalness: 0.18 }),
  rose:   new THREE.MeshStandardMaterial({ color: 0xfecdd3, emissive: 0xe11d48, emissiveIntensity: 0.85, roughness: 0.32, metalness: 0.14 })
}

/* ─── Helpers ─────────────────────────────────────────────────────── */
const mc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c }
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}
function ctex(c) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = renderer.capabilities.getMaxAnisotropy()
  t.needsUpdate = true; return t
}

/* ─── Theme-aware canvas colors ───────────────────────────────────── */
const LIGHT_THEMES = new Set(['azure-glass', 'digital-sky', 'cyber-ice', 'cloud-minimal', 'arctic-network'])
function getCanvasColors() {
  const s = getComputedStyle(document.documentElement)
  const g = v => s.getPropertyValue(v).trim()
  const isLight = LIGHT_THEMES.has(activeTheme)
  return {
    bg:     g('--bg-1')     || (isLight ? '#deeaf5' : '#050b18'),
    bg2:    g('--bg-2')     || (isLight ? '#c8dced' : '#081428'),
    ink:    g('--ink')      || (isLight ? '#0a1628' : '#edfaff'),
    soft:   g('--ink-soft') || (isLight ? '#1e3a55' : '#c5d6e6'),
    muted:  g('--muted')    || (isLight ? '#3a6080' : '#9bb7c8'),
    row:    isLight ? 'rgba(0,0,0,0.06)'     : 'rgba(255,255,255,0.04)',
    track:  isLight ? 'rgba(0,0,0,0.08)'     : 'rgba(255,255,255,0.06)',
    grid:   isLight ? 'rgba(0,80,160,0.07)'  : 'rgba(110,231,255,0.06)',
    nodeBg: isLight ? g('--bg-2') || '#c8dced' : '#0b1828',
    isLight,
  }
}
const panelRepainters = []

/* ─── Procedural panel art ────────────────────────────────────────── */
function panelArt(kind, title, accent) {
  const c = mc(1024, 640), ctx = c.getContext('2d'), tex = ctex(c)
  function repaint() {
    const col = getCanvasColors()
    ctx.clearRect(0, 0, c.width, c.height)
    const grad = ctx.createLinearGradient(0, 0, c.width, c.height)
    if (col.isLight) {
      grad.addColorStop(0, col.bg); grad.addColorStop(0.55, col.bg2); grad.addColorStop(1, col.bg)
    } else {
      grad.addColorStop(0, '#06121f'); grad.addColorStop(0.55, '#070d18'); grad.addColorStop(1, '#0c0a1f')
    }
    ctx.fillStyle = grad; ctx.fillRect(0, 0, c.width, c.height)
    ctx.strokeStyle = col.grid; ctx.lineWidth = 1
    for (let x = 0; x < c.width; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke() }
    for (let y = 0; y < c.height; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke() }
    ctx.fillStyle = col.row; rr(ctx, 24, 24, c.width - 48, 56, 14); ctx.fill()
    ctx.fillStyle = accent; ctx.font = '700 22px Inter, Arial, sans-serif'
    ctx.fillText(title.toUpperCase(), 44, 60)
    ctx.fillStyle = col.muted; ctx.font = '500 16px JetBrains Mono, monospace'
    ctx.fillText('NODE / LIVE / v2.7', c.width - 240, 60)
    ctx.strokeStyle = accent; ctx.globalAlpha = 0.75; ctx.lineWidth = 2
    rr(ctx, 14, 14, c.width - 28, c.height - 28, 22); ctx.stroke(); ctx.globalAlpha = 1
    if (kind === 'core') drawCore(ctx, c, accent, col)
    else if (kind === 'ir') drawIR(ctx, c, col)
    else if (kind === 'cloud') drawCloud(ctx, c, accent, col)
    else if (kind === 'ai') drawAI(ctx, c, accent, col)
    else drawWriteups(ctx, c, accent, col)
    tex.needsUpdate = true
  }
  repaint()
  panelRepainters.push(repaint)
  return tex
}

function drawCore(ctx, c, accent, col) {
  const cx = 200, cy = 360
  ctx.strokeStyle = accent; ctx.globalAlpha = 0.18
  for (let r = 60; r < 200; r += 24) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke() }
  ctx.globalAlpha = 1
  ctx.fillStyle = accent; ctx.globalAlpha = 0.78
  ctx.beginPath()
  ctx.moveTo(cx, cy - 110); ctx.lineTo(cx + 78, cy - 70); ctx.lineTo(cx + 64, cy + 38)
  ctx.lineTo(cx, cy + 110); ctx.lineTo(cx - 64, cy + 38); ctx.lineTo(cx - 78, cy - 70); ctx.closePath(); ctx.fill()
  ctx.globalAlpha = 1; ctx.strokeStyle = col.ink; ctx.lineWidth = 5
  ctx.beginPath(); ctx.moveTo(cx - 38, cy); ctx.lineTo(cx - 8, cy + 30); ctx.lineTo(cx + 42, cy - 24); ctx.stroke()
  const labels = ['Posture', 'Threat', 'Coverage', 'Latency'], vals = ['98%', 'Low', '92%', '12ms'], ws = [254, 60, 232, 80]
  for (let i = 0; i < 4; i++) {
    const y = 200 + i * 86
    ctx.fillStyle = col.row; rr(ctx, 460, y - 42, 520, 64, 12); ctx.fill()
    ctx.fillStyle = col.muted; ctx.font = '600 18px Inter, Arial, sans-serif'; ctx.fillText(labels[i], 478, y - 14)
    ctx.fillStyle = col.ink; ctx.font = '800 28px Inter, Arial, sans-serif'; ctx.fillText(vals[i], 478, y + 14)
    ctx.fillStyle = col.track; rr(ctx, 700, y - 8, 260, 8, 4); ctx.fill()
    ctx.fillStyle = accent; rr(ctx, 700, y - 8, ws[i], 8, 4); ctx.fill()
  }
}

function drawIR(ctx, c, col) {
  ctx.fillStyle = col.muted; ctx.font = '600 16px JetBrains Mono, monospace'
  ctx.fillText('INCIDENT TIMELINE / SEV2 / CONTAINED', 36, 120)
  const evs = [
    ['08:14', 'Detect: anomalous IAM call sequence', '#fb7185'],
    ['08:15', 'Triage: scoping to staging account', '#fde68a'],
    ['08:18', 'Contain: revoke token, isolate role', '#9bf3ff'],
    ['08:24', 'Eradicate: rotate keys, patch policy', '#a7f3d0'],
    ['08:41', 'Recover: restore service, monitor 24h', '#a7f3d0'],
    ['09:10', 'Lessons: postmortem and update runbook', '#c4b5fd']
  ]
  evs.forEach((e, i) => {
    const y = 170 + i * 60
    ctx.fillStyle = col.row; rr(ctx, 36, y - 28, c.width - 72, 50, 10); ctx.fill()
    ctx.fillStyle = e[2]; ctx.beginPath(); ctx.arc(64, y - 3, 8, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = col.ink; ctx.font = '700 16px JetBrains Mono, monospace'; ctx.fillText(e[0], 88, y + 4)
    ctx.fillStyle = col.soft; ctx.font = '500 18px Inter, Arial, sans-serif'; ctx.fillText(e[1], 170, y + 4)
  })
}

function drawCloud(ctx, c, accent, col) {
  ctx.fillStyle = col.muted; ctx.font = '600 16px JetBrains Mono, monospace'
  ctx.fillText('LANDING ZONES / 3 REGIONS / ALL HEALTHY', 36, 120)
  ctx.fillStyle = col.isLight ? 'rgba(0,80,160,0.07)' : 'rgba(110,231,255,0.08)'
  ctx.beginPath(); ctx.ellipse(c.width / 2, 360, 460, 200, 0, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = col.isLight ? 'rgba(0,80,160,0.18)' : 'rgba(110,231,255,0.18)'; ctx.lineWidth = 1
  for (let i = 0; i < 8; i++) {
    ctx.beginPath(); ctx.ellipse(c.width / 2, 360, 60 + i * 60, 28 + i * 24, 0, 0, Math.PI * 2); ctx.stroke()
  }
  const regs = [[180, 320, 'Sydney', 'ap-southeast-2'], [540, 220, 'Melbourne', 'ap-southeast-4'], [820, 420, 'Oregon', 'us-west-2']]
  ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.setLineDash([6, 8])
  ctx.beginPath(); ctx.moveTo(regs[0][0], regs[0][1]); ctx.lineTo(regs[1][0], regs[1][1]); ctx.lineTo(regs[2][0], regs[2][1]); ctx.stroke()
  ctx.setLineDash([])
  regs.forEach(r => {
    ctx.fillStyle = col.nodeBg; ctx.beginPath(); ctx.arc(r[0], r[1], 18, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r[0], r[1], 18, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = '#a7f3d0'; ctx.beginPath(); ctx.arc(r[0], r[1], 6, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = col.ink; ctx.font = '700 16px Inter, Arial, sans-serif'; ctx.fillText(r[2], r[0] + 26, r[1] - 4)
    ctx.fillStyle = col.muted; ctx.font = '500 13px JetBrains Mono, monospace'; ctx.fillText(r[3], r[0] + 26, r[1] + 14)
  })
}

function drawAI(ctx, c, accent, col) {
  ctx.fillStyle = col.muted; ctx.font = '600 16px JetBrains Mono, monospace'
  ctx.fillText('CAREER TIMELINE / FIELD  →  CYBER / 7Y', 36, 120)
  const timeline = [
    ['2019', 'DEPLOY', 'TCS embedded: Shell QGC / QCLNG ops',       '#38bdf8'],
    ['2022', 'OPS',    '600+ vehicles · 20+ FIFO remote sites',      '#a78bfa'],
    ['2024', 'CERT',   'AWS SAA · OCI AA · OCI FA · OCI GenAI',      '#22d3ee'],
    ['2025', 'CERT',   'Certificate IV in Cyber Security',            '#a7f3d0'],
    ['2025', 'LABS',   'Home lab · TryHackMe Triage · RTCC published','#fb7185'],
    ['2026', 'SCHED',  'ISC2 CC · CompTIA Sec+ exams queued',        '#fde68a'],
  ]
  timeline.forEach((e, i) => {
    const y = 170 + i * 62
    ctx.fillStyle = col.row; rr(ctx, 36, y - 28, c.width - 72, 50, 10); ctx.fill()
    ctx.fillStyle = e[3]; ctx.beginPath(); ctx.arc(64, y - 3, 8, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = e[3];  ctx.font = '700 14px JetBrains Mono, monospace'; ctx.fillText(e[0], 88,  y + 5)
    ctx.fillStyle = col.muted; ctx.font = '600 13px JetBrains Mono, monospace'; ctx.fillText(e[1], 148, y + 5)
    ctx.fillStyle = col.soft; ctx.font = '500 16px Inter, Arial, sans-serif';  ctx.fillText(e[2], 226, y + 5)
  })
}

function drawWriteups(ctx, c, accent, col) {
  ctx.fillStyle = col.muted; ctx.font = '600 16px JetBrains Mono, monospace'
  ctx.fillText('OFFENSIVE OPS / THM + HOME LAB / ACTIVE', 36, 120)
  const ops = [
    ['PUB',  'Red Team Capstone Crawl-Through', 'Full AD kill chain · Kerberos · pivot · GPU crack', '#a7f3d0'],
    ['LAB',  'Active Directory Tradecraft',     'Kerberoast · AS-REP · Golden Ticket · DCSync',     '#fb7185'],
    ['LAB',  'Tunnelling + Pivoting',           'Chisel · SSH forward · lateral movement chain',    '#a78bfa'],
    ['NOTE', 'AI Security — OWASP LLM Top 10',  'Prompt injection · RAG risk · MITRE ATLAS map',   '#fde68a'],
  ]
  ops.forEach((op, i) => {
    const y = 185 + i * 96
    ctx.fillStyle = col.row; rr(ctx, 36, y - 40, c.width - 72, 78, 14); ctx.fill()
    ctx.fillStyle = op[3]; ctx.beginPath(); ctx.arc(64, y - 10, 8, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = op[3];   ctx.font = '700 13px JetBrains Mono, monospace'; ctx.fillText(op[0], 86, y - 3)
    ctx.fillStyle = col.ink; ctx.font = '700 18px Inter, Arial, sans-serif'; ctx.fillText(op[1], 86, y + 18)
    ctx.fillStyle = col.muted; ctx.font = '500 14px Inter, Arial, sans-serif'; ctx.fillText(op[2], 86, y + 36)
    if (i === 0) { ctx.fillStyle = op[3]; ctx.font = '600 13px JetBrains Mono, monospace'; ctx.fillText('OPEN  >', c.width - 140, y + 2) }
  })
}

/* ─── Animated ticker ─────────────────────────────────────────────── */
function tickerScreen(label, accent, handle = '', stat = '') {
  const c = mc(512, 320), ctx = c.getContext('2d'), tex = ctex(c)
  const pk = label.toLowerCase()
  let frame = 0

  function drawLogo(cx, cy, sz) {
    ctx.save(); ctx.strokeStyle = accent; ctx.fillStyle = accent
    ctx.lineWidth = Math.max(2, sz * 0.055)
    if (pk === 'linkedin') {
      const hw = sz * 0.46, r = sz * 0.12
      ctx.beginPath()
      ctx.moveTo(cx - hw + r, cy - hw); ctx.lineTo(cx + hw - r, cy - hw)
      ctx.quadraticCurveTo(cx + hw, cy - hw, cx + hw, cy - hw + r)
      ctx.lineTo(cx + hw, cy + hw - r)
      ctx.quadraticCurveTo(cx + hw, cy + hw, cx + hw - r, cy + hw)
      ctx.lineTo(cx - hw + r, cy + hw)
      ctx.quadraticCurveTo(cx - hw, cy + hw, cx - hw, cy + hw - r)
      ctx.lineTo(cx - hw, cy - hw + r)
      ctx.quadraticCurveTo(cx - hw, cy - hw, cx - hw + r, cy - hw)
      ctx.closePath(); ctx.stroke()
      ctx.font = `700 ${sz * 0.5}px Georgia, serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('in', cx, cy + sz * 0.04)
    } else if (pk === 'github') {
      const hr = sz * 0.3
      ctx.beginPath(); ctx.arc(cx, cy - sz * 0.08, hr, 0, Math.PI * 2); ctx.stroke()
      ctx.lineWidth = Math.max(1.5, sz * 0.038)
      for (let i = 0; i < 5; i++) {
        const angle = Math.PI + (i / 4) * Math.PI
        const sx = cx + Math.cos(angle) * hr * 0.82
        const sy = (cy - sz * 0.08) + Math.sin(angle) * hr * 0.82
        const ex = sx + (sx - cx) * 0.5
        const ey = cy + sz * 0.42
        ctx.beginPath(); ctx.moveTo(sx, sy)
        ctx.bezierCurveTo(sx, sy + sz * 0.18, ex, ey - sz * 0.1, ex, ey)
        ctx.stroke()
      }
    } else if (pk === 'tryhackme') {
      ctx.lineWidth = Math.max(2, sz * 0.055)
      ctx.beginPath()
      ctx.arc(cx - sz * 0.2, cy - sz * 0.04, sz * 0.23, Math.PI * 0.75, Math.PI * 1.95)
      ctx.arc(cx, cy - sz * 0.18, sz * 0.27, Math.PI * 1.1, Math.PI * 1.9)
      ctx.arc(cx + sz * 0.2, cy - sz * 0.04, sz * 0.23, Math.PI * 1.05, Math.PI * 2.25)
      ctx.lineTo(cx + sz * 0.43, cy + sz * 0.15)
      ctx.lineTo(cx - sz * 0.43, cy + sz * 0.15)
      ctx.closePath(); ctx.stroke()
      ctx.font = `700 ${sz * 0.26}px JetBrains Mono, monospace`
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      ctx.fillText('THM', cx, cy + sz * 0.06)
    }
    ctx.restore()
  }

  return {
    tex,
    paint() {
      frame++
      const col = getCanvasColors()
      ctx.fillStyle = col.bg; ctx.fillRect(0, 0, c.width, c.height)
      ctx.fillStyle = accent; ctx.font = '700 14px JetBrains Mono, monospace'
      ctx.textAlign = 'left'; ctx.fillText(label.toUpperCase(), 14, 22)
      ctx.fillStyle = col.muted; ctx.font = '500 10px JetBrains Mono, monospace'
      ctx.textAlign = 'right'; ctx.fillText(String(frame).padStart(6, '0'), c.width - 14, 22)
      ctx.textAlign = 'left'
      drawLogo(c.width / 2, 118, 80)
      ctx.fillStyle = col.ink; ctx.font = '600 15px Inter, Arial, sans-serif'
      ctx.textAlign = 'center'; ctx.fillText(handle, c.width / 2, 198)
      ctx.fillStyle = accent; ctx.font = '500 11px JetBrains Mono, monospace'
      ctx.fillText(stat, c.width / 2, 215)
      ctx.textAlign = 'left'
      ctx.strokeStyle = accent; ctx.globalAlpha = 0.2; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(14, 230); ctx.lineTo(c.width - 14, 230); ctx.stroke()
      ctx.globalAlpha = 1
      ctx.strokeStyle = accent; ctx.lineWidth = 1.5; ctx.beginPath()
      for (let x = 0; x < c.width - 28; x += 4) {
        const y = c.height - 24 + Math.sin((x + frame * 4) * 0.05) * 8 + Math.cos((x - frame) * 0.08) * 5
        if (x === 0) ctx.moveTo(14 + x, y); else ctx.lineTo(14 + x, y)
      }
      ctx.stroke()
      ctx.fillStyle = accent; ctx.globalAlpha = 0.55 + Math.sin(frame * 0.08) * 0.45
      ctx.font = '600 11px JetBrains Mono, monospace'
      ctx.textAlign = 'center'; ctx.fillText('[ OPEN ↗ ]', c.width / 2, c.height - 6)
      ctx.globalAlpha = 1; ctx.textAlign = 'left'; tex.needsUpdate = true
    }
  }
}

const interactive = []
const routeTargets = new Map()
let networkBus

/* ─── Plinth + grid floor ─────────────────────────────────────────── */
function plinth() {
  const g = new THREE.Group()
  const p = new THREE.Mesh(new THREE.CylinderGeometry(7.6, 8.0, 0.55, 6, 1), M.hull)
  p.position.y = -1.3; p.receiveShadow = true; g.add(p)
  const bv = new THREE.Mesh(new THREE.TorusGeometry(7.55, 0.04, 12, 96), M.cyan)
  bv.rotation.x = -Math.PI / 2; bv.position.y = -1.02; g.add(bv)
  const inset = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 6.8, 0.02, 64),
    new THREE.MeshStandardMaterial({ color: 0x06121f, roughness: 0.85, metalness: 0.18 }))
  inset.position.y = -1.0; inset.receiveShadow = true; g.add(inset)
  const gc = mc(1024, 1024), x = gc.getContext('2d')
  x.fillStyle = '#06121f'; x.fillRect(0, 0, 1024, 1024)
  x.strokeStyle = 'rgba(110,231,255,0.30)'; x.lineWidth = 2
  for (let i = 0; i <= 32; i++) {
    const v = (i / 32) * 1024
    x.beginPath(); x.moveTo(v, 0); x.lineTo(v, 1024); x.stroke()
    x.beginPath(); x.moveTo(0, v); x.lineTo(1024, v); x.stroke()
  }
  x.strokeStyle = 'rgba(167,139,250,0.55)'; x.lineWidth = 4
  for (const r of [220, 360, 480]) { x.beginPath(); x.arc(512, 512, r, 0, Math.PI * 2); x.stroke() }
  const gm = new THREE.Mesh(new THREE.CircleGeometry(6.6, 96),
    new THREE.MeshBasicMaterial({ map: ctex(gc), transparent: true, opacity: 0.85 }))
  gm.rotation.x = -Math.PI / 2; gm.position.y = -0.985; g.add(gm)
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.2 + i * 1.3, 2.24 + i * 1.3, 96),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0xa78bfa : 0x6ee7ff, transparent: true,
        opacity: 0.32 - i * 0.06, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }))
    ring.rotation.x = -Math.PI / 2; ring.position.y = -0.97; g.add(ring)
  }
  root.add(g)
}

/* ─── Security core ───────────────────────────────────────────────── */
function securityCore() {
  const g = new THREE.Group(); g.position.set(0, 1.55, 0)
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 0.4, 6), M.trim)
  ped.position.y = -1.05; ped.castShadow = true; g.add(ped)
  const pr = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.03, 10, 64), M.cyan)
  pr.rotation.x = -Math.PI / 2; pr.position.y = -0.86; g.add(pr)
  const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(0.78, 1),
    new THREE.MeshStandardMaterial({ color: 0xc4f5ff, emissive: 0x22d3ee, emissiveIntensity: 1.4, roughness: 0.18, metalness: 0.32 }))
  g.add(inner)
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.45, 1),
    new THREE.MeshBasicMaterial({ color: 0x6ee7ff, wireframe: true, transparent: true, opacity: 0.55 }))
  g.add(shell)
  const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(2.0, 2),
    new THREE.MeshPhysicalMaterial({ color: 0x5fc3ff, transparent: true, opacity: 0.10, transmission: 0.6,
      thickness: 0.4, roughness: 0.05, metalness: 0.05, side: THREE.DoubleSide }))
  g.add(dome)
  const rings = []
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(1.7 + i * 0.18, 0.018, 10, 96),
      new THREE.MeshStandardMaterial({ color: 0xa78bfa, emissive: 0x7c3aed, emissiveIntensity: 0.85, roughness: 0.4, metalness: 0.3 }))
    r.rotation.x = (i + 1) * 0.7; r.rotation.y = i * 0.5; g.add(r); rings.push(r)
  }
  const motes = []
  for (let i = 0; i < 12; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12),
      new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xfb7185 : 0x6ee7ff }))
    m.userData = { theta: Math.random() * Math.PI * 2, r: 1.7 + Math.random() * 0.45, speed: 0.4 + Math.random() * 0.7 }
    g.add(m); motes.push(m)
  }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.18, 6.0, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x6ee7ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false }))
  beam.position.y = 3.0; g.add(beam)
  inner.userData = {
    title: 'About Markus', desc: 'The active heart of the command centre.',
    key: 'core', zone: 'core', badge: 'PROFILE', badgeClass: '', group: g
  }
  interactive.push(inner)
  g.userData.animate = (t) => {
    inner.rotation.y = t * 0.4; inner.rotation.x = Math.sin(t * 0.6) * 0.3
    inner.material.emissiveIntensity = 1.2 + Math.sin(t * 2.2) * 0.3
    shell.rotation.y = -t * 0.22; shell.rotation.z = t * 0.12
    rings.forEach((r, i) => { r.rotation.x += 0.002 * (i + 1); r.rotation.y += 0.003 * (i + 1) })
    motes.forEach((m, i) => {
      m.userData.theta += 0.01 * m.userData.speed
      m.position.set(Math.cos(m.userData.theta) * m.userData.r,
        Math.sin(t * m.userData.speed + i) * 0.5,
        Math.sin(m.userData.theta) * m.userData.r)
    })
    beam.material.opacity = 0.14 + Math.sin(t * 3) * 0.06
  }
  root.add(g)
}

/* ─── Server rack ─────────────────────────────────────────────────── */
function serverRack(x, z, rotY) {
  const g = new THREE.Group(); g.position.set(x, -0.62, z); g.rotation.y = rotY
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.6, 1.0), M.hull)
  cab.position.y = 1.3; cab.castShadow = cab.receiveShadow = true; g.add(cab)
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.22, 2.42, 0.04), M.panel)
  door.position.set(0, 1.3, 0.51); g.add(door)
  const leds = []
  for (let i = 0; i < 10; i++) {
    const u = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.18, 0.03), M.trim)
    u.position.set(0, 0.22 + i * 0.22, 0.535); g.add(u)
    for (let j = 0; j < 5; j++) {
      const lm = (Math.random() > 0.7 ? M.rose : Math.random() > 0.5 ? M.violet : M.cyan).clone()
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), lm)
      led.position.set(-0.5 + j * 0.06, 0.22 + i * 0.22, 0.555)
      led.userData = { phase: Math.random() * Math.PI * 2 }
      g.add(led); leds.push(led)
    }
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.01), M.cyan.clone())
    strip.position.set(0.18, 0.22 + i * 0.22, 0.553); g.add(strip)
  }
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.06, 1.05), M.steel)
  top.position.y = 2.63; g.add(top)
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6), M.steel)
  ant.position.set(0.55, 2.84, 0.4); g.add(ant)
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), M.rose)
  tip.position.set(0.55, 3.02, 0.4); g.add(tip)
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 10), M.steel)
    f.position.set(i % 2 ? 0.6 : -0.6, 0.03, i < 2 ? 0.4 : -0.4); g.add(f)
  }
  g.userData.animate = (t) => {
    leds.forEach(l => { l.material.emissiveIntensity = (0.4 + (0.6 + Math.sin(t * 4.5 + l.userData.phase) * 0.5)) * 1.3 })
  }
  root.add(g)
}

/* ─── Workstation with three monitors ────────────────────────────── */
function workstation() {
  const g = new THREE.Group(); g.position.set(0, -0.95, 4.2)
  const desk = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.12, 1.7), M.panel)
  desk.position.y = 0.45; desk.castShadow = desk.receiveShadow = true; g.add(desk)
  const dg = new THREE.Mesh(new THREE.BoxGeometry(5.42, 0.02, 1.72),
    new THREE.MeshBasicMaterial({ color: 0x6ee7ff, transparent: true, opacity: 0.35 }))
  dg.position.y = 0.51; g.add(dg)
  for (let i = 0; i < 2; i++) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.45, 1.5), M.trim)
    leg.position.set(i ? 2.5 : -2.5, 0.22, 0); g.add(leg)
  }
  const tickers = []
  const profiles = [
    { lbl: 'LINKEDIN',   acc: '#6ee7ff', handle: 'markus-walker-au', stat: 'CAREER · CONNECT · OPEN',    badge: 'LINKEDIN', key: 'linkedin'  },
    { lbl: 'GITHUB',     acc: '#a78bfa', handle: 'markus-doc',        stat: 'WRITEUPS · PORTFOLIO · OPEN', badge: 'GITHUB',   key: 'github'    },
    { lbl: 'TRYHACKME',  acc: '#fb7185', handle: 'Triage',            stat: 'RED TEAM · ACTIVE · OPEN',   badge: 'THM',      key: 'tryhackme' },
  ]
  for (let i = 0; i < 3; i++) {
    const p = profiles[i], x = -1.85 + i * 1.85
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.35, 12), M.steel)
    stand.position.set(x, 0.7, -0.05); g.add(stand)
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), M.steel)
    base.position.set(x, 0.52, -0.05); g.add(base)
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.0, 0.06), M.hull)
    frame.position.set(x, 1.35, -0.05); frame.rotation.x = -0.06; g.add(frame)
    const tk = tickerScreen(p.lbl, p.acc, p.handle, p.stat); tickers.push(tk)
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.46, 0.92), new THREE.MeshBasicMaterial({ map: tk.tex }))
    screen.position.set(x, 1.35, -0.018); screen.rotation.x = -0.06
    screen.userData = { title: p.lbl, desc: p.handle, key: p.key, badge: p.badge, badgeClass: '', group: g }
    interactive.push(screen); g.add(screen)
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.12),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(p.acc), transparent: true, opacity: 0.10,
        blending: THREE.AdditiveBlending, depthWrite: false }))
    halo.position.set(x, 1.35, -0.06); halo.rotation.x = -0.06; g.add(halo)
  }
  const kb = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.5), M.trim)
  kb.position.set(0, 0.55, 0.45); g.add(kb)
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), M.steel)
  mouse.scale.set(1, 0.55, 1.6); mouse.position.set(0.95, 0.55, 0.45); g.add(mouse)
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.18, 16), M.rubber)
  mug.position.set(-1.4, 0.61, 0.55); g.add(mug)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 8, 16), M.rubber)
  handle.rotation.y = Math.PI / 2; handle.position.set(-1.28, 0.62, 0.55); g.add(handle)
  const steam = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.5),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, depthWrite: false }))
  steam.position.set(-1.4, 0.95, 0.55); g.add(steam)
  g.userData.animate = (t) => {
    tickers.forEach(tk => tk.paint())
    steam.material.opacity = 0.04 + Math.sin(t * 1.2) * 0.025
    steam.position.y = 0.95 + Math.sin(t * 0.8) * 0.04
  }
  root.add(g)
}

/* ─── Holo panel ──────────────────────────────────────────────────── */
function holoPanel({ key, title, subtitle, position, rotation, accent, kind }) {
  const g = new THREE.Group(); g.position.copy(position); g.rotation.set(rotation.x, rotation.y, rotation.z)
  // Multi-material box: face order is [+X, -X, +Y, -Y, +Z(front), -Z(back)]
  // Back face uses a frosted dark-glass material so backs read as translucent, not solid colour
  const backGlass = new THREE.MeshBasicMaterial({
    color: 0x0c1e3a, transparent: true, opacity: 0.20
  })
  const frameMats = [M.panel, M.panel, M.panel, M.panel, M.panel, backGlass]
  const frame = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.95, 0.10), frameMats); g.add(frame)
  const accentCol = new THREE.Color(accent)
  const trimFront = new THREE.MeshBasicMaterial({ color: accentCol, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
  const trimBack  = new THREE.MeshBasicMaterial({ color: accentCol, transparent: true, opacity: 0.0,  blending: THREE.AdditiveBlending, depthWrite: false })
  const trim = new THREE.Mesh(new THREE.BoxGeometry(3.06, 2.01, 0.04),
    [trimFront, trimFront, trimFront, trimFront, trimFront, trimBack])
  trim.position.z = -0.04; g.add(trim)
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.86, 1.82),
    new THREE.MeshBasicMaterial({ map: panelArt(kind, title, accent) }))
  screen.position.z = 0.058
  const badges = { core: 'PROFILE', ir: 'IRP', cloud: 'AWS', ai: 'RESUME', writeups: 'PUBLIC' }
  screen.userData = { title, desc: subtitle, key, zone: key, group: g,
    badge: badges[kind] || 'LIVE', badgeClass: kind === 'ir' ? 'warn' : '' }
  g.add(screen); interactive.push(screen)
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.36),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(accent), transparent: true, opacity: 0.10,
      blending: THREE.AdditiveBlending, depthWrite: false }))
  halo.position.z = 0.03; g.add(halo)
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.0, 12), M.trim)
  stem.position.y = -1.45; g.add(stem)
  const sb = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.10, 24), M.trim)
  sb.position.y = -2.0; g.add(sb)
  const sr = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.015, 8, 48),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(accent) }))
  sr.rotation.x = -Math.PI / 2; sr.position.y = -1.94; g.add(sr)
  const brk = new THREE.MeshBasicMaterial({ color: new THREE.Color(accent) })
  function bracket(sx, sy) {
    const m = new THREE.Group()
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.02), brk)
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.02), brk)
    a.position.x = 0.155 * sx; b.position.y = 0.155 * sy; m.add(a); m.add(b); return m
  }
  const positions = [[-1, 1, -1.43, 0.91], [1, 1, 1.43, 0.91], [-1, -1, -1.43, -0.91], [1, -1, 1.43, -0.91]]
  for (const [sx, sy, x, y] of positions) {
    const b = bracket(sx, sy); b.position.set(x, y, 0.07); g.add(b)
  }
  g.userData.halo = halo; g.userData.trim = trim; g.userData.trimFront = trimFront; g.userData.key = key
  g.userData.animate = (t) => {
    g.position.y = position.y + Math.sin(t * 1.0 + position.x) * 0.04
    halo.material.opacity = 0.08 + Math.sin(t * 1.4 + position.x) * 0.025
    trimFront.opacity = 0.45 + Math.sin(t * 1.8 + position.z) * 0.10
  }
  routeTargets.set(key, position.clone()); root.add(g)
}

/* ─── Beacon ──────────────────────────────────────────────────────── */
function beacon(x, z, color) {
  const g = new THREE.Group(); g.position.set(x, -0.95, z)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.12, 24), M.trim); g.add(base)
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 12), M.steel)
  post.position.y = 0.4; g.add(post)
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(color), emissiveIntensity: 1.2, roughness: 0.3, metalness: 0.2 }))
  orb.position.y = 0.85; g.add(orb)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.015, 8, 48),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(color) }))
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.07; g.add(ring)
  g.userData.animate = (t) => {
    orb.material.emissiveIntensity = 1.0 + Math.sin(t * 2.4 + x) * 0.4
    g.position.y = -0.95 + Math.sin(t * 1.6 + z) * 0.02
  }
  root.add(g)
}

/* ─── Back wall ───────────────────────────────────────────────────── */
function backWall() {
  const g = new THREE.Group(); g.position.set(0, 0, -6.4)
  const w = new THREE.Mesh(new THREE.BoxGeometry(13, 4.2, 0.18), M.hull)
  w.position.y = 1.0; w.receiveShadow = true; g.add(w)
  const strip = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.04, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x6ee7ff, transparent: true, opacity: 0.85 }))
  strip.position.set(0, 2.8, 0.10); g.add(strip)
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.02), M.panel)
    p.position.set(-5 + i * 2, 0.3, 0.10); g.add(p)
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), i % 2 ? M.violet : M.cyan)
    led.position.set(-5 + i * 2 + 0.6, 0.3, 0.12); g.add(led)
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(7, 0.08, 0.4),
    new THREE.MeshBasicMaterial({ color: 0xc4f5ff, transparent: true, opacity: 0.9 }))
  bar.position.set(0, 4.2, 0); g.add(bar)
  root.add(g)
}

/* ─── Drone ───────────────────────────────────────────────────────── */
function drone() {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 0),
    new THREE.MeshStandardMaterial({ color: 0xedfaff, emissive: 0xa78bfa, emissiveIntensity: 0.65, roughness: 0.35, metalness: 0.4 }))
  g.add(body)
  const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.012, 8, 48), new THREE.MeshBasicMaterial({ color: 0x6ee7ff }))
  g.add(r1)
  const r2 = r1.clone(); r2.rotation.x = Math.PI / 2; g.add(r2)
  g.userData.animate = (t) => {
    const r = 4.2
    g.position.set(Math.cos(t * 0.4) * r, 2.6 + Math.sin(t * 0.8) * 0.4, Math.sin(t * 0.4) * r * 0.4)
    body.rotation.y = t * 1.5; r1.rotation.z = t * 0.8; r2.rotation.x = Math.PI / 2 + t * 0.6
  }
  root.add(g)
}

/* ─── Network bus ─────────────────────────────────────────────────── */
function networkBusBuild(panels) {
  const motes = []
  const hub = new THREE.Vector3(0, 1.55, 0)
  for (const p of panels) {
    const mid = hub.clone().lerp(p, 0.5).add(new THREE.Vector3(0, 0.3, 0))
    const curve = new THREE.QuadraticBezierCurve3(hub, mid, p.clone())
    const pts = curve.getPoints(40)
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    root.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x6ee7ff, transparent: true, opacity: 0.22 })))
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshBasicMaterial({ color: 0xa78bfa }))
      m.userData = { curve, t: (i / 3) + Math.random() * 0.05, speed: 0.18 + Math.random() * 0.18 }
      root.add(m); motes.push(m)
    }
  }
  return { update(dt) {
    motes.forEach(m => {
      m.userData.t += dt * m.userData.speed
      if (m.userData.t > 1) m.userData.t -= 1
      m.userData.curve.getPoint(m.userData.t, m.position)
    })
  }}
}

/* ─── Particles ───────────────────────────────────────────────────── */
function particles() {
  const n = 1100
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const i3 = i * 3, r = 8 + Math.random() * 18, a = Math.random() * Math.PI * 2
    pos[i3] = Math.cos(a) * r; pos[i3 + 1] = (Math.random() - 0.2) * 12; pos[i3 + 2] = Math.sin(a) * r
    const v = Math.random()
    const c = v > 0.85 ? new THREE.Color(0xfb7185) : v > 0.55 ? new THREE.Color(0xa78bfa) : new THREE.Color(0x6ee7ff)
    col[i3] = c.r; col[i3 + 1] = c.g; col[i3 + 2] = c.b
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.04, vertexColors: true, transparent: true,
    opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }))
  pts.userData.animate = (t) => { pts.rotation.y = t * 0.012; pts.rotation.x = Math.sin(t * 0.1) * 0.014 }
  scene.add(pts)
}

/* ─── Lights ──────────────────────────────────────────────────────── */
function lights() {
  const amb = new THREE.AmbientLight(0x9bd6ff, 0.55); scene.add(amb); sceneL.ambient = amb
  const k = new THREE.PointLight(0x6ee7ff, 6.2, 50); k.position.set(-7, 9, 6); scene.add(k); sceneL.key = k
  const r = new THREE.PointLight(0xa78bfa, 5.0, 42); r.position.set(8, 6, -8); scene.add(r); sceneL.fill = r
  const rd = new THREE.PointLight(0xfb7185, 2.6, 30); rd.position.set(-4, 2, 6); scene.add(rd); sceneL.rose = rd
  const d = new THREE.DirectionalLight(0xffffff, 1.0); d.position.set(2, 12, 5); d.castShadow = true
  d.shadow.mapSize.set(1024, 1024); d.shadow.camera.near = 1; d.shadow.camera.far = 40
  d.shadow.camera.left = -12; d.shadow.camera.right = 12; d.shadow.camera.top = 12; d.shadow.camera.bottom = -12
  scene.add(d); sceneL.sun = d
  const u = new THREE.PointLight(0x22d3ee, 1.6, 12); u.position.set(0, -0.6, 0); scene.add(u); sceneL.under = u
}

/* ─── Build scene ─────────────────────────────────────────────────── */
function buildScene() {
  lights(); plinth(); backWall(); securityCore()
  serverRack(-5.2, -3.8, Math.PI / 7); serverRack(-3.4, -4.4, Math.PI / 9)
  serverRack(3.4, -4.4, -Math.PI / 9); serverRack(5.2, -3.8, -Math.PI / 7)
  workstation()
  beacon(-3.6, 1.2, 0xa78bfa); beacon(3.6, 1.2, 0x38bdf8)
  beacon(-3.0, 3.4, 0xfb7185); beacon(3.0, 3.4, 0x22d3ee)
  const panels = [
    { key: 'core',     title: 'About',                   subtitle: 'Markus Walker, Brisbane-based cyber engineer.',          position: new THREE.Vector3(0, 2.6, -4.6),   rotation: new THREE.Euler(0, 0, 0),              accent: '#6ee7ff', kind: 'core'     },
    { key: 'ir',       title: 'Incident Response Program',subtitle: 'NIST SP 800-61. 28 page IRP portfolio.',                position: new THREE.Vector3(-5.2, 2.0, -1.0), rotation: new THREE.Euler(0, Math.PI / 3.4, 0), accent: '#a78bfa', kind: 'ir'       },
    { key: 'cloud',    title: 'AWS Cloud Security Uplift', subtitle: "Rossco's Coffee, 36 page case study.",                 position: new THREE.Vector3(5.2, 2.0, -1.0),  rotation: new THREE.Euler(0, -Math.PI / 3.4, 0),accent: '#38bdf8', kind: 'cloud'    },
    { key: 'writeups', title: 'Cyber Writeups',            subtitle: 'RTCC published. Active TryHackMe practice.',           position: new THREE.Vector3(-4.4, 1.6, 3.2),  rotation: new THREE.Euler(0, Math.PI - Math.PI / 5.2, 0), accent: '#fb7185', kind: 'writeups' },
    { key: 'ai',       title: 'Resume',                    subtitle: 'AWS SAA, three OCI certs, Cert IV in Cyber.',          position: new THREE.Vector3(4.4, 1.6, 3.2),   rotation: new THREE.Euler(0, Math.PI + Math.PI / 5.2, 0), accent: '#22d3ee', kind: 'ai'       }
  ]
  panels.forEach(holoPanel)
  drone(); particles()
  networkBus = networkBusBuild(panels.map(p => p.position.clone()))
}

/* ═══════════════════════════════════════════════════════════════════
   INTERACTION + STATE SYSTEM
   ═══════════════════════════════════════════════════════════════════ */

/* ─── State ───────────────────────────────────────────────────────── */
const state = { activeSection: 'core', focused: false, isTransitioning: false, heroDismissed: false }

/* ─── Scroll camera zones (browse mode) ──────────────────────────── */
const SCROLL_ZONES = {
  core:     { pos: new THREE.Vector3(0, 5.2, 12.6),    look: new THREE.Vector3(0, 1.6, 0) },
  ir:       { pos: new THREE.Vector3(-7.8, 4.2, 6.6),  look: new THREE.Vector3(-3.2, 1.8, -1.2) },
  cloud:    { pos: new THREE.Vector3(7.8, 4.2, 6.6),   look: new THREE.Vector3(3.2, 1.8, -1.2) },
  ai:       { pos: new THREE.Vector3(6.0, 3.6, 9.2),   look: new THREE.Vector3(2.6, 1.2, 3.0) },
  writeups: { pos: new THREE.Vector3(-6.0, 3.6, 9.2),  look: new THREE.Vector3(-2.6, 1.2, 3.0) }
}

/* ─── Focus camera zones (zoomed in per section) ─────────────────── */
const FOCUS_ZONES = {
  core:     SCROLL_ZONES.core,
  // About/skills: camera drifts toward the core (centre) monitor
  about:    { pos: new THREE.Vector3(0, 3.2, 2.8),      look: new THREE.Vector3(0, 2.2, -4.6) },
  skills:   { pos: new THREE.Vector3(0, 2.8, 3.6),      look: new THREE.Vector3(0, 2.0, -4.4) },
  // IR: panel at (-5.2,2,-1), faces +X/+Z — camera swings right and forward so it looks at the front face
  ir:       { pos: new THREE.Vector3(-1.6, 3.6, 3.2),   look: new THREE.Vector3(-5.0, 1.8, -0.8) },
  // Cloud: mirror of IR
  cloud:    { pos: new THREE.Vector3(1.6, 3.6, 3.2),    look: new THREE.Vector3(5.0, 1.8, -0.8) },
  // Resume: ai panel at (4.4,1.6,3.2), screen normal ~(-0.57,0,-0.82) — camera on front-face side
  resume:   { pos: new THREE.Vector3(1.6, 3.6, -1.0),   look: new THREE.Vector3(4.4, 1.6, 3.2) },
  // Writeups: mirror of resume
  writeups: { pos: new THREE.Vector3(-1.6, 3.6, -1.0),  look: new THREE.Vector3(-4.4, 1.6, 3.2) },
  // Contact: pull back for wide view
  contact:   { pos: new THREE.Vector3(0, 4.2, 10.8),    look: new THREE.Vector3(0, 1.8, 1.0) },
  // Workstation monitors face +Z; camera sits at larger Z looking toward them
  linkedin:  { pos: new THREE.Vector3(-1.85, 1.6, 7.2), look: new THREE.Vector3(-1.85, 0.4, 4.18) },
  github:    { pos: new THREE.Vector3(0, 1.6, 7.2),     look: new THREE.Vector3(0, 0.4, 4.18) },
  tryhackme: { pos: new THREE.Vector3(1.85, 1.6, 7.2),  look: new THREE.Vector3(1.85, 0.4, 4.18) }
}

/* ─── HUD data per section ────────────────────────────────────────── */
const HUD_TITLES = {
  core: 'Command Layer', about: 'Profile', skills: 'Capability Map',
  ir: 'Incident Response Program', cloud: 'AWS Cloud Security Uplift',
  resume: 'Resume Snapshot', writeups: 'Cyber Writeups', contact: 'Contact',
  linkedin: 'LinkedIn', github: 'GitHub', tryhackme: 'TryHackMe'
}
const HUD_BODIES = {
  core:     'Markus Walker, Brisbane-based Security, AI and Cloud Engineer. Select a monitor or dock zone to inspect evidence across cloud security, incident response, security operations, offensive lab work, web security, and AI security.',
  about:    'Profile summary and positioning. Infrastructure and field engineering grounding with evidence-backed cyber, cloud and AI security work.',
  skills:   'Practical capability map across security operations, offensive security, cloud security, AI security, identity, endpoint, network and automation.',
  ir:       'Enterprise Incident Response Program design portfolio aligned to NIST SP 800-61 and MITRE ATT&CK.',
  cloud:    "Rossco's Coffee AWS security uplift case study. Architecture treated as a security control, with blast radius and resilience designed deliberately.",
  resume:   'Recruiter-friendly snapshot. Seven plus years of infrastructure and field engineering, now focused on security, cloud and AI.',
  writeups: 'Hands-on offensive security labs and applied analysis. Red Team Capstone Crawl-Through is published.',
  contact:   'Email, LinkedIn, location and portfolio document downloads. Open to security, cloud and AI security roles.',
  linkedin:  'Professional profile. Open to security, cloud and AI security roles across Brisbane, remote Australia and selected national opportunities.',
  github:    'Published writeups, portfolio projects and tooling notes. Home of the Red Team Capstone Crawl-Through.',
  tryhackme: 'Active offensive security practice through structured labs under the handle Triage. Red team, Active Directory and web application focus.'
}
const HUD_BADGES  = { core:'PROFILE', about:'PROFILE', skills:'CAPABILITY', ir:'PORTFOLIO', cloud:'CASE STUDY', resume:'PDF', writeups:'PUBLIC', contact:'CONTACT', linkedin:'LINKEDIN', github:'GITHUB', tryhackme:'THM' }
const HUD_BADGE_K = { ir: 'warn' }
const HUD_STATS   = {
  core:     [['Sections','7'],['Certified','True'],['Region','QLD AU']],
  about:    [['Role','Sec · AI · Cloud'],['Region','BNE AU'],['Certs','4']],
  skills:   [['Domains','8'],['Certs','4'],['Status','Current']],
  ir:       [['Pages','28'],['Frameworks','2'],['Status','Portfolio']],
  cloud:    [['Pages','36'],['Controls','12+'],['Strategy','B/G']],
  resume:   [['Years','7+'],['Sites','20+'],['Certs','4']],
  writeups: [['Published','1'],['Pipeline','2'],['Focus','AD/AI']],
  contact:   [['Email','Open'],['LinkedIn','Active'],['Status','Open']],
  linkedin:  [['Handle','markus-walker-au'],['Status','Active'],['Open','To Roles']],
  github:    [['Handle','markus-doc'],['Published','1'],['Status','Active']],
  tryhackme: [['Handle','Triage'],['Focus','Red Team'],['Status','Active']]
}

/* Story panel zone mapping */
const STORY_ZONE = { core:'core', about:'core', skills:'core', ir:'ir', cloud:'cloud', resume:'ai', writeups:'writeups', contact:'core', linkedin:'core', github:'writeups', tryhackme:'writeups' }
/* Section → object key mapping for highlighting */
const SECTION_OBJ_KEY = { about:'core', skills:'core', ir:'ir', cloud:'cloud', resume:'ai', writeups:'writeups', contact:'core', linkedin:'core', github:'core', tryhackme:'core' }

/* ─── Update HUD ─────────────────────────────────────────────────── */
function updateHUD(key) {
  hudTitle.textContent = HUD_TITLES[key] || HUD_TITLES.core
  hudBody.textContent  = HUD_BODIES[key] || HUD_BODIES.core
  hudBadge.textContent = HUD_BADGES[key] || 'ACTIVE'
  hudBadge.className   = 'hud-badge ' + (HUD_BADGE_K[key] || '')
  const stats = HUD_STATS[key] || HUD_STATS.core
  hudStatsEl.innerHTML = stats.map(([l, v]) =>
    `<li><span>${l}</span><strong>${v}</strong></li>`).join('')
}

/* ─── Monitor highlights ──────────────────────────────────────────── */
function setMonitorHighlight(sectionKey) {
  const targetKey = SECTION_OBJ_KEY[sectionKey] || 'core'
  for (const obj of interactive) {
    const g = obj.userData?.group
    if (!g) continue
    const k = g.userData?.key
    if (k === undefined) continue
    const match = k === targetKey
    if (g.userData.halo) g.userData.halo.material.opacity = match ? 0.42 : 0.04
    if (g.userData.trimFront) g.userData.trimFront.opacity = match ? 0.90 : 0.22
  }
}
function resetMonitorHighlights() {
  for (const obj of interactive) {
    const g = obj.userData?.group
    if (!g) continue
    if (g.userData.halo) g.userData.halo.material.opacity = 0.10
    if (g.userData.trimFront) g.userData.trimFront.opacity = 0.45
  }
}

/* ─── Story panel ─────────────────────────────────────────────────── */
function setStoryPanel(key) {
  const zone = STORY_ZONE[key] || key
  storyPanels.forEach(p => p.classList.toggle('is-active', p.dataset.zone === zone))
}

/* ─── Camera movement ─────────────────────────────────────────────── */
function moveCameraTo(key) {
  const z = FOCUS_ZONES[key] || FOCUS_ZONES.core
  desiredCam.copy(z.pos); desiredTgt.copy(z.look)
}

/* ─── Section content builders ───────────────────────────────────── */
const SECTION_CONTENT = {

  about: () => `
    <div class="sfp-header">
      <p class="sfp-eyebrow">01 / ABOUT</p>
      <h2 class="sfp-title">Security, AI and Cloud Engineer.</h2>
    </div>
    <p class="sfp-lede">Brisbane-based Security, AI and Cloud Engineer with 7+ years of infrastructure and field engineering across Australia's mining and energy sectors.</p>
    <div class="sfp-about-grid">
      <div class="sfp-col">
        <p style="margin:0 0 14px;color:var(--ink-soft);font-size:0.92rem;line-height:1.65">Most recently embedded as a Tata Consultancy Services Dedicated Service Engineer supporting Shell QGC and QCLNG upstream and midstream operations across remote Queensland energy and gas environments. Hands-on across network, endpoint, connectivity and field operations at twenty plus FIFO remote sites.</p>
        <p style="margin:0 0 14px;color:var(--ink-soft);font-size:0.92rem;line-height:1.65">Current focus is evidence-backed across security operations, offensive security labs, cloud architecture, incident response planning, web application testing and AI security research. Portfolio, not just a keyword list.</p>
        <h3 class="sfp-h3">Positioning</h3>
        <ul class="sfp-bullets">
          <li>Security, AI and Cloud Engineer with deep infrastructure and field engineering grounding</li>
          <li>Cloud security across AWS and Oracle Cloud Infrastructure, with applied case study evidence</li>
          <li>Active offensive security practice through home lab and TryHackMe under the handle Triage</li>
          <li>AI security aligned to OWASP LLM Top 10 and MITRE ATLAS, with structured study and applied notes</li>
          <li>Strong written communication for stakeholders, auditors and technical teams</li>
        </ul>
      </div>
      <div class="sfp-chips-col">
        <div class="sfp-chip-grid">
          <span class="sfp-chip">7+ years</span>
          <span class="sfp-chip">Brisbane AU</span>
          <span class="sfp-chip">AWS SAA</span>
          <span class="sfp-chip">3× OCI</span>
          <span class="sfp-chip">AISA MAISA</span>
          <span class="sfp-chip">AI Security</span>
          <span class="sfp-chip">NIST / MITRE</span>
          <span class="sfp-chip">Essential Eight</span>
        </div>
      </div>
    </div>
    <div class="sfp-actions">
      <button class="btn btn-primary" type="button" data-focus="resume">View resume</button>
      <button class="btn btn-secondary" type="button" data-focus="contact">Get in touch</button>
    </div>`,

  skills: () => `
    <div class="sfp-header">
      <p class="sfp-eyebrow">02 / SKILLS</p>
      <h2 class="sfp-title">Capability map, by domain.</h2>
    </div>
    <p class="sfp-lede">Practical capability across security operations, offensive security, cloud, AI security, identity, endpoint, network and automation.</p>
    <div class="sfp-skill-grid">
      <div class="sfp-skill-card">
        <p class="sfp-skill-head">Security Operations and Detection</p>
        <p class="sfp-skill-body">Splunk Enterprise, SIEM operations, log analysis and ingestion, Windows host and network monitoring, alert triage, anomaly detection, incident response lifecycle, evidence preservation, chain of custody, SOC, CSIRT and SOAR concepts.</p>
      </div>
      <div class="sfp-skill-card">
        <p class="sfp-skill-head">Offensive Security and Red Team</p>
        <p class="sfp-skill-body">Kali Linux, Metasploit, Meterpreter, msfvenom, Impacket, Rubeus, mimikatz, evil-winrm, chisel, hashcat, Nmap, Rustscan, Wireshark, Burp Suite, Nikto, ffuf. Active Directory tradecraft including Kerberoast, Golden Ticket and DCSync.</p>
      </div>
      <div class="sfp-skill-card">
        <p class="sfp-skill-head">Cloud and Cloud Security</p>
        <p class="sfp-skill-body">AWS VPC, EC2, RDS Multi-AZ, ALB, Auto Scaling, Route 53, WAF, Shield, CloudTrail, GuardDuty, Security Hub, Inspector, Macie, Config, IAM Identity Center, Cognito, Secrets Manager, KMS, Systems Manager. OCI, Azure, Microsoft 365, Intune, Entra ID.</p>
      </div>
      <div class="sfp-skill-card">
        <p class="sfp-skill-head">AI Security and Governance</p>
        <p class="sfp-skill-body">Prompt injection and defence, jailbreaking, LLM security, AI threat modelling, AI supply chain security, RAG security, data poisoning, sensitive information disclosure, AI forensics, secure AI system design.</p>
      </div>
      <div class="sfp-skill-card">
        <p class="sfp-skill-head">Identity, Endpoint and Network</p>
        <p class="sfp-skill-body">IAM, RBAC, MFA, conditional access, Active Directory security, vulnerability management, NGFW, IDS and IPS, EDR and XDR concepts, segmentation and VLAN design, PKI, TLS, VPN, Cisco, Aruba, Cel-Fi, Starlink, Motorola TETRA.</p>
      </div>
      <div class="sfp-skill-card">
        <p class="sfp-skill-head">Frameworks and Standards</p>
        <p class="sfp-skill-body">NIST CSF, NIST SP 800-61, MITRE ATT&amp;CK, MITRE ATLAS, Essential Eight, CIS Controls, OWASP Top 10, OWASP LLM Top 10, ISO 27001, PCI DSS, ISM, PSPF, Privacy Act 1988, APPs, Notifiable Data Breaches, GDPR, CDR, SOCI Act 2018.</p>
      </div>
      <div class="sfp-skill-card">
        <p class="sfp-skill-head">Scripting and Automation</p>
        <p class="sfp-skill-body">Python, PowerShell, shell scripting, defensive coding, CSV processing, cross-platform Windows and Linux automation, system audit tooling, ServiceNow, Maximo, Power BI, technical documentation in Obsidian.</p>
      </div>
      <div class="sfp-skill-card">
        <p class="sfp-skill-head">Certifications</p>
        <p class="sfp-skill-body">AWS Solutions Architect Associate. OCI 2025 Architect Associate. OCI 2025 Foundations Associate. OCI 2025 Generative AI Professional. Certificate IV in Cyber Security. ISC2 CC and CompTIA Security Plus scheduled.</p>
      </div>
    </div>`,

  ir: () => `
    <div class="sfp-header">
      <p class="sfp-eyebrow">03 / INCIDENT RESPONSE</p>
      <h2 class="sfp-title">Enterprise IRP design, sanitised.</h2>
    </div>
    <p class="sfp-lede">Enterprise Incident Response Program design portfolio piece, structured around NIST SP 800-61 and sanitised from a planning engagement.</p>
    <div class="sfp-meta">
      <span><strong>Document</strong> 28 page IRP portfolio</span>
      <span><strong>Framework</strong> NIST SP 800-61, MITRE ATT&amp;CK</span>
      <span><strong>Mode</strong> Governance, operations and response planning</span>
    </div>
    <h3 class="sfp-h3">What it covers</h3>
    <ul class="sfp-bullets">
      <li>Project Charter with scope, objectives, methodology, milestones, deliverables and budget</li>
      <li>Project Team Briefing covering composition, roles, responsibilities and red, blue and purple team activities</li>
      <li>Communications Plan covering stakeholder cadence, channels and escalation</li>
      <li>Incident Response Plan covering detect, analyse, contain, eradicate, recover and learn</li>
      <li>Performance metrics, post-incident review structure and documentation handoff</li>
    </ul>
    <h3 class="sfp-h3">What it proves</h3>
    <ul class="sfp-bullets">
      <li>Cybersecurity planning and IRP development at program level</li>
      <li>Ability to turn frameworks into usable operating procedures</li>
      <li>Stakeholder communication clear enough for executives, auditors and technical staff</li>
      <li>Calm structure under pressure, written down before the incident</li>
    </ul>
    <div class="sfp-actions">
      <a class="btn btn-primary" href="./assets/docs/Markus_Walker_IRP_Portfolio.pdf" target="_blank" rel="noopener noreferrer" download>
        Download IRP PDF
        <svg viewBox="0 0 24 24" aria-hidden="true" style="width:16px;height:16px"><path d="M12 4v12m0 0 5-5m-5 5-5-5M4 20h16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
      </a>
      <a class="btn btn-secondary" href="./assets/docs/Markus_Walker_IRP_Portfolio.pdf" target="_blank" rel="noopener noreferrer">Open in new tab</a>
    </div>`,

  cloud: () => `
    <div class="sfp-header">
      <p class="sfp-eyebrow">04 / CLOUD SECURITY</p>
      <h2 class="sfp-title">AWS uplift case study, blast radius respected.</h2>
    </div>
    <p class="sfp-lede">AWS cloud security upgrade and migration plan for the Rossco's Coffee fictional case study. Architecture treated as a security control, with blast radius and resilience designed deliberately.</p>
    <div class="sfp-meta">
      <span><strong>Document</strong> 36 page case study</span>
      <span><strong>Provider</strong> AWS, multi-AZ resilience</span>
      <span><strong>Strategy</strong> Blue / green deployment</span>
    </div>
    <h3 class="sfp-h3">Security controls covered</h3>
    <div class="sfp-ctrl-grid">
      <span class="sfp-ctrl-chip">CASB</span><span class="sfp-ctrl-chip">WAF</span>
      <span class="sfp-ctrl-chip">ADC</span><span class="sfp-ctrl-chip">DLP</span>
      <span class="sfp-ctrl-chip">NAC</span><span class="sfp-ctrl-chip">DNSSEC</span>
      <span class="sfp-ctrl-chip">DDoS protection</span><span class="sfp-ctrl-chip">KMS</span>
      <span class="sfp-ctrl-chip">Data classification</span><span class="sfp-ctrl-chip">Network segmentation</span>
      <span class="sfp-ctrl-chip">IAM and RBAC</span><span class="sfp-ctrl-chip">Logging and SIEM</span>
    </div>
    <h3 class="sfp-h3">Plan structure</h3>
    <ul class="sfp-bullets">
      <li>Cloud environment upgrade plan with services, access control and security controls</li>
      <li>Testing and migration plan covering vulnerability, penetration, performance, usability and DR</li>
      <li>Blue and green deployment strategy with migration comparison and decision</li>
      <li>Monitoring and maintenance plan, log scrubbing strategy and lifecycle management</li>
      <li>Cloud incident response plan with predictable incidents and disaster recovery solutions</li>
    </ul>
    <div class="sfp-actions">
      <a class="btn btn-primary" href="./assets/docs/Markus_Walker_Cloud_Case_Study.pdf" target="_blank" rel="noopener noreferrer" download>
        Download Cloud Case Study PDF
        <svg viewBox="0 0 24 24" aria-hidden="true" style="width:16px;height:16px"><path d="M12 4v12m0 0 5-5m-5 5-5-5M4 20h16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
      </a>
      <a class="btn btn-secondary" href="./assets/docs/Markus_Walker_Cloud_Case_Study.pdf" target="_blank" rel="noopener noreferrer">Open in new tab</a>
    </div>`,

  resume: () => `
    <div class="sfp-header">
      <p class="sfp-eyebrow">05 / RESUME</p>
      <h2 class="sfp-title">Recruiter-friendly summary.</h2>
    </div>
    <p class="sfp-lede">Seven plus years of infrastructure and field engineering across Australia's mining and energy sectors, now focused on security, cloud and AI.</p>
    <div class="sfp-meta">
      <span><strong>Name</strong> Markus Walker</span>
      <span><strong>Location</strong> Brisbane, Queensland</span>
      <span><strong>Email</strong> markus@markuswalker.com</span>
    </div>
    <h3 class="sfp-h3">Experience</h3>
    <div class="sfp-role">
      <p class="sfp-role-head">Independent Cyber Security Practitioner &mdash; Aug 2025 to Present</p>
      <p class="sfp-role-body">Dedicated upskilling and portfolio period focused on cyber security, cloud security, offensive security and AI security. Completed Certificate IV in Cyber Security and four cloud certifications. Built active offensive security practice through home lab and TryHackMe. Published the Red Team Capstone Crawl-Through writeup. ISC2 CC and CompTIA Security Plus exams scheduled.</p>
    </div>
    <div class="sfp-role">
      <p class="sfp-role-head">IT Field Engineer, Tata Consultancy Services &mdash; May 2019 to Aug 2025</p>
      <p class="sfp-role-body">Embedded contractor supporting Shell QGC and QCLNG upstream and midstream operations across remote Queensland energy and gas infrastructure. Field engineering across twenty plus remote sites under a FIFO model. Network transformation including over three hundred Cisco to Aruba access point replacements. Connectivity uplift across over six hundred field vehicles using Cisco IR829 and Cel-Fi, extended with Starlink. Endpoint lifecycle across six annual refresh cycles. Entra ID identity and access management across a dispersed workforce.</p>
    </div>
    <h3 class="sfp-h3">Certifications</h3>
    <ul class="sfp-bullets">
      <li>AWS Certified Solutions Architect Associate</li>
      <li>Oracle Cloud Infrastructure 2025 Architect Associate</li>
      <li>Oracle Cloud Infrastructure 2025 Foundations Associate</li>
      <li>Oracle Cloud Infrastructure 2025 Generative AI Professional</li>
      <li>Certificate IV in Cyber Security</li>
      <li>ISC2 Certified in Cybersecurity and CompTIA Security Plus scheduled</li>
    </ul>
    <div class="sfp-actions">
      <a class="btn btn-primary" href="./assets/docs/Markus_Walker_Resume.pdf" target="_blank" rel="noopener noreferrer" download>
        Download Resume PDF
        <svg viewBox="0 0 24 24" aria-hidden="true" style="width:16px;height:16px"><path d="M12 4v12m0 0 5-5m-5 5-5-5M4 20h16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
      </a>
      <a class="btn btn-secondary" href="https://www.linkedin.com/in/markus-walker-au/" target="_blank" rel="noopener noreferrer">View on LinkedIn ↗</a>
    </div>`,

  writeups: () => `
    <div class="sfp-header">
      <p class="sfp-eyebrow">06 / WRITEUPS</p>
      <h2 class="sfp-title">Hands on, written down.</h2>
    </div>
    <p class="sfp-lede">Active practice through home lab and TryHackMe under the handle Triage. Evidence of structured, methodical offensive security work.</p>
    <div class="sfp-writeup-list">
      <a class="sfp-writeup-card" href="https://markus-doc.github.io/cybersecurity-writeups/articles/tryhackme/rtcc/1-Red_Team_Capstone_Crawl-Through" target="_blank" rel="noopener noreferrer">
        <p class="sfp-wt-tag">TRYHACKME · ACTIVE DIRECTORY · PUBLISHED</p>
        <h3 class="sfp-wt-title">Red Team Capstone Crawl-Through</h3>
        <p class="sfp-wt-body">Full Active Directory red team capstone walkthrough. Kerberos abuse, credential harvesting, tunnelling, pivoting and GPU-accelerated cracking. Published to GitHub Pages portfolio site.</p>
        <p class="sfp-wt-cta">Open full writeup ↗</p>
      </a>
      <div class="sfp-writeup-card placeholder">
        <p class="sfp-wt-tag">PIPELINE · IN PREPARATION</p>
        <h3 class="sfp-wt-title">Active Directory Tradecraft Series</h3>
        <p class="sfp-wt-body">Kerberoast, AS-REP roasting, Golden Ticket, Silver Ticket and DCSync covered through structured lab notes. Locally hosted versions will be added as markdown plus images.</p>
        <p class="sfp-wt-cta">Coming soon</p>
      </div>
      <div class="sfp-writeup-card placeholder">
        <p class="sfp-wt-tag">PIPELINE · IN PREPARATION</p>
        <h3 class="sfp-wt-title">AI Security Notes — OWASP LLM Top 10 and MITRE ATLAS</h3>
        <p class="sfp-wt-body">Applied notes on prompt injection, jailbreaking, RAG security, data poisoning, sensitive information disclosure and AI threat modelling. Mapped to OWASP LLM Top 10 and MITRE ATLAS.</p>
        <p class="sfp-wt-cta">Coming soon</p>
      </div>
    </div>
    <p class="sfp-muted">This site and its contents are growing continuously. Check back for new writeups, lab walkthroughs and tooling notes.</p>`,

  contact: () => `
    <div class="sfp-header">
      <p class="sfp-eyebrow">07 / CONTACT</p>
      <h2 class="sfp-title">Open the channel.</h2>
    </div>
    <p class="sfp-lede">Open to cybersecurity, cloud security and AI security roles across Brisbane, remote Australia and selected national opportunities.</p>
    <div class="sfp-contact-grid">
      <a class="sfp-contact-card" href="mailto:markus@markuswalker.com">
        <p class="sfp-cc-label">EMAIL</p>
        <p class="sfp-cc-val">markus@markuswalker.com</p>
        <p class="sfp-cc-cta">Open mail client ↗</p>
      </a>
      <a class="sfp-contact-card" href="https://www.linkedin.com/in/markus-walker-au/" target="_blank" rel="noopener noreferrer">
        <p class="sfp-cc-label">LINKEDIN</p>
        <p class="sfp-cc-val">markus-walker-au</p>
        <p class="sfp-cc-cta">Open profile ↗</p>
      </a>
      <div class="sfp-contact-card" style="cursor:default">
        <p class="sfp-cc-label">LOCATION</p>
        <p class="sfp-cc-val">Brisbane, Queensland</p>
        <p class="sfp-cc-cta">Australia</p>
      </div>
      <div class="sfp-contact-card" style="cursor:default">
        <p class="sfp-cc-label">AVAILABILITY</p>
        <p class="sfp-cc-val">Open to roles</p>
        <p class="sfp-cc-cta">Brisbane &amp; remote</p>
      </div>
    </div>
    <h3 class="sfp-h3">Document downloads</h3>
    <div class="sfp-dl-grid">
      <a class="sfp-dl-card" href="./assets/docs/Markus_Walker_Resume.pdf" target="_blank" rel="noopener noreferrer" download>
        <span class="sfp-dl-label">RESUME</span>
        <span class="sfp-dl-name">Markus_Walker_Resume.pdf</span>
        <span class="sfp-dl-icon">↓</span>
      </a>
      <a class="sfp-dl-card" href="./assets/docs/Markus_Walker_IRP_Portfolio.pdf" target="_blank" rel="noopener noreferrer" download>
        <span class="sfp-dl-label">IR PROGRAM</span>
        <span class="sfp-dl-name">Markus_Walker_IRP_Portfolio.pdf</span>
        <span class="sfp-dl-icon">↓</span>
      </a>
      <a class="sfp-dl-card" href="./assets/docs/Markus_Walker_Cloud_Case_Study.pdf" target="_blank" rel="noopener noreferrer" download>
        <span class="sfp-dl-label">CLOUD CASE STUDY</span>
        <span class="sfp-dl-name">Markus_Walker_Cloud_Case_Study.pdf</span>
        <span class="sfp-dl-icon">↓</span>
      </a>
    </div>`,

  linkedin: () => `
    <div class="sfp-header">
      <p class="sfp-eyebrow">PLATFORM / LINKEDIN</p>
      <h2 class="sfp-title">Connect on LinkedIn.</h2>
    </div>
    <p class="sfp-lede">Open to cybersecurity, cloud security and AI security roles across Brisbane, remote Australia and selected national opportunities.</p>
    <div class="sfp-meta">
      <span><strong>Handle</strong> markus-walker-au</span>
      <span><strong>Status</strong> Active · Open to roles</span>
      <span><strong>Location</strong> Brisbane, QLD AU</span>
    </div>
    <div class="sfp-actions">
      <a class="btn btn-primary" href="https://www.linkedin.com/in/markus-walker-au/" target="_blank" rel="noopener noreferrer">Open LinkedIn ↗</a>
      <button class="btn btn-secondary" type="button" data-focus="contact">Get in touch</button>
    </div>`,

  github: () => `
    <div class="sfp-header">
      <p class="sfp-eyebrow">PLATFORM / GITHUB</p>
      <h2 class="sfp-title">Repositories and writeups.</h2>
    </div>
    <p class="sfp-lede">Published security writeups, portfolio projects and tooling notes. Home of the Red Team Capstone Crawl-Through.</p>
    <div class="sfp-meta">
      <span><strong>Handle</strong> markus-doc</span>
      <span><strong>Focus</strong> Writeups · Portfolio · Tooling</span>
      <span><strong>Status</strong> Active</span>
    </div>
    <div class="sfp-actions">
      <a class="btn btn-primary" href="https://github.com/markus-doc" target="_blank" rel="noopener noreferrer">Open GitHub ↗</a>
      <button class="btn btn-secondary" type="button" data-focus="writeups">View writeups</button>
    </div>`,

  tryhackme: () => `
    <div class="sfp-header">
      <p class="sfp-eyebrow">PLATFORM / TRYHACKME</p>
      <h2 class="sfp-title">Active offensive security practice.</h2>
    </div>
    <p class="sfp-lede">Red team labs, Active Directory tradecraft and web application testing. Structured, methodical offensive security work under the handle Triage.</p>
    <div class="sfp-meta">
      <span><strong>Handle</strong> Triage</span>
      <span><strong>Focus</strong> Red Team · Active Directory · Web</span>
      <span><strong>Status</strong> Active</span>
    </div>
    <div class="sfp-actions">
      <a class="btn btn-primary" href="https://tryhackme.com/p/Triage" target="_blank" rel="noopener noreferrer">Open TryHackMe ↗</a>
      <button class="btn btn-secondary" type="button" data-focus="writeups">View writeups</button>
    </div>`
}

/* ─── Render screen content ───────────────────────────────────────── */
function renderScreenContent(key) {
  const builder = SECTION_CONTENT[key]
  if (!builder) return
  screenPanel.innerHTML = builder()
  screenPanel.className = `screen-focus-panel screen-focus-panel--${key}`
  // Delegate internal navigation buttons
  screenPanel.querySelectorAll('[data-focus]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); focusSection(btn.dataset.focus) })
  })
}

/* ─── Focus / unfocus ─────────────────────────────────────────────── */
window.focusSection = function focusSection(key) {
  if (state.isTransitioning) return
  if (key === 'core') { returnToCommandCentre(); return }
  if (!SECTION_CONTENT[key]) return

  state.activeSection = key
  state.focused = true
  state.isTransitioning = true

  if (!state.heroDismissed) {
    state.heroDismissed = true
    document.body.classList.add('hero-dismissed')
  }

  document.body.classList.add('is-focused')
  document.body.dataset.section = key

  dockItems.forEach(d => {
    d.classList.toggle('active', d.dataset.target === key)
    d.setAttribute('aria-current', d.dataset.target === key ? 'true' : 'false')
  })
  updateHUD(key)
  setStoryPanel(key)
  setMonitorHighlight(key)
  moveCameraTo(key)

  // Show layer immediately, content after camera settles
  screenLayer.hidden = false
  screenPanel.innerHTML = ''
  screenPanel.className = `screen-focus-panel screen-focus-panel--${key}`

  setTimeout(() => {
    renderScreenContent(key)
    // Trigger transition on next frame
    requestAnimationFrame(() => {
      screenPanel.classList.add('is-visible')
      setTimeout(() => screenPanel.classList.add('is-visible'), 32)
    })
    state.isTransitioning = false
  }, 680)
}

function returnToCommandCentre() {
  if (state.isTransitioning && state.focused) return
  state.focused = false
  state.activeSection = 'core'
  state.isTransitioning = true

  document.body.classList.remove('is-focused')
  document.body.dataset.section = 'core'

  screenPanel.classList.remove('is-visible')
  setTimeout(() => {
    screenLayer.hidden = true
    screenPanel.innerHTML = ''
    state.isTransitioning = false
  }, 360)

  resetMonitorHighlights()
  moveCameraTo('core')
  updateHUD('core')
  setStoryPanel('core')
  dockItems.forEach(d => { d.classList.remove('active'); d.setAttribute('aria-current', 'false') })
  dockItems[0]?.classList.add('active')
}

backBtn.addEventListener('click', returnToCommandCentre)

/* ─── Hover + click interaction ──────────────────────────────────── */
const pointer = new THREE.Vector2(), raycaster = new THREE.Raycaster()
let hovered = null, isDragging = false, lastX = 0, lastY = 0
let parX = 0, parY = 0, tparX = 0, tparY = 0

function setHover(hit) {
  if (hovered === hit) return
  if (hovered?.userData?.group && !state.focused) {
    const g = hovered.userData.group
    g.scale.setScalar(1)
    if (g.userData.halo) g.userData.halo.material.opacity = 0.10
    if (g.userData.trim) g.userData.trim.material.opacity = 0.45
  }
  hovered = hit
  if (hovered?.userData?.group) {
    const g = hovered.userData.group
    g.scale.setScalar(1.04)
    if (g.userData.halo) g.userData.halo.material.opacity = state.focused ? 0.55 : 0.32
    if (g.userData.trim) g.userData.trim.material.opacity = state.focused ? 0.95 : 0.85
    document.body.style.cursor = 'pointer'
    if (!state.focused) {
      hudTitle.textContent = hovered.userData.title || HUD_TITLES.core
      hudBody.textContent  = (hovered.userData.desc || '') + ' Click to open.'
      if (hovered.userData.badge) {
        hudBadge.textContent = hovered.userData.badge
        hudBadge.className   = 'hud-badge ' + (hovered.userData.badgeClass || '')
      }
    }
  } else {
    document.body.style.cursor = 'default'
    if (!state.focused) updateHUD(state.activeSection)
  }
}

canvas.addEventListener('pointermove', (e) => {
  const r = canvas.getBoundingClientRect()
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1
  if (isDragging) {
    tparY += (e.clientX - lastX) * 0.0028
    tparX += (e.clientY - lastY) * 0.0014
    tparX = THREE.MathUtils.clamp(tparX, -0.22, 0.22)
    lastX = e.clientX; lastY = e.clientY
  } else {
    tparY = ((e.clientX / window.innerWidth) - 0.5) * 0.18
    tparX = ((e.clientY / window.innerHeight) - 0.5) * 0.10
  }
  if (!state.isTransitioning) {
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(interactive, false)
    setHover(hits.length ? hits[0].object : null)
  }
}, { passive: true })

canvas.addEventListener('pointerdown', (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY })
window.addEventListener('pointerup', () => { isDragging = false })

canvas.addEventListener('click', () => {
  if (state.isTransitioning) return
  if (hovered?.userData?.key) {
    const keyMap = { core: 'about', ai: 'resume' }
    const key = keyMap[hovered.userData.key] || hovered.userData.key
    window.focusSection(key)
  }
})

/* ─── Scroll (browse mode only) ──────────────────────────────────── */
window.addEventListener('scroll', () => {
  if (state.focused) return
  const max = document.body.scrollHeight - window.innerHeight
  const progress = max > 0 ? window.scrollY / max : 0
  const order = ['core', 'ir', 'cloud', 'ai', 'writeups', 'core']
  const seg = progress * (order.length - 1)
  const i = Math.floor(seg), f = seg - i
  const a = SCROLL_ZONES[order[i]], b = SCROLL_ZONES[order[Math.min(i + 1, order.length - 1)]]
  desiredCam.lerpVectors(a.pos, b.pos, f)
  desiredTgt.lerpVectors(a.look, b.look, f)
  const dom = order[Math.round(seg)]
  const smap = { core:'core', ir:'ir', cloud:'cloud', ai:'resume', writeups:'writeups' }
  const activeKey = smap[dom] || 'core'
  if (activeKey !== state.activeSection) {
    state.activeSection = activeKey
    dockItems.forEach(it => it.classList.toggle('active', it.dataset.target === activeKey))
    setStoryPanel(dom)
    updateHUD(activeKey)
  }
}, { passive: true })

/* ─── Dock clicks ─────────────────────────────────────────────────── */
dockItems.forEach(item => item.addEventListener('click', () => {
  const target = item.dataset.target
  if (target) window.focusSection(target)
}))

/* ─── Keyboard: Escape to return ──────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.focused) returnToCommandCentre()
})

/* ─── Resize ──────────────────────────────────────────────────────── */
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  const nowMobile = window.innerWidth < 1024 && navigator.maxTouchPoints > 1
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, nowMobile ? 1.5 : 2))
})

/* ─── Tweaks ──────────────────────────────────────────────────────── */
const LENS_MODES = { diorama: { fov: 28 }, cinematic: { fov: 40 }, immersive: { fov: 62 } }

window.applyEnergy = function (v) {
  if (!sceneL.key) return
  const t = THEMES[activeTheme]; if (!t) return
  const e = 0.18 + (v / 100) * 1.64
  if (sceneL.key)   sceneL.key.intensity   = t.lights.key.intensity   * e
  if (sceneL.fill)  sceneL.fill.intensity  = t.lights.fill.intensity  * e
  if (sceneL.rose)  sceneL.rose.intensity  = t.lights.rose.intensity  * e
  if (sceneL.under) sceneL.under.intensity = t.lights.under.intensity * e
  if (sceneL.sun)   sceneL.sun.intensity   = t.lights.sun.intensity   * e
  for (const [k, mv] of Object.entries(t.mat)) {
    if (M[k] && mv.emissiveIntensity !== undefined)
      M[k].emissiveIntensity = mv.emissiveIntensity * e
  }
}

window.applyLens = function (mode) {
  const l = LENS_MODES[mode] || LENS_MODES.cinematic
  camera.fov = l.fov
  camera.updateProjectionMatrix()
}

/* ─── Render loop ─────────────────────────────────────────────────── */
const clock = new THREE.Clock()
let last = 0, vt = 0

function animate() {
  const t = clock.getElapsedTime(), dt = t - last; last = t
  const speed = window.TWEAKS ? (0.05 + (window.TWEAKS.motionSpeed / 100) * 1.9) : 1.0
  vt += dt * speed
  parX = THREE.MathUtils.lerp(parX, tparX, 0.06)
  parY = THREE.MathUtils.lerp(parY, tparY, 0.06)
  const camTarget = desiredCam.clone()
  camTarget.x += parY * 0.6; camTarget.y += parX * 0.4
  camera.position.lerp(camTarget, 0.045)
  targetLook.lerp(desiredTgt, 0.08)
  camera.lookAt(targetLook)
  scene.traverse(o => { if (o.userData?.animate) o.userData.animate(vt) })
  if (networkBus) networkBus.update(Math.min(dt * speed, 0.05))
  for (const obj of interactive) {
    const g = obj.userData.group
    if (!g || g === hovered?.userData?.group) continue
    if (!g.userData._wob) g.userData._wob = Math.random() * Math.PI * 2
    if (!state.focused) g.scale.setScalar(1 + Math.sin(vt * 1.6 + g.userData._wob) * 0.005)
  }
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}

/* ─── Clock + latency ─────────────────────────────────────────────── */
function tickClock() {
  const d = new Date(), pad = n => String(n).padStart(2, '0')
  clockEl.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
  const latEl = document.getElementById('hudLatency')
  if (latEl) latEl.textContent = (10 + Math.round(Math.sin(d.getTime() * 0.001) * 4 + Math.random() * 3)) + 'ms'
}
setInterval(tickClock, 1000); tickClock()

/* ─── Theme delegation ────────────────────────────────────────────── */
document.documentElement.setAttribute('data-theme', activeTheme)
document.querySelectorAll('.swatch-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === activeTheme))
document.addEventListener('click', e => {
  const btn = e.target.closest('.swatch-btn')
  if (btn) applyTheme(btn.dataset.theme)
})

/* ─── Boot ────────────────────────────────────────────────────────── */
try {
  buildScene()
  updateHUD('core')
  animate()
  applyTheme(activeTheme)
  if (window.TWEAKS) {
    window.applyEnergy(window.TWEAKS.sceneEnergy)
    window.applyLens(window.TWEAKS.lensMode)
  }
  setTimeout(finishLoader, 1500)
} catch (err) { showError(err) }

window.addEventListener('error', (e) => showError(e.error || e))
window.addEventListener('unhandledrejection', (e) => showError(e.reason))
