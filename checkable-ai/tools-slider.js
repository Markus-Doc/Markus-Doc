/* Free tools slider in the hero card. Arrows, dots and arrow keys move one slide at a time.
   It never moves on its own. The track is a scroll-snap row, so swiping works without this file. */
(function () {
  var root = document.querySelector('.ts');
  if (!root) return;
  var track = root.querySelector('.ts-track');
  var slides = Array.prototype.slice.call(root.querySelectorAll('.ts-slide'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('.ts-dot'));
  var now = root.querySelector('.ts-now');
  var current = 0;
  var busy = null; // set while a button-driven scroll is still animating

  function go(i) {
    current = (i + slides.length) % slides.length;
    clearTimeout(busy);
    busy = setTimeout(function () { busy = null; }, 900);
    track.scrollTo({ left: slides[current].offsetLeft - track.offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    mark(current);
  }
  function mark(i) {
    dots.forEach(function (d, k) { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    slides.forEach(function (s, k) { s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); s.inert = k !== i; });
    if (now) now.textContent = i + 1;
  }

  root.querySelector('.ts-prev').addEventListener('click', function () { go(current - 1); });
  root.querySelector('.ts-next').addEventListener('click', function () { go(current + 1); });
  dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
  });
  // Keep the dots right when someone swipes or scrolls the row by hand.
  var t;
  track.addEventListener('scroll', function () {
    clearTimeout(t);
    if (busy) return;
    t = setTimeout(function () {
      var i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== current && slides[i]) { current = i; mark(i); }
    }, 80);
  });
  mark(0);
})();
