# Deployment

Production portfolio at https://www.markuswalker.com/.

This repository contains the compiled static release. Cloudflare Pages publishes the
repository root from `main`, with no remote build command. The single responsive
portfolio uses vanilla JavaScript and a Three.js knowledge network.

- `/` is the current portfolio.
- `/old/` preserves the previous desktop and mobile website for comparison.
- `/sai-runner/` remains a separate Cloudflare Worker proxy and GitHub Pages workflow.
  Its source and deployment are not part of this repository.

The previous production commit is `05167f89c746b36f0ef6832aea14fab946e02e13`. The
current artwork, interaction and content were reviewed as candidate XIII. Only runtime
assets and public portfolio downloads are included here. Font licences are in
`typography/licences/` and `typography/final/`.

To preview the static release, use any local HTTP server. Cloudflare-specific headers,
redirects and 404 behaviour should also be verified in a Pages branch preview before
merging to `main`.

## Why this is not the README

`Markus-Doc` is both the source for markuswalker.com and the GitHub profile
repository, so its `README.md` renders at https://github.com/Markus-Doc. These notes
used to sit there, which meant anyone following the GitHub link on the resume landed
on Cloudflare configuration and font licence paths. The README is now the profile;
deployment detail lives here. Moved 21 September 2026.
