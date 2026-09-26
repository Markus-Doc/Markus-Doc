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
