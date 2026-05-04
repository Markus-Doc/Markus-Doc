/* ═══════════════════════════════════════════════════════════════════════════
   Markus Walker — Mobile Cyber Portfolio  •  main.js v14
   Three.js cyber-network scene + mobile-first UI
   ═══════════════════════════════════════════════════════════════════════════ */
import * as THREE from 'three'

/* ─── Loader steps ───────────────────────────────────────────────────────── */
const LOADER_STEPS = [
  'Establishing telemetry',
  'Loading threat intelligence',
  'Activating security controls',
  'Calibrating sensor array',
  'Connecting SIEM',
  'Systems online'
]

/* ─── Theme scene colours ────────────────────────────────────────────────── */
const SCENE_COLOURS = {
  dark: {
    fog:         0x02060f,
    fogDensity:  0.04,
    particles:   0x1a3060,
    nodes:       0x6ee7ff,
    edges:       0x6ee7ff,
    accent:      0x6ee7ff,
    accent2:     0xa78bfa,
    rings:       0x6ee7ff,
  },
  'azure-glass': {
    fog:         0xd8ebf8,
    fogDensity:  0.035,
    particles:   0x7ab4d8,
    nodes:       0x0078d4,
    edges:       0x0078d4,
    accent:      0x0078d4,
    accent2:     0x6d28d9,
    rings:       0x0078d4,
  }
}

/* ─── Quality detection ──────────────────────────────────────────────────── */
function detectTier() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return 'fallback'
  } catch (_) { return 'fallback' }

  const ua = navigator.userAgent
  const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua)
  if (!mobile) return 'high'

  const mem = navigator.deviceMemory
  const threads = navigator.hardwareConcurrency
  if (mem <= 2 || threads <= 2) return 'low'
  if (mem >= 6 || threads >= 8) return 'high'
  return 'medium'
}

const TIER_CONFIG = {
  high:   { dpr: 1.5,  fps: 60, particles: 180, nodes: 28 },
  medium: { dpr: 1.25, fps: 45, particles: 110, nodes: 18 },
  low:    { dpr: 1.0,  fps: 30, particles: 60,  nodes: 10 },
}

/* ─── Three.js state ─────────────────────────────────────────────────────── */
let renderer, scene, camera
let rootGroup, nodeGroup
let orbMesh, ring1, ring2
let particleMesh, edgeMesh
let animId
let lostCtx = false
let contextLossCount = 0

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const tier = detectTier()
const cfg  = TIER_CONFIG[tier] || TIER_CONFIG.medium

/* ─── Theme state ────────────────────────────────────────────────────────── */
let currentTheme = localStorage.getItem('mw-theme') || 'dark'

function applyTheme(name) {
  currentTheme = name
  document.documentElement.setAttribute('data-theme', name)
  localStorage.setItem('mw-theme', name)
  const mc = document.getElementById('metaThemeColor')
  if (mc) mc.content = name === 'azure-glass' ? '#d8ebf8' : '#02060f'
  if (scene) updateSceneColours(name)
}

function updateSceneColours(name) {
  const c = SCENE_COLOURS[name] || SCENE_COLOURS.dark
  if (scene.fog) {
    scene.fog.color.set(c.fog)
  }
  if (renderer) renderer.setClearColor(c.fog, 1)
  if (particleMesh) particleMesh.material.color.set(c.particles)
  if (nodeGroup) {
    nodeGroup.children.forEach(child => {
      if (child.isMesh) child.material.color.set(c.nodes)
    })
  }
  if (edgeMesh) edgeMesh.material.color.set(c.edges)
  if (orbMesh)  orbMesh.material.color.set(c.accent)
  if (ring1)    ring1.material.color.set(c.rings)
  if (ring2)    ring2.material.color.set(c.accent2)
}

/* ─── Scene init ─────────────────────────────────────────────────────────── */
function initScene() {
  const canvas = document.getElementById('scene')
  const w = window.innerWidth
  const h = window.innerHeight
  const c = SCENE_COLOURS[currentTheme] || SCENE_COLOURS.dark

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: false,
    powerPreference: 'low-power',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cfg.dpr))
  renderer.setSize(w, h)
  renderer.setClearColor(c.fog, 1)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.outputColorSpace = THREE.SRGBColorSpace

  // Context loss
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault()
    lostCtx = true
    cancelAnimationFrame(animId)
    if (contextLossCount < 1) {
      contextLossCount++
      setTimeout(() => location.reload(), 1200)
    }
  })
  canvas.addEventListener('webglcontextrestored', () => {
    lostCtx = false
    buildScene()
    startLoop()
  })

  buildScene()
}

