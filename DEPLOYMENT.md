# Deployment

This repository holds the compiled public site for [markuswalker.com](https://www.markuswalker.com/). Cloudflare Pages publishes the repository root with no build command. The editable source lives in the separate `portfolio-website` repository, on its `dev` branch.

## Two branches, one source

- `main` is live: the interactive notebook site. The plain HTML version ships inside it at `/classic/`, and browsers that cannot run the WebGL scene are sent there.
- `dev` is the preview of the same build before it goes live. Cloudflare Pages serves it as a branch preview, and `_headers` keeps every `pages.dev` address out of search results.

## Releasing

In `portfolio-website`, on `dev`, run `node tools/deploy-dev.mjs --target <a checkout of this repository>`. It builds the site, replaces the old site files and keeps this repository's own files (`_headers`, `_redirects`, `404.html`, `robots.txt`, `README.md`, `DEPLOYMENT.md`, `AGENTS.md`, `LICENSE`). Review what it removed, commit, then publish that checkout to `dev` for a preview or to `main` to go live.

## Rolling back

The tag `static-live-2026-09-26` is the last release of the plain HTML site on its own. The tag `interactive-live-2026-09-24` is the earlier orrery build. To switch production back, reset `main` to a tag, with Markus's approval.

Check the published site, its downloads and `_redirects` after every release. Nothing is pushed without Markus's explicit go-ahead.

## The free-only copy at /free/

`free/` is a copy of the Checkable AI tools with every paid surface left out: no Services menu or pages, no in-depth report, intake or sample report, no AU Frameworks paid engagement, no pricing and no "ask us" sections. Its links stay inside `/free/`, and `_headers` marks it noindex. The entry is https://www.markuswalker.com/free/checkable-ai/.

It is generated, not edited by hand. In `offerings-atlas`, run `python tools/free_site.py --site <a checkout of this repository on main>`, then commit `free/`. The script stops without writing if a page has changed so that a removal step finds nothing, or if any paid link or wording is left. To take the copy down, delete `free/` and its lines in `_headers` and `_redirects`.

## AI Stack Check removed, 24 October 2026

The AI Stack Check and Stack Watch, with their knowledge base data, came off this site and out of this repository's history on 24 October 2026 (owner decision). The Stack Check now lives at https://checkableai.com/stack-check/ and links here point there. The daily refresh in `offerings-atlas` no longer publishes here (its `deploy/site-target.json`). My stack, Stack pack and the AI register read `/stack-check/data/`, which is gone, so they run without vendor data. Do not run `tools/free_site.py` or the site-tools deploy against this repository again without the owner's word, since both put Stack Check pages back.
