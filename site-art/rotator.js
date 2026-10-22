window.SITE_ART = {"base": "/site-art/", "images": [{"id": "main-splash-dusk", "title": "Dusk macro: glass cube on walnut casting a light network (main splash, option B)", "alt": "A single shaft of late sun passes through a clear glass cube on a dark walnut desk and spreads a fine network of light points across the wood, with a rust leather notebook and a brass fountain pen soft in the shadows behind.", "pages": {"company": "live since 22 Oct 2026"}, "widths": [640, 960, 1280, 1672, 1920, 2560, 3344]}, {"id": "main-splash-photo", "title": "Photoreal still life: glass cube casting a light network (main splash)", "alt": "Late sun through a timber blind falls on a linen table: a worn rust leather notebook, a brass fountain pen, brass pins joined by red thread, and a clear glass cube whose refracted light spreads a fine network of bright points across the cloth.", "pages": {"company": "live 22 Oct 2026, replaced the same day by main-splash-dusk"}, "widths": [640, 960, 1280, 1672, 1920, 2560, 3344]}, {"id": "main-splash", "title": "Glass block, light network (main splash)", "alt": "A block of smoky glass with faint circuitry inside throws a network of light points and fine lines across a linen table, beside a rust leather notebook, a brass fountain pen and brass pins joined by rust thread.", "pages": {"company": "live 22 Oct 2026, replaced the same day by main-splash-photo"}, "widths": [640, 960, 1280, 1672, 1920, 2560, 3344]}, {"id": "stack-check", "title": "Glass slab stack, one out of line", "alt": "A stack of four smoky glass slabs with faint circuitry, one rust tinted and out of line, throws a network of light across a linen table beside a leather notebook, a fountain pen and brass pins joined by rust thread.", "pages": {"stack-check": "live since 22 Oct 2026"}, "widths": [640, 960, 1280, 1672, 1920, 2560, 3344]}, {"id": "au-frameworks", "title": "Pop-up paper framework", "alt": "Nested paper frames pop up from an open rust leather book, brass pins and rust thread joining their corners, while a small glass block with faint circuitry throws a network of light across them.", "pages": {"readiness-check": "live since 22 Oct 2026"}, "widths": [640, 960, 1280, 1672, 1920, 2560, 3344]}, {"id": "web-of-lines", "title": "People in a hall strung with a web of lines (library 43)", "alt": "Two people in a bright white hall strung with a web of fine lines that gather into knots of nodes overhead.", "pages": {"company-ethos": "live since 22 Oct 2026"}, "widths": [640, 960, 1280]}, {"id": "map-wall", "title": "Two people before a wall map of connecting lines (library 47)", "alt": "Two people study a gallery wall covered in red, blue and green arrows linking short notes.", "pages": {"company-who": "live since 22 Oct 2026"}, "widths": [640, 960, 1280]}, {"id": "owner-thread", "title": "Double exposure: business owner with a thread network (library 62)", "alt": "Double exposure of a business owner in profile, a harbour city at dusk and a network of brass pins and rust thread inside her silhouette.", "pages": {"company-work": "live since 22 Oct 2026"}, "widths": [640, 960, 1280, 1672]}, {"id": "compass-hero", "title": "Compass and map (retired)", "alt": "A brass compass on a folded map of the Australian coast, a rust red notebook, a fountain pen and a small glass block on a linen desk.", "pages": {"company": "live 21 to 22 Oct 2026"}, "widths": [640, 960, 1280, 1672]}, {"id": "regulation-desk", "title": "Regulation desk (retired)", "alt": "A clipped stack of printed pages with rust index tabs, a brass ruler, a pencil and a folded map on a linen desk.", "pages": {"readiness-check": "live 21 to 22 Oct 2026"}, "widths": [640, 960, 1280]}, {"id": "at-work", "title": "People at work (stock, retired)", "alt": "People working around a table with laptops.", "pages": {"stack-check": "live 19 to 22 Oct 2026"}, "widths": [640, 960]}, {"id": "stack-blocks", "title": "Glass blocks and caliper", "alt": "Frosted glass blocks stacked on a linen desk, one of them rust red, beside a brass caliper.", "pages": {"stack-check-report": "live since 21 Oct 2026"}, "widths": [640, 960, 1280]}, {"id": "thread-map", "title": "Thread map", "alt": "Paper cards of maps and sketches pinned with brass pins and joined by red thread on a linen desk.", "pages": {"readiness-landscape": "live since 21 Oct 2026"}, "widths": [640, 960, 1280]}, {"id": "services-five", "title": "Five services in a row", "alt": "A magnifier, a padlock and key, a wax-sealed document, a set square and pencil, and two coffee cups with a notebook, in a row on a linen desk.", "pages": {"stack-check-services": "live since 21 Oct 2026"}, "widths": [640, 960, 1280]}, {"id": "team-table", "title": "People at work: team table", "alt": "Colleagues of different ages around an office table discussing a work plan.", "pages": {"history": "AU Frameworks Check landing, before 21 Oct 2026"}, "widths": [640, 960, 1280]}, {"id": "blueprint-review", "title": "People at work: blueprint review", "alt": "A man and a woman at a table reviewing blueprints in an office.", "pages": {"history": "AU frameworks map, before 21 Oct 2026"}, "widths": [640, 960, 1280]}, {"id": "clinic-reception", "title": "People at work: clinic reception", "alt": "A receptionist at work at a clinic front desk.", "pages": {"history": "AU Frameworks Check, before 21 Oct 2026"}, "widths": [640]}, {"id": "electrician", "title": "People at work: electrician", "alt": "An electrician at work.", "pages": {"history": "AU Frameworks Check, before 21 Oct 2026"}, "widths": [640]}, {"id": "florist-owner", "title": "People at work: florist owner", "alt": "A florist at work in a flower shop.", "pages": {"history": "AU Frameworks Check, before 21 Oct 2026"}, "widths": [640]}, {"id": "bookkeeper", "title": "People at work: bookkeeper", "alt": "A bookkeeper at work at a desk.", "pages": {"history": "AU Frameworks Check, before 21 Oct 2026"}, "widths": [640]}]};
/* Feature image preview switcher for www.markuswalker.com.
   Does nothing unless the address has ?art in it. Then it adds a small bar with Previous and
   Next that swaps the page's feature image (the element marked data-art-slot) through every
   image in the library, so the owner can compare them in place before locking one in.
   The library list (window.SITE_ART) is written into this file by site-art/site/build.py. */
