# Deployment

This repository contains the compiled static releases for [markuswalker.com](https://www.markuswalker.com/). Cloudflare Pages publishes the repository root with no build command. The editable source is kept in the separate local `portfolio-website` repository.

## Two branches

- `main` is the live site: the plain HTML resume and portfolio, built from `static-site/` on the `static/resume-portfolio` branch of `portfolio-website`.
- `dev` is the interactive preview at https://dev.markus-doc.pages.dev/, built from the `dev/vision-pass` branch of `portfolio-website`. `_headers` keeps every `pages.dev` address out of search results.

## Releasing the dev preview

In `portfolio-website`, run `node tools/deploy-dev.mjs` against a worktree of this repository's `dev` branch. It builds, removes the previous build's files, and copies `dist/` in, so the build replaces the folder rather than overlaying it. It keeps this repository's own files: `_headers`, `_redirects`, `404.html`, `AGENTS.md`, `DEPLOYMENT.md`, `LICENSE`, `README.md` and `robots.txt`. It also rewrites `THIRD-PARTY-LICENSES.txt`.

The preview links documents, project pages and the resume PDF to markuswalker.com, so it never serves stale copies.

Check the published preview after every push. Nothing reaches `main` without Markus's explicit go-ahead.
