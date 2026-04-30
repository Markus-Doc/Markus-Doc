www.markuswalker.com

## Site Overview

This repository is a static portfolio site for Markus Walker. It runs directly from `index.html`, `styles.css`, `main.js`, and static files under `assets/`. There is no backend, build step, package manager, or server-side rendering path.

The primary experience is a Three.js WebGL command-centre scene with HTML overlays for navigation, portfolio sections, contact links, and document downloads. The site is designed to keep working on GitHub Pages and Cloudflare Pages.

## File Map

- `index.html` - static document shell, import map, loader, interactive UI, no-JavaScript fallback, runtime fallback, edit-mode controls.
- `main.js` - Three.js scene, graphics tiering, renderer setup, resize handling, adaptive DPR, interaction, content rendering, diagnostics overlay.
- `styles.css` - themes, layout, responsive rules, mobile graphics-tier CSS reductions, fallback and diagnostics styles.
- `_headers` - Cloudflare Pages headers and cache rules.
- `robots.txt` and `ai.txt` - crawler and AI-facing metadata.
- `assets/favicon.svg` - favicon.
- `assets/docs/Markus_Walker_Resume.pdf` - resume download.
- `assets/docs/Markus_Walker_IRP_Portfolio.pdf` - incident response portfolio artifact.
- `assets/docs/Markus_Walker_Cloud_Case_Study.pdf` - cloud security case study artifact.

## Mobile WebGL Design Rules

Mobile support is built around capability tiering instead of device-name branching. `main.js` probes WebGL support, GPU limits, compressed texture extensions, viewport size, coarse pointer behavior, reduced motion, and likely mobile Safari risk before creating the renderer.

Keep these rules intact unless there is a measured reason to change them:

- Keep the site static. Do not add a backend or deployment-time build requirement.
- Keep the Three.js import map compatible with GitHub Pages and Cloudflare Pages.
- Treat iOS Safari as the highest-risk browser. Test real device portrait and landscape after graphics changes.
- Do not casually raise DPR caps, particle counts, texture scale, shadows, antialiasing, blur, or CSS shadows.
- Prefer generated canvas textures and lightweight geometry over large image or GLB assets.
- Keep fallback content useful. A broken WebGL scene must still expose contact, resume, project, GitHub, LinkedIn, and email links.
- Keep `visualViewport` resize handling. Mobile Safari address-bar and rotation changes can report misleading viewport dimensions through older sizing paths.
- Keep context loss handling guarded. The current path performs one soft reload to rebuild GPU resources.

## Graphics Tier Meanings

- `desktop` - full scene budget, capped DPR 2.0, antialiasing and shadows enabled, 60 fps target.
- `mobileHigh` - mobile-capable tier, lower DPR cap, antialiasing and shadows off, reduced particles, 45 fps target.
- `mobileMedium` - constrained mobile tier, lower DPR and texture scale, fewer particles, reduced animation, 30 fps target.
- `mobileLow` - safest mobile tier, minimal particles, no decorative effects, lower animation intensity, 30 fps target.
- `fallback` - no usable WebGL context. The static HTML fallback should be shown.

The adaptive scaler can reduce DPR after load when moving average frame time stays over budget. Use `?debugGraphics=1` to inspect the selected tier, DPR cap, current DPR, drawing buffer size, frame timing, context loss count, renderer info, and enabled reductions.

## Local Diagnostics

Open the site normally to confirm regular users do not see diagnostics.

Open with:

```text
index.html?debugGraphics=1
```

or on a local server:

```text
http://localhost:8000/?debugGraphics=1
```

The diagnostics overlay is query-parameter gated and should not render by default. It is intentionally read-only and has no backend telemetry.

## Test Matrix

Minimum checks before merging graphics, layout, or deployment changes:

- Desktop Chrome or Edge, normal URL: scene loads, no diagnostics panel, dock and buttons work.
- Desktop Chrome or Edge, `?debugGraphics=1`: diagnostics panel appears and reports tier, WebGL version, DPR, drawing buffer, viewport, frame timing, context losses, renderer, and reductions.
- Desktop Firefox or Safari if available: scene and fallback links work.
- iPhone Safari portrait: loader clears, top bar and dock are tappable, scene scrolls, section panels fit.
- iPhone Safari landscape: viewport resize and dock safe-area behavior remain correct.
- Android Chrome if available: mobile tier applies and interactions remain tappable.
- Reduced motion enabled: decorative animation and CSS effects are reduced.
- JavaScript disabled: `noscript` fallback shows readable profile, skills, project links, resume, GitHub, LinkedIn, and email.
- WebGL unavailable or module load failure: runtime fallback shows the same useful static portfolio links.

## Deployment Notes

The site can be deployed by serving the repository root as static files.

GitHub Pages:

- Publish from the root of the branch.
- Keep relative links such as `./styles.css` and `./assets/docs/...`.
- Do not add a build-only asset path unless a build system is intentionally introduced later.

Cloudflare Pages:

- Build command: none.
- Output directory: repository root.
- `_headers` is Cloudflare Pages syntax and should stay valid.
- Root HTML should revalidate so `index.html` can pick up new query-versioned CSS and JS references.
- JS and CSS should be cached briefly with revalidation.
- Static assets under `assets/` can be cached long-term because document and asset filenames are stable and updates can be deployed atomically.

## Known Tradeoffs

- Three.js is loaded from jsDelivr through an import map. This keeps the repo simple but depends on CDN availability.
- There is no bundling or minification. This makes the site easy for future agents to inspect but gives up build-time optimization.
- The scene avoids heavy assets and advanced post-processing to protect mobile Safari.
- The diagnostics overlay is local in-page diagnostics only. It does not collect field telemetry.
- The fallback content is duplicated in `noscript` and the runtime fallback so it works across different failure modes.

## Future Work

Do not implement these items unless specifically requested:

- Possible Vite migration for bundling, dependency pinning, local development server ergonomics, and cache-busted output.
- Possible local vendoring of Three.js instead of the CDN import map.
- Possible KTX2 pipeline if GLB assets are added later.
- Possible OffscreenCanvas worker path later for supported browsers.
- Possible WebGPU enhancement path later, while keeping WebGL and static fallback support.
