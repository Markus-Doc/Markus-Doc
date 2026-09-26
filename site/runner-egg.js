/* Runner Easter egg. A small pixel spark hides on the footer rule of every
   page. Wake it (click it, type "runner", or enter the Konami code) and it
   runs in, jumps onto a question terminal and unlocks a link to Runner, the
   Claude study game at /runner/. No network requests, no dependencies. */
(function () {
  'use strict';

  var GAME_URL = '/runner/';
  var ABOUT_URL = '/projects/runner-claude-study-game/';
  var SCALE = 4;

  // 13 x 13 sprite. # body, e eye, l leg. Two leg frames make the run cycle.
  var BODY = [
    '......#......',
    '..#...#...#..',
    '...#..#..#...',
    '....#####....',
    '.#.#######.#.',
    '####e###e####',
    '.#.#######.#.',
    '....#####....',
    '...#..#..#...',
    '..#...#...#..',
    '......#......'
  ];
  var LEGS = {
    stand: ['....l...l....', '....l...l....'],
    runA: ['.....l.l.....', '....l...l....'],
    runB: ['....l...l....', '...l.....l...']
  };
  var COLOURS = { '#': '#d97757', e: '#1d1a17', l: '#a9533a' };

  function sprite(legs) {
    var rows = BODY.concat(LEGS[legs]);
    var rects = '';
    rows.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) {
        var c = COLOURS[row[x]];
        if (c) rects += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + c + '"/>';
      }
    });
    return '<svg viewBox="0 0 13 13" width="' + 13 * SCALE + '" height="' + 13 * SCALE +
      '" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' + rects + '</svg>';
  }

  var FRAMES = { stand: sprite('stand'), runA: sprite('runA'), runB: sprite('runB') };

  // Styles travel with the script, so any page that loads it gets the same egg.
  // The stage uses the game's own palette whatever the site theme.
  var CSS = [
    '.site-footer{position:relative}',
    '.egg-spark{position:absolute;top:-17px;left:clamp(1rem,38%,30rem);width:44px;height:44px;padding:0 7px 14px;margin:0;border:0;background:none;cursor:pointer;clip-path:inset(0 0 44% 0);transition:clip-path .2s,transform .2s}',
    '.egg-spark svg{width:30px;height:30px;display:block}',
    '.egg-spark:hover,.egg-spark:focus-visible{clip-path:inset(-8px -8px 0 -8px);transform:translateY(-8px)}',
    '.egg-spark:focus-visible{outline:3px solid #d97757;outline-offset:0}',
    '.egg-spark.is-away{visibility:hidden}',
    '.egg-inline{display:inline-grid;place-items:center;width:44px;height:44px;margin:-10px 0 -14px;padding:0;border:0;background:none;cursor:pointer;vertical-align:middle}',
    '.egg-inline svg{width:24px;height:24px;transition:transform .2s}',
    '.egg-inline:hover svg,.egg-inline:focus-visible svg{transform:translateY(-4px) rotate(12deg)}',
    '.egg-inline:focus-visible{outline:3px solid #d97757;outline-offset:0}',
    '@media (prefers-reduced-motion:no-preference){.egg-spark svg{animation:egg-peek 7s ease-in-out infinite}.egg-terminal.is-hit{animation:egg-bump .3s steps(3) 1}.egg-card{animation:egg-boot .35s steps(4) 1}.egg-runner.is-landed svg{animation:egg-land .25s steps(2) 1}}',
    '@keyframes egg-peek{0%,86%,100%{transform:translateY(0)}90%{transform:translateY(-3px)}94%{transform:translateY(1px)}}',
    '@keyframes egg-land{50%{transform:scale(1.12,.85) translateY(4px)}}',
    '@keyframes egg-bump{50%{transform:translateY(-6px)}}',
    '@keyframes egg-boot{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0 0 0 0)}}',
    '.egg-stage{--egg-bg:#0b0f1a;--egg-line:#3fe0f5;--egg-purple:#8a4dff;--egg-gold:#f5b23d;--egg-text:#e6ecf5;--egg-muted:#a3afc4;position:fixed;inset:0;z-index:1000;pointer-events:none;font-family:ui-monospace,"Cascadia Mono",Consolas,"SFMono-Regular",monospace;text-align:left}',
    '.egg-runner{position:absolute;left:0;top:0;will-change:transform}',
    '.egg-runner svg{display:block}',
    '.egg-terminal{position:absolute;bottom:0;left:50%;width:52px;height:60px;margin-left:-26px;box-sizing:border-box;background:#1c2233;border:3px solid #2d3650;border-bottom:0;box-shadow:inset 0 -10px 0 #141a28}',
    '.egg-terminal span{position:absolute;left:6px;right:6px;top:6px;height:26px;display:grid;place-items:center;background:#2a0f3a;border:2px solid var(--egg-purple);color:#ff5fd2;font-weight:700;font-size:16px}',
    '.egg-terminal.is-hit span{background:#07323a;border-color:var(--egg-line);color:var(--egg-line);font-size:0}',
    '.egg-terminal.is-hit span::after{content:"!";font-size:16px}',
    '.egg-card{pointer-events:auto;position:absolute;left:50%;bottom:130px;transform:translateX(-50%);box-sizing:border-box;width:min(25rem,calc(100vw - 2rem));max-height:calc(100vh - 150px);overflow:auto;padding:1.25rem 1.25rem 1rem;background:var(--egg-bg);color:var(--egg-text);border:3px solid var(--egg-line);box-shadow:0 0 0 3px var(--egg-bg),0 0 0 6px var(--egg-purple),0 18px 40px rgb(0 0 0/.45);font-size:.875rem;line-height:1.55}',
    '.egg-card[hidden]{display:none}',
    '.egg-card p{margin:0}',
    '.egg-kicker{margin:0 0 .35rem!important;color:var(--egg-line);font-size:.7rem;letter-spacing:.2em;text-transform:uppercase}',
    '.egg-title{margin:0;color:var(--egg-gold);font-family:inherit;font-size:2rem;font-weight:700;line-height:1;letter-spacing:.12em;text-transform:uppercase}',
    '.egg-sub{margin:.35rem 0 .9rem!important;font-size:.75rem;letter-spacing:.18em;text-transform:uppercase}',
    '.egg-copy{margin:0 0 1rem!important}',
    '.egg-actions{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem 1.25rem}',
    '.egg-start{display:inline-flex;align-items:center;gap:.5em;min-height:44px;padding:.5rem 1rem;background:var(--egg-gold);color:#1a1206;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:.1em;box-shadow:4px 4px 0 var(--egg-purple)}',
    '.egg-start:hover{background:#ffd27a;color:#1a1206}',
    '.egg-start:active{transform:translate(2px,2px);box-shadow:2px 2px 0 var(--egg-purple)}',
    '.egg-about{color:var(--egg-line);min-height:44px;display:inline-flex;align-items:center;text-decoration:underline;text-underline-offset:.25em}',
    '.egg-fine{margin:.9rem 0 0!important;color:var(--egg-muted);font-size:.7rem}',
    '.egg-close{position:absolute;top:.35rem;right:.35rem;width:44px;height:44px;border:0;background:none;color:var(--egg-muted);font-family:inherit;font-size:1.4rem;font-weight:700;line-height:1;cursor:pointer}',
    '.egg-close:hover{color:var(--egg-text)}',
    '.egg-stage :focus-visible{outline:3px solid var(--egg-line);outline-offset:3px}',
    '@media print{.egg-spark,.egg-stage{display:none}}'
  ].join('\n');

  function injectStyles() {
    if (document.getElementById('runner-egg-css')) return;
    var style = document.createElement('style');
    style.id = 'runner-egg-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  injectStyles();
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stage = null;
  var lastFocus = null;

  // The hiding spot: perched on the footer rule, mostly out of sight.
  function hide() {
    var footer = document.querySelector('.site-footer');
    if (!footer) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'egg-spark';
    btn.setAttribute('aria-label', 'Something small is hiding here. Wake it up.');
    btn.title = 'psst';
    btn.innerHTML = FRAMES.stand;
    btn.addEventListener('click', wake);
    footer.appendChild(btn);
  }

  function wake() {
    if (stage) return;
    lastFocus = document.activeElement;
    try { localStorage.setItem('mw-spark-found', '1'); } catch (e) {}

    stage = document.createElement('div');
    stage.className = 'egg-stage';
    stage.innerHTML =
      '<div class="egg-terminal" aria-hidden="true"><span>?</span></div>' +
      '<div class="egg-runner">' + FRAMES.stand + '</div>' +
      '<section class="egg-card" role="dialog" aria-modal="false" aria-labelledby="egg-title" hidden>' +
        '<button type="button" class="egg-close" aria-label="Close">&times;</button>' +
        '<p class="egg-kicker">Terminal unlocked</p>' +
        '<h2 id="egg-title" class="egg-title">Runner</h2>' +
        '<p class="egg-sub">Claude study game</p>' +
        '<p class="egg-copy">You found the spark. I built a pixel-art side-scroller to study for the Claude Certified Architect, Foundations exam. Answer questions at terminals, get past the bosses, or sit a timed mock exam.</p>' +
        '<div class="egg-actions">' +
          '<a class="egg-start" href="' + GAME_URL + '">Press start <span aria-hidden="true">&#9654;</span></a>' +
          '<a class="egg-about" href="' + ABOUT_URL + '">How I built it</a>' +
        '</div>' +
        '<p class="egg-fine">Independent project. Not affiliated with or endorsed by Anthropic.</p>' +
      '</section>';
    document.body.appendChild(stage);

    stage.querySelector('.egg-close').addEventListener('click', sleep);
    document.addEventListener('keydown', onEscape);

    var runner = stage.querySelector('.egg-runner');
    var terminal = stage.querySelector('.egg-terminal');
    var spark = document.querySelector('.egg-spark');
    if (spark) spark.classList.add('is-away');

    if (reduceMotion) {
      place(runner, terminalTop(terminal));
      terminal.classList.add('is-hit');
      reveal();
      return;
    }
    run(runner, terminal);
  }

  function terminalTop(terminal) {
    var r = terminal.getBoundingClientRect();
    var s = stage.getBoundingClientRect();
    return { x: r.left - s.left + r.width / 2 - 13 * SCALE / 2, y: r.top - s.top - 13 * SCALE };
  }

  function place(el, p) { el.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)'; }

  // Run in from the left with small hops, then one big jump onto the terminal.
  function run(runner, terminal) {
    var groundY = stage.clientHeight - 13 * SCALE;
    var target = terminalTop(terminal);
    var jumpFrom = target.x - 110;
    var x = -13 * SCALE;
    var speed = Math.max(260, stage.clientWidth / 3.2); // px per second
    var t0 = null;
    var tick = 0;
    var jumpStart = null;
    var JUMP_MS = 520;

    function frame(now) {
      if (!stage) return;
      if (t0 === null) t0 = now;
      var dt = Math.min(0.05, (now - (frame.last || now)) / 1000);
      frame.last = now;

      if (jumpStart === null) {
        x += speed * dt;
        tick += dt;
        var legs = Math.floor(tick * 11) % 2 ? 'runA' : 'runB';
        runner.innerHTML = FRAMES[legs];
        place(runner, { x: x, y: groundY - Math.abs(Math.sin(tick * 11)) * 4 });
        if (x >= jumpFrom) jumpStart = now;
      } else {
        var p = Math.min(1, (now - jumpStart) / JUMP_MS);
        var jx = jumpFrom + (target.x - jumpFrom) * p;
        var arc = Math.sin(p * Math.PI) * 70;
        var jy = groundY + (target.y - groundY) * p - arc;
        runner.innerHTML = FRAMES.runA;
        place(runner, { x: jx, y: jy });
        if (p === 1) {
          runner.innerHTML = FRAMES.stand;
          runner.classList.add('is-landed');
          terminal.classList.add('is-hit');
          setTimeout(reveal, 260);
          return;
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function reveal() {
    if (!stage) return;
    var card = stage.querySelector('.egg-card');
    card.hidden = false;
    card.querySelector('.egg-start').focus({ preventScroll: true });
  }

  function sleep() {
    if (!stage) return;
    document.removeEventListener('keydown', onEscape);
    stage.remove();
    stage = null;
    var spark = document.querySelector('.egg-spark');
    if (spark) spark.classList.remove('is-away');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function onEscape(e) { if (e.key === 'Escape') sleep(); }

  // Typed triggers. Ignored while the visitor is typing into a field.
  var WORD = 'runner';
  var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var typed = '';
  var konami = 0;
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

    konami = key === KONAMI[konami] ? konami + 1 : (key === KONAMI[0] ? 1 : 0);
    if (konami === KONAMI.length) { konami = 0; wake(); return; }

    if (key.length === 1) {
      typed = (typed + key).slice(-WORD.length);
      if (typed === WORD) { typed = ''; wake(); }
    }
  });

  if (window.console && console.log) {
    console.log('%c  *  %c Reading the source? There is a spark hiding in the footer. Or play Runner: https://www.markuswalker.com/runner/',
      'background:#d97757;color:#1d1a17;font-weight:700;border-radius:3px', 'color:inherit');
  }

  // Pages that render their content later (the interactive site's reading panel)
  // can wake the spark from any element marked data-egg-wake. An empty one gets
  // the sprite drawn into it when it appears.
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-egg-wake]');
    if (t) { e.preventDefault(); wake(); }
  });
  var fillQueued = false;
  function fillInline() {
    fillQueued = false;
    var empty = document.querySelectorAll('[data-egg-wake]:empty');
    for (var i = 0; i < empty.length; i++) { empty[i].innerHTML = FRAMES.stand; empty[i].title = 'psst'; }
  }
  // Batched to one check per frame, since the interactive site updates its labels often.
  if (window.MutationObserver) {
    new MutationObserver(function () {
      if (!fillQueued) { fillQueued = true; requestAnimationFrame(fillInline); }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hide);
  else hide();
})();
