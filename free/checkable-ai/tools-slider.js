/* Free tools slider in the hero card. Arrows, dots and arrow keys move one slide at a time.
   It also moves on by itself every 6 seconds (WCAG 2.2.2): it holds while the pointer or keyboard
   focus is in the card or the tab is hidden, has a pause button, and does not auto-advance for
   people who ask for reduced motion. Any manual move restarts the timer. The track is a
   scroll-snap row, so swiping works without this file. */
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
    // Restart the fill bar on the active dot.
    var d = dots[i];
    if (d) { d.removeAttribute('aria-current'); void d.offsetWidth; d.setAttribute('aria-current', 'true'); }
  }

  var DELAY = 6000;
  var timer = null, hovered = false, focused = false;
  var paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var toggle = root.querySelector('.ts-pause');

  function tick() {
    stop();
    root.classList.toggle('is-stopped', paused);
    root.classList.toggle('is-held', !paused && (hovered || focused || document.hidden));
    if (paused || hovered || focused || document.hidden) return;
    timer = setTimeout(function () { go(current + 1); tick(); }, DELAY);
  }
  function stop() { clearTimeout(timer); timer = null; }
  function showToggle() {
    toggle.setAttribute('aria-label', paused ? 'Play the slides' : 'Pause the slides');
    toggle.classList.toggle('is-paused', paused);
  }
  function manual(i) { go(i); tick(); }

  root.querySelector('.ts-prev').addEventListener('click', function () { manual(current - 1); });
  root.querySelector('.ts-next').addEventListener('click', function () { manual(current + 1); });
  dots.forEach(function (d, k) { d.addEventListener('click', function () { manual(k); }); });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); manual(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); manual(current - 1); }
  });
  toggle.addEventListener('click', function () { paused = !paused; showToggle(); tick(); });
  root.addEventListener('mouseenter', function () { hovered = true; stop(); });
  root.addEventListener('mouseleave', function () { hovered = false; tick(); });
  root.addEventListener('focusin', function () { focused = true; stop(); });
  root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) { focused = false; tick(); } });
  document.addEventListener('visibilitychange', tick);
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
  showToggle();
  tick();
})();