function buildScene() {
  const c = SCENE_COLOURS[currentTheme] || SCENE_COLOURS.dark
  const aspect = window.innerWidth / window.innerHeight

  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(c.fog, c.fogDensity)

  camera = new THREE.PerspectiveCamera(52, aspect, 0.1, 120)
  camera.position.set(0, 0.8, 14)
  camera.lookAt(0, 0, 0)

  rootGroup = new THREE.Group()
  scene.add(rootGroup)

  buildParticles(c)
  buildNetwork(c)
  buildOrb(c)
  buildRings(c)
}

function buildParticles(c) {
  const count = prefersReducedMotion ? 0 : cfg.particles
  if (count === 0) return

  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 28
    pos[i * 3 + 1] = (Math.random() - 0.5) * 18
    pos[i * 3 + 2] = (Math.random() - 0.5) * 14
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new THREE.PointsMaterial({
    color: c.particles,
    size: 0.07,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  })
  particleMesh = new THREE.Points(geo, mat)
  scene.add(particleMesh)
}

function buildNetwork(c) {
  nodeGroup = new THREE.Group()
  rootGroup.add(nodeGroup)

  const nodeGeo = new THREE.SphereGeometry(0.11, 4, 4)
  const nodeMat = new THREE.MeshBasicMaterial({ color: c.nodes })
  const positions = []

  for (let i = 0; i < cfg.nodes; i++) {
    // Distribute nodes in a loose cloud biased toward the viewer
    const x = (Math.random() - 0.5) * 11
    const y = (Math.random() - 0.5) * 7
    const z = (Math.random() - 0.5) * 5
    const mesh = new THREE.Mesh(nodeGeo, nodeMat)
    mesh.position.set(x, y, z)
    nodeGroup.add(mesh)
    positions.push(new THREE.Vector3(x, y, z))
  }

  // Build edges between nearby nodes
  const edgeVerts = []
  const CONNECT = 3.8
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      if (positions[i].distanceTo(positions[j]) < CONNECT) {
        edgeVerts.push(
          positions[i].x, positions[i].y, positions[i].z,
          positions[j].x, positions[j].y, positions[j].z
        )
      }
    }
  }
  const edgeGeo = new THREE.BufferGeometry()
  edgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edgeVerts), 3))
  const edgeMat = new THREE.LineBasicMaterial({
    color: c.edges,
    transparent: true,
    opacity: 0.18,
  })
  edgeMesh = new THREE.LineSegments(edgeGeo, edgeMat)
  nodeGroup.add(edgeMesh)
}

function buildOrb(c) {
  const geo = new THREE.SphereGeometry(0.9, 8, 8)
  const mat = new THREE.MeshBasicMaterial({
    color: c.accent,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
  })
  orbMesh = new THREE.Mesh(geo, mat)
  rootGroup.add(orbMesh)
}

function buildRings(c) {
  const mat1 = new THREE.MeshBasicMaterial({
    color: c.rings,
    transparent: true,
    opacity: 0.30,
    side: THREE.DoubleSide,
  })
  ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.018, 4, 96), mat1)
  ring1.rotation.x = Math.PI * 0.5
  rootGroup.add(ring1)

  const mat2 = new THREE.MeshBasicMaterial({
    color: c.accent2,
    transparent: true,
    opacity: 0.20,
    side: THREE.DoubleSide,
  })
  ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.012, 4, 96), mat2)
  ring2.rotation.x = Math.PI * 0.32
  ring2.rotation.y = Math.PI * 0.18
  rootGroup.add(ring2)
}

/* ─── Animation loop ─────────────────────────────────────────────────────── */
const MS_PER_FRAME = 1000 / cfg.fps
let lastFrameTime = 0

function startLoop() {
  cancelAnimationFrame(animId)
  lastFrameTime = performance.now()
  animId = requestAnimationFrame(loop)
}

