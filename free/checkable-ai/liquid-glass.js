/* Liquid glass for the hero tools card (trial, 22 Oct 2026).
   CSS backdrop-filter can blur but cannot bend pixels, so this builds an SVG filter whose
   displacement map pushes the photo behind the card inward near its rounded edges, like the
   thick rim of a lens, with a slight colour split at the rim. Only Chromium browsers apply SVG
   filters in backdrop-filter, so other browsers keep the plain smoked glass from company.css.
   The map is drawn on a canvas at the card's real size and redrawn when the card resizes. */
(function () {
  var card = document.querySelector('.hero-card.ts');
  if (!card || !window.ResizeObserver) return;
  var brands = (navigator.userAgentData && navigator.userAgentData.brands) || [];
  var chromium = brands.some(function (b) { return /Chromium/.test(b.brand); });
  if (!chromium || matchMedia('(prefers-reduced-transparency: reduce)').matches) return;

  var NS = 'http://www.w3.org/2000/svg';
  var BEVEL = 30;   // px of curved rim that refracts
  var SCALE = 170;  // strength of the bend at the very edge
  var RADIUS = 22;  // must match the card's border-radius in company.css

  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  var filter = document.createElementNS(NS, 'filter');
  filter.setAttribute('id', 'liquid-glass');
  filter.setAttribute('x', '0');
  filter.setAttribute('y', '0');
  filter.setAttribute('width', '100%');
  filter.setAttribute('height', '100%');
  filter.setAttribute('color-interpolation-filters', 'sRGB');
  svg.appendChild(filter);
  document.body.appendChild(svg);

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    filter.appendChild(n);
    return n;
  }
  var image = el('feImage', { x: '0', y: '0', preserveAspectRatio: 'none', result: 'map' });
  // One displacement per colour channel at slightly different strengths gives the rim its colour split.
  [['r', 1, '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'],
   ['g', 0.93, '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0'],
   ['b', 0.86, '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0']].forEach(function (c) {
    el('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale: String(-SCALE * c[1]), xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' + c[0] });
    el('feColorMatrix', { in: 'd' + c[0], type: 'matrix', values: c[2], result: c[0] });
  });
  el('feBlend', { in: 'r', in2: 'g', mode: 'screen', result: 'rg' });
  el('feBlend', { in: 'rg', in2: 'b', mode: 'screen' });

  // Signed distance to a rounded rectangle centred at 0,0 with half sizes hw, hh.
  function sdf(x, y, hw, hh, r) {
    var qx = Math.abs(x) - hw + r, qy = Math.abs(y) - hh + r;
    var ox = Math.max(qx, 0), oy = Math.max(qy, 0);
    return Math.min(Math.max(qx, qy), 0) + Math.sqrt(ox * ox + oy * oy) - r;
  }

  function draw() {
    var w = Math.round(card.offsetWidth), h = Math.round(card.offsetHeight);
    if (!w || !h) return;
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var ctx = cv.getContext('2d');
    var img = ctx.createImageData(w, h), d = img.data;
    var hw = w / 2, hh = h / 2;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var px = x + 0.5 - hw, py = y + 0.5 - hh;
        var dist = -sdf(px, py, hw, hh, RADIUS); // inside distance from the edge
        var dx = 0, dy = 0;
        if (dist < BEVEL) {
          // Outward normal from the distance field, bend strongest at the edge and easing to zero.
          var nx = sdf(px + 1, py, hw, hh, RADIUS) - sdf(px - 1, py, hw, hh, RADIUS);
          var ny = sdf(px, py + 1, hw, hh, RADIUS) - sdf(px, py - 1, hw, hh, RADIUS);
          var len = Math.sqrt(nx * nx + ny * ny) || 1;
          var t = 1 - Math.max(dist, 0) / BEVEL;
          var m = t * t * t;
          dx = nx / len * m; dy = ny / len * m;
        }
        var i = (y * w + x) * 4;
        d[i] = 128 + dx * 127; d[i + 1] = 128 + dy * 127; d[i + 2] = 128; d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    image.setAttribute('width', w);
    image.setAttribute('height', h);
    image.setAttribute('href', cv.toDataURL());
    card.classList.add('is-liquid');
  }

  var pending;
  new ResizeObserver(function () { cancelAnimationFrame(pending); pending = requestAnimationFrame(draw); }).observe(card);
})();
