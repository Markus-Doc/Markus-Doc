# Site image library

Every image approved for the business website, ready to use as the site grows. It travels with the
site: copy this whole folder to `/site-art/library/` on any host (it is plain static files, no script).

- `index.html` shows every image with its number, status, licence and source.
- `library.json` is the same list as data. `python library/build_index.py` rebuilds the page from it.
- `img/` holds the files: generated images at 1672 px, Unsplash photos at 1600 px.

Numbers match the review gallery of 22 October 2026. Left out on the owner's word: rejected picks
(49 shows a product name, 51 reads as blowing bubbles) and everything from Grok.

Licences: generated images came from the owner's ChatGPT account (OpenAI's terms assign output rights
to the user). Unsplash photos are under the Unsplash License: free for commercial use, no credit
required, not to be sold as-is or used to build a competing image service. Each entry links its source
page. Check people photos are never shown endorsing a product.

The three live feature images, with their full srcset ladder up to 3344 px and the `?art` preview
switcher, sit one level up in `/site-art/` and are built by `site/build.py`.
