# Deployment

This repository holds the compiled public site for [markuswalker.com](https://www.markuswalker.com/). Cloudflare Pages publishes the repository root with no build command. The editable source lives in the separate local `portfolio-website` repository.

## Two sites, two branches

- `main` is live: the plain HTML resume and portfolio. Its source is `static-site/` on the `static/resume-portfolio` branch of `portfolio-website`. No build step, so a release is a straight copy of that folder (leave out its `README.md`, since the root `README.md` here is the GitHub profile).
- `dev` holds the interactive orrery and network site while it's reworked. Cloudflare Pages serves it as a branch preview, and `_headers` keeps every `pages.dev` address out of search results. Build it in `portfolio-website` with `npm run build` and copy `dist/` onto `dev`.

The tag `interactive-live-2026-09-24` marks the last commit where the interactive site was live. To switch production back, merge `dev` into `main` or reset `main` to that tag, with Markus's approval.

Check the published site, its downloads and `_redirects` after every release. Nothing is pushed without Markus's explicit go-ahead.
