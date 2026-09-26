# Inner sphere art

Derived art for the landing's inner notebook sphere: the painted wall the visitor
sees all round from inside the sphere. The node network is the focal layer and
everything here sits behind it.

Total size is about 2.9 MB (`atlas-4k.webp` 2.0 MB, `atlas-2k.webp` 0.8 MB,
`parchment.webp` about 0.1 MB).

## Masters are untouched

Every source below is read only and lives in the portfolio working folder
(`C:\Users\marku\OneDrive\Documents\0.1-GitHub\portfolio-website\.inbox\`).
`tools/sphere-art/atlas.mjs` opens them, resizes, masks and re-levels them with
headless Chromium canvas, and writes the files here. Nothing is written into
`.inbox`.

| Slot | Source | Used for |
| --- | --- | --- |
| `scene` | `sphere-refs/01-landing-scene.jpg` (1868x1049, the target scene) | the front of the sphere, projected from the landing camera |
| `wallA` | `working-folder/sphere-inner-walls-v1.png` (2497x1408) | the strip below the landing frame |
| `wallB` | `working-folder/sphere-inner-walls-v1-2.png` (2497x1408) | the ceiling strip above the landing frame |
| `px` `nx` `py` `ny` `pz` `nz` | `working-folder/Final/background-views/*.png` (1254 px) | right, left, up, down, back; `pz` is in the atlas but unused (the scene carries the front) |

What the build does to each source:

- Resizes to its slot (scene at native size, walls to 2200 wide, faces to 940).
- Flattens its own lighting: divides by a low-pass of itself (a two-pass box
  blur, radius one twelfth of the slot width, edges clamped) and re-levels to
  one paper tone (205,178,146). The atlas then carries ink and grain only; the
  shell shader owns the vignette and the light pool, so no source brings its
  own dark corners to a seam.
- `scene` only: alphas out the painted network (a feathered ellipse at the
  centre, radii 0.27 x 0.42 of the image), its vertical axis line, and the Grok
  mark in the bottom right corner (x 0.86 to 1, y 0.90 to 1). None of those
  can appear on the wall.
- Records each slot's rectangle and paper tone in `atlas.json`.

The Grok mark rule from the brief holds: no crop that includes it is ever used.

## Direction mapping

The face filename mapping stays authoritative for the rotated views:

| Face | Direction | Study |
| --- | --- | --- |
| `px` | right | human and robotic hands reaching |
| `nx` | left | hands using a drawing compass |
| `py` | up | celestial armillary |
| `ny` | down | mechanical collective-mind apparatus |
| `nz` | back | mechanical cognition head |
| front | the landing's view, down -Z | the target scene (its own Vitruvian upper left) |

## Files

| File | What it is |
| --- | --- |
| `atlas-4k.webp` | 4096 px RGBA atlas of all sources, quality 0.82 (desktop) |
| `atlas-2k.webp` | the same at 2048 px (low tier and phones) |
| `atlas.json` | slot rectangles, paper tones, provenance, built by `atlas.mjs` |
| `wall.json` | the patch layout: which slot goes where on the sphere |
| `parchment.webp` | 2048 px seamless parchment grain (procedural, from phase 1) |

## How the wall is drawn

`src/layers/notebook-sphere/wall.js` builds one mesh from `wall.json` and draws
it in a single pass that multiplies ink onto the parchment the shell has painted.
Each patch fades to "no ink" at its edge and continues mirrored past its crop, so
overlaps read as more drawing on the same paper and no border shows. Two
placements exist: `camera` (rays from the landing camera at 1920x1080, so the
scene lands where the target has it) and `dir` (a patch of a given angular width
centred on yaw and pitch).

The ink factor is the source divided by its paper tone with a knee at 92 %: any
pixel lighter than that is treated as clean paper (factor 1), so the sources'
grain never stains an overlap and only their marks add up. `wall.json` also sets
`gamma` (above 1 prints the lines darker, the paper stays), `bias` (mip bias,
the wall's softness) and `wash` (how much the network's light thins the ink
behind it). Where two patches meet they interleave along a noise boundary
rather than crossfading, so the crossing keeps full line contrast.

Rebuild the atlas with `node tools/sphere-art/atlas.mjs`. Measure a still with
`node tools/sphere-art/tone.mjs --img still.png`.