(function () {
  if (!/[?&]art(=|&|$)/.test(location.search)) return;
  var lib = window.SITE_ART;
  var img = document.querySelector('img[data-art-slot]');
  if (!lib || !img) return;
  var slot = img.getAttribute('data-art-slot');
  var picture = img.parentNode && img.parentNode.tagName === 'PICTURE' ? img.parentNode : null;

  // This page's live image first, then images once used here, then the rest of the library.
  var rank = function (it) {
    var note = it.pages[slot] || '';
    return note.indexOf('since') > -1 ? 0 : note ? 1 : 2;
  };
  var list = lib.images.slice().sort(function (a, b) { return rank(a) - rank(b); });
  var i = 0;

  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = lib.base + 'rotator.css';
  document.head.appendChild(link);

  var bar = document.createElement('div');
  bar.className = 'art-rotator';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Feature image preview');
  var prev = button('Previous');
  var label = document.createElement('p');
  label.setAttribute('aria-live', 'polite');
  var next = button('Next image');
  bar.appendChild(prev); bar.appendChild(label); bar.appendChild(next);
  document.body.appendChild(bar);

  prev.addEventListener('click', function () { show(i - 1); });
  next.addEventListener('click', function () { show(i + 1); });
  document.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') show(i + 1);
    if (e.key === 'ArrowLeft') show(i - 1);
  });
  show(0);

  function button(text) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    return b;
  }

  function show(n) {
    i = (n + list.length) % list.length;
    var it = list[i];
    var set = it.widths.map(function (w) { return lib.base + it.id + '-' + w + '.webp ' + w + 'w'; }).join(', ');
    if (picture) {
      Array.prototype.forEach.call(picture.querySelectorAll('source'), function (s) { s.srcset = set; });
    }
    img.srcset = set;
    img.src = lib.base + it.id + '-' + it.widths[Math.min(2, it.widths.length - 1)] + '.webp';
    img.alt = it.alt;
    var where = it.pages[slot] ? ' (on this page: ' + it.pages[slot] + ')' : '';
    label.textContent = (i + 1) + ' of ' + list.length + ': ' + it.title + where;
  }
})();
