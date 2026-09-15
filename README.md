# Markus Walker

Production portfolio at https://www.markuswalker.com/.

This repository contains the compiled static release. Cloudflare Pages publishes the repository root from `main`, with no remote build command. The single responsive portfolio uses vanilla JavaScript and a Three.js knowledge network.

- `/` is the current portfolio.
- `/old/` preserves the previous desktop and mobile website for comparison.
- `/sai-runner/` remains a separate Cloudflare Worker proxy and GitHub Pages workflow. Its source and deployment are not part of this repository.

The previous production commit is `05167f89c746b36f0ef6832aea14fab946e02e13`. The current artwork, interaction and content were reviewed as candidate XIII. Only runtime assets and public portfolio downloads are included here. Font licences are in `typography/licences/` and `typography/final/`.

To preview the static release, use any local HTTP server. Cloudflare-specific headers, redirects and 404 behaviour should also be verified in a Pages branch preview before merging to `main`.