function loop(now) {
  animId = requestAnimationFrame(loop)
  if (lostCtx) return

  const elapsed = now - lastFrameTime
  if (elapsed < MS_PER_FRAME * 0.9) return
  lastFrameTime = now - (elapsed % MS_PER_FRAME)

  if (!prefersReducedMotion) {
    const t = now * 0.001

    // Slow root rotation
    if (rootGroup) rootGroup.rotation.y = t * 0.04

    // Orb spin
    if (orbMesh) {
      orbMesh.rotation.x = t * 0.28
      orbMesh.rotation.y = t * 0.20
    }

    // Ring counter-rotation
    if (ring1) ring1.rotation.z = t * 0.08
    if (ring2) ring2.rotation.z = -t * 0.055

    // Particle gentle drift (minimal — just a slow y-axis float)
    if (particleMesh) particleMesh.rotation.y = t * 0.008
  }

  renderer.render(scene, camera)
}

/* ─── Resize ─────────────────────────────────────────────────────────────── */
function onResize() {
  if (!renderer || !camera) return
  const w = window.innerWidth
  const h = window.innerHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

let resizeTimer
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(onResize, 100)
})

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(onResize, 100)
  })
}

/* ─── Loader animation ───────────────────────────────────────────────────── */
function runLoader() {
  return new Promise(resolve => {
    const bar  = document.getElementById('loaderBar')
    const step = document.getElementById('loaderStep')
    if (!bar || !step) { resolve(); return }

    let i = 0
    const total = LOADER_STEPS.length
    const STEP_MS = 180

    function tick() {
      if (i >= total) { resolve(); return }
      bar.style.width = ((i + 1) / total * 100) + '%'
      step.textContent = LOADER_STEPS[i]
      i++
      setTimeout(tick, STEP_MS)
    }
    tick()
  })
}

function hideLoader() {
  const loader = document.getElementById('loader')
  if (!loader) return
  loader.classList.add('loader--hidden')
  setTimeout(() => { loader.hidden = true }, 450)
}

function showApp() {
  const app = document.getElementById('app')
  if (app) app.hidden = false
}

/* ─── Clock ──────────────────────────────────────────────────────────────── */
function startClock() {
  const el = document.getElementById('clock')
  if (!el) return
  function tick() {
    const now = new Date()
    el.textContent = now.toLocaleTimeString('en-AU', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      timeZone: 'Australia/Brisbane'
    })
  }
  tick()
  setInterval(tick, 1000)
}

/* ─── Panel navigation ───────────────────────────────────────────────────── */
let activePanel = null

function openPanel(id) {
  // Close any current panel first (instant if same)
  if (activePanel && activePanel !== id) closePanel(false)

  const panel = document.getElementById('panel-' + id)
  if (!panel) return

  activePanel = id
  panel.classList.add('is-open')

  // Update dock active state
  document.querySelectorAll('.dock-item').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.open === id)
  })

  // Fade hero out
  const hero = document.getElementById('heroView')
  if (hero) hero.classList.add('is-hidden')
}

function closePanel(restoreHero = true) {
  if (!activePanel) return
  const panel = document.getElementById('panel-' + activePanel)
  if (panel) panel.classList.remove('is-open')

  document.querySelectorAll('.dock-item').forEach(b => b.classList.remove('is-active'))

  activePanel = null

  if (restoreHero) {
    const hero = document.getElementById('heroView')
    if (hero) hero.classList.remove('is-hidden')
  }
}

// Global focus helper (used by in-panel CTAs that navigate between sections)
window.focusSection = openPanel

/* ─── Event delegation ───────────────────────────────────────────────────── */
function wireUI() {
  // Dock + hero button clicks that open panels
  document.addEventListener('click', e => {
    const opener = e.target.closest('[data-open]')
    if (opener) { openPanel(opener.dataset.open); return }

    const closer = e.target.closest('[data-close]')
    if (closer) { closePanel(); return }
  })

  // Theme toggle
  document.getElementById('themeBtn')?.addEventListener('click', () => {
    const next = currentTheme === 'dark' ? 'azure-glass' : 'dark'
    applyTheme(next)
  })

  // Keyboard: Escape closes panel
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && activePanel) closePanel()
  })
}

/* ─── Boot sequence ──────────────────────────────────────────────────────── */
async function boot() {
  // Apply persisted theme immediately
  applyTheme(currentTheme)

  if (tier === 'fallback') {
    window.showStaticFallback && window.showStaticFallback('WebGL is not available on this device.')
    return
  }

  try {
    showApp()
    initScene()
    wireUI()
    startClock()

    // Run loader while scene warms up
    await runLoader()

    hideLoader()
    startLoop()
  } catch (err) {
    console.error('[portfolio] boot error', err)
    window.showStaticFallback && window.showStaticFallback(err)
  }
}

boot()
