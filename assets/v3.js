/* v3 shared behaviour for every v3 page: the time-of-day setting (cover mood + theme), click / scroll sounds, and the
   left nav (a dot that springs to the section in view). Pages mark their nav links with
   data-spy="<id>" and the matching sections with data-section; the first link stands
   for the top of the page. Page-specific scripts stay inline in each page. */
(function () {
  var root = document.documentElement;

  // Light or dark: one setting for the whole site (internally 'day' and 'night').
  // Auto (the default) follows the visitor's clock: light 6 am to 7 pm, dark otherwise.
  // The control shows the current mode's icon; clicking it flips to the other. A pick is
  // remembered; picking the mode for the visitor's own time goes back to Auto.
  var MOOD_THEME = { day: 'white', night: 'dark' };
  var timeBtns = document.querySelectorAll('[data-set-time]');
  function moodNow() {
    var h = new Date().getHours();
    return h >= 6 && h < 19 ? 'day' : 'night';
  }
  function greeting(mood) {
    if (mood === 'night') return 'Hello, night owl.';
    return new Date().getHours() < 12 ? 'Good morning.' : 'Good afternoon.';
  }
  function applyTime(choice) {
    var mood = choice === 'auto' ? moodNow() : choice, theme = MOOD_THEME[mood];
    root.dataset.timeChoice = choice;
    root.dataset.mood = mood;
    timeBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.setTime === mood); });
    document.querySelectorAll('[data-greet]').forEach(function (el) { el.textContent = greeting(mood); });
    if (root.dataset.theme !== theme) {
      root.dataset.theme = theme;
      document.dispatchEvent(new CustomEvent('v3:theme', { detail: theme }));
    }
  }
  applyTime(root.dataset.timeChoice || 'auto');
  timeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var next = root.dataset.mood === 'day' ? 'night' : 'day';
      play(next === 'day' ? 'toLight' : 'toDark');
      var choice = next === moodNow() ? 'auto' : next;
      try { if (choice === 'auto') localStorage.removeItem('v3-time'); else localStorage.setItem('v3-time', choice); } catch (err) {}
      var swap = function () {
        applyTime(choice);
        var shown = b.parentNode.querySelector('[data-set-time="' + next + '"]');
        if (shown) shown.focus();
      };
      // One soft crossfade of the whole page, so sky, background, text and drawings change together.
      if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) { swap(); return; }
      root.classList.add('mode-switching');
      document.startViewTransition(swap).finished.finally(function () { root.classList.remove('mode-switching'); });
    });
  });
  setInterval(function () { if (root.dataset.timeChoice === 'auto') applyTime('auto'); }, 60000);

  // Click sounds, made with Web Audio (no files), after directoryyy.com: the nav plays
  // a two-note chime with a short echo, every other button or link a soft press.
  var SOUNDS = {
    chime: { gain: .5, layers: [
      { type: 'tone', freq: 1046.5, attack: .006, decay: .22, peak: .09 },
      { type: 'tone', freq: 1568, offset: .09, attack: .006, decay: .26, peak: .08 }
    ], echo: { delay: .12, feedback: .25, wet: .18, lowpass: 4000 } },
    tick: { gain: .8, layers: [
      { type: 'noise', filter: 'bandpass', freq: 2600, q: 1.4, attack: .001, decay: .04, peak: .3 },
      { type: 'tone', freq: 880, attack: .002, decay: .09, peak: .12 }
    ] },
    press: { gain: .4, layers: [
      { type: 'noise', filter: 'bandpass', freq: 1700, q: 1.4, attack: .001, decay: .02, peak: .13 }
    ] },
    // Home "Currently" hovers, one per drawing: a card slid on paper, a block set down, a page
    // flicked, a record starting. Quieter than a click; `to` glides the pitch or filter.
    slide: { gain: .7, layers: [
      { type: 'noise', filter: 'bandpass', freq: 900, to: 2200, q: 2, attack: .05, decay: .24, peak: .2 }
    ] },
    stack: { gain: .8, layers: [
      { type: 'noise', filter: 'bandpass', freq: 1300, q: 1, attack: .001, decay: .04, peak: .18 },
      { type: 'tone', freq: 392, attack: .002, decay: .16, peak: .22 }
    ] },
    page: { gain: .7, layers: [
      { type: 'noise', filter: 'highpass', freq: 2800, to: 5200, q: .7, attack: .025, decay: .17, peak: .18 }
    ] },
    // Hovering a Start here drawing: one short, quiet note, the same for all four
    hover: { gain: .35, layers: [
      { type: 'tone', freq: 880, attack: .006, decay: .12, peak: .07 }
    ] },
    // The light/dark switch: two soft notes, rising to light and falling to dark
    toLight: { gain: .6, layers: [
      { type: 'tone', freq: 587.3, attack: .008, decay: .2, peak: .12 },
      { type: 'tone', freq: 880, offset: .08, attack: .008, decay: .32, peak: .1 }
    ] },
    toDark: { gain: .6, layers: [
      { type: 'tone', freq: 587.3, attack: .008, decay: .2, peak: .12 },
      { type: 'tone', freq: 392, offset: .08, attack: .008, decay: .32, peak: .12 }
    ] },
    spin: { gain: .7, layers: [
      { type: 'tone', freq: 784, attack: .015, decay: .42, peak: .1 },
      { type: 'tone', freq: 1175, offset: .09, attack: .015, decay: .5, peak: .08 }
    ] }
  };
  var VOLUME = .4, ctx = null, bus = null;
  function audio() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    var boost = ctx.createGain(); boost.gain.value = 4;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -8; comp.knee.value = 6; comp.ratio.value = 12; comp.attack.value = .002; comp.release.value = .08;
    boost.connect(comp).connect(ctx.destination);
    bus = boost;
    return ctx;
  }
  function envelope(g, l, t) {
    g.gain.setValueAtTime(1e-4, t);
    g.gain.exponentialRampToValueAtTime(l.peak, t + l.attack);
    g.gain.exponentialRampToValueAtTime(1e-4, t + l.attack + l.decay);
  }
  function play(name) {
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    var c = audio(); if (!c) return;
    var s = SOUNDS[name];
    var go = function () {
      var now = c.currentTime, out = c.createGain();
      out.gain.value = s.gain * VOLUME;
      out.connect(bus);
      if (s.echo) {
        var d = c.createDelay(1), lp = c.createBiquadFilter(), fb = c.createGain(), wet = c.createGain();
        d.delayTime.value = s.echo.delay; lp.type = 'lowpass'; lp.frequency.value = s.echo.lowpass;
        fb.gain.value = s.echo.feedback; wet.gain.value = s.echo.wet;
        out.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(wet); wet.connect(bus);
        setTimeout(function () { out.disconnect(); d.disconnect(); lp.disconnect(); fb.disconnect(); wet.disconnect(); }, 1500);
      }
      s.layers.forEach(function (l) {
        var t = now + (l.offset || 0), end = t + l.attack + l.decay + .05, g = c.createGain(), src;
        envelope(g, l, t);
        if (l.type === 'tone') {
          src = c.createOscillator(); src.type = 'sine'; src.frequency.setValueAtTime(l.freq, t);
          if (l.to) src.frequency.exponentialRampToValueAtTime(l.to, t + l.attack + l.decay);
          src.connect(g);
        } else {
          var n = Math.max(1, Math.floor((end - t) * c.sampleRate)), buf = c.createBuffer(1, n, c.sampleRate), data = buf.getChannelData(0);
          for (var i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
          src = c.createBufferSource(); src.buffer = buf;
          var f = c.createBiquadFilter(); f.type = l.filter; f.frequency.setValueAtTime(l.freq, t); f.Q.value = l.q;
          if (l.to) f.frequency.exponentialRampToValueAtTime(l.to, t + l.attack + l.decay);
          src.connect(f).connect(g);
        }
        g.connect(out); src.start(t); src.stop(end);
      });
    };
    if (c.state === 'running') go(); else c.resume().then(function () { if (c.state === 'running') go(); }, function () {});
  }
  window.v3Sound = play;   // for page scripts (home's Currently hovers)
  // Browsers only allow sound after the first tap, click or key press: wake the audio then,
  // so the scroll ticks that follow can be heard
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, function wake() { var c = audio(); if (c && c.state !== 'running') c.resume(); window.removeEventListener(ev, wake); }, { passive: true });
  });
  document.addEventListener('click', function (e) {
    var el = e.target instanceof Element && e.target.closest('button, a[href], summary, [role="button"]');
    if (!el || el.matches(':disabled') || el.matches('[data-set-time]')) return;   // the mode switch has its own sound
    var tag = el.closest('[data-sound]');
    var kind = tag ? tag.getAttribute('data-sound') : 'press';
    if (kind !== 'off') play(kind === 'chime' ? 'chime' : 'press');
  }, true);

  // Click spark, after ch.sh: every click sends six short strokes out from the pointer,
  // in the text colour at low opacity, gone in 300ms. Drawn on one canvas over the page
  // that ignores the pointer; it only runs while a spark is alive.
  var burst = function () {};   // set below; the nav reuses it as a visual tick
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var spark = document.createElement('canvas'), sctx = spark.getContext('2d'), sparks = [], sraf = 0;
    spark.className = 'click-spark';
    spark.setAttribute('aria-hidden', 'true');
    document.body.appendChild(spark);
    var sizeSpark = function () {
      var r = window.devicePixelRatio || 1;
      spark.width = innerWidth * r; spark.height = innerHeight * r;
      sctx.setTransform(r, 0, 0, r, 0, 0);
    };
    sizeSpark();
    window.addEventListener('resize', sizeSpark);
    var drawSpark = function (now) {
      sctx.clearRect(0, 0, innerWidth, innerHeight);
      sctx.strokeStyle = getComputedStyle(spark).color;
      sctx.globalAlpha = .3; sctx.lineWidth = 1.5; sctx.lineCap = 'round';
      sparks = sparks.filter(function (p) {
        var t = (now - p.t0) / 300;
        if (t >= 1) return false;
        var e = t * (2 - t), d = e * 12, len = 6 * (1 - e);      // ease-out; travels 12px, shrinks from 6px
        var cx = Math.cos(p.a), cy = Math.sin(p.a);
        sctx.beginPath();
        sctx.moveTo(p.x + d * cx, p.y + d * cy);
        sctx.lineTo(p.x + (d + len) * cx, p.y + (d + len) * cy);
        sctx.stroke();
        return true;
      });
      sraf = sparks.length ? requestAnimationFrame(drawSpark) : 0;
    };
    burst = function (x, y) {
      var t0 = performance.now();
      for (var i = 0; i < 6; i++) sparks.push({ x: x, y: y, a: Math.PI * 2 * i / 6, t0: t0 });
      if (!sraf) sraf = requestAnimationFrame(drawSpark);
    };
    window.addEventListener('click', function (e) {
      if (!e.clientX && !e.clientY) return;                    // keyboard "clicks" have no pointer
      var t0 = performance.now();
      for (var i = 0; i < 6; i++) sparks.push({ x: e.clientX, y: e.clientY, a: Math.PI * 2 * i / 6, t0: t0 });
      if (!sraf) sraf = requestAnimationFrame(drawSpark);
    });
  }

  // Nav mark: sits 8px before the current label and, when the section changes, springs
  // along a slight curve to the new one (spring 200 / damping 24, 45ms delay)
  var group = document.querySelector('.nav-group');
  var dot = document.querySelector('.nav-dot');
  var dotPos = null, dotAnim = 0;
  function target(a) {
    var label = a.querySelector('span');
    return { x: label.offsetLeft - dot.offsetWidth - 8, y: a.offsetTop + (a.offsetHeight - dot.offsetHeight) / 2 };
  }
  function place(p) { dot.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)'; }
  function moveDot(a) {
    if (!dot || getComputedStyle(dot).display === 'none') return;
    var to = target(a);
    if (!dotPos || matchMedia('(prefers-reduced-motion: reduce)').matches) { dotPos = to; place(to); return; }
    var from = { x: dotPos.x, y: dotPos.y };
    var dx = to.x - from.x, dy = to.y - from.y;
    // control point pushed sideways so the mark arcs out to the left on the way down
    var bend = .35 * (dy > 0 ? 1 : -1);
    var ctrl = { x: (from.x + to.x) / 2 - Math.abs(dy) * Math.abs(bend), y: (from.y + to.y) / 2 - dx * bend };
    var x = 0, v = 0, last = null, id = ++dotAnim, start = performance.now() + 45;
    function step(now) {
      if (id !== dotAnim) return;
      if (now < start) return requestAnimationFrame(step);
      var dt = Math.min(.032, last == null ? .016 : (now - last) / 1000); last = now;
      v += (-200 * (x - 1) - 24 * v) * dt;
      x += v * dt;
      var u = 1 - x;
      dotPos = { x: u * u * from.x + 2 * u * x * ctrl.x + x * x * to.x, y: u * u * from.y + 2 * u * x * ctrl.y + x * x * to.y };
      place(dotPos);
      if (Math.abs(1 - x) > .001 || Math.abs(v) > .01) requestAnimationFrame(step);
      else { dotPos = to; place(to); }
    }
    requestAnimationFrame(step);
  }

  // Nav: mark the section in view. A clicked item stays marked until the reader scrolls
  // by hand (near the bottom, About and Contact are both on screen).
  var links = {}, active = null, pinned = null;
  // Home page: sections stack, only the current one shows (styles-v3.css; driven at the end of this file)
  var stack = [].slice.call(document.querySelectorAll('[data-stack]')), stackMode = false;
  document.querySelectorAll('[data-spy]').forEach(function (a) {
    links[a.dataset.spy] = a;
    a.addEventListener('click', function () { pinned = a.dataset.spy; setActive(pinned); });
  });
  function unpin() { if (pinned) { pinned = null; spy(); } }
  ['wheel', 'touchmove'].forEach(function (ev) { window.addEventListener(ev, unpin, { passive: true }); });
  window.addEventListener('keydown', function (e) { if (/^(Arrow|Page|Home|End| )/.test(e.key)) unpin(); });
  // Labels change width once the web font arrives, or on resize: re-seat the dot
  function reseat() { if (active) { dotPos = null; moveDot(links[active]); } }
  if (document.fonts) document.fonts.ready.then(reseat);
  window.addEventListener('resize', reseat);
  function setActive(id, fromScroll) {
    if (id === active) return;
    if (fromScroll && active) {
      play('tick');
      if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate(8);
      // visual tick: a small spark where the nav mark lands
      setTimeout(function () { if (!dot) return; var r = dot.getBoundingClientRect(); if (r.width) burst(r.left + r.width / 2, r.top + r.height / 2); }, 320);
    }
    active = id;
    stack.forEach(function (s) { s.classList.toggle('is-current', s.getAttribute('data-stack') === id); });
    Object.keys(links).forEach(function (k) { links[k].classList.toggle('is-active', k === id); });
    moveDot(links[id]);
  }
  var sections = document.querySelectorAll('[data-section]');
  var first = Object.keys(links)[0];
  if (!first) return; // pages without a section nav (case studies) stop here
  var queued = false;
  function spy() {
    queued = false;
    if (pinned || stackMode) return;
    var current = first;
    sections.forEach(function (s) { if (s.getBoundingClientRect().top < window.innerHeight * 0.45) current = s.id; });
    // At the very bottom the last section can't reach the line, so mark it anyway
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = sections[sections.length - 1].id;
    setActive(current, true);
  }
  window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(spy); } }, { passive: true });

  // Stack mode (home, desktop): the stage pins to the screen; scroll position alone decides which
  // section shows, in even steps, so scrolling and the nav always agree.
  var stage = document.querySelector('.stack-stage'), mainEl = document.querySelector('.v3-main');
  var step = 0, stageOffset = 0, pinTop = 0, shown = -1, heading = null;   // heading: a nav click on its way, so passing sections stay quiet
  var starts = [], extra = [];   // where each section's turn begins, and how far a tall one slides up inside it
  function stackLayout(keep) {
    if (!stage || !stack.length) return;
    var root = document.documentElement;
    root.classList.add('stack-on');
    mainEl.style.height = '';
    if (!matchMedia('(min-width: 961px)').matches) {
      root.classList.remove('stack-on'); stackMode = false; spy(); return;   // small screens: the page scrolls as usual
    }
    // every section starts level with the nav; one taller than the room left slides up before the next comes in
    var nav = document.querySelector('.v3-nav'), g = document.querySelector('.nav-group');
    var navTop = Math.round(g.getBoundingClientRect().top - nav.getBoundingClientRect().top);
    var room = stage.offsetHeight - navTop - 88;   // keeps a tall last section clear of the footer
    stage.style.setProperty('--nav-top', navTop + 'px');
    step = Math.round(window.innerHeight * .6);
    var at = 0;
    stack.forEach(function (s, k) {
      s.style.setProperty('--stack-top', navTop + 'px');
      starts[k] = at; extra[k] = Math.max(0, s.offsetHeight - room);
      at += extra[k] + step;
    });
    // where the stage starts inside main, read while it isn't pinned
    pinTop = parseFloat(getComputedStyle(stage).top) || 0;
    stage.style.position = 'relative';
    stageOffset = stage.getBoundingClientRect().top - mainEl.getBoundingClientRect().top;
    stage.style.position = '';
    var last = stack.length - 1;
    mainEl.style.height = Math.round(stageOffset + stage.offsetHeight + starts[last] + extra[last]) + 'px';
    stackMode = true;
    if (keep !== true) shown = -1;
    stackUpdate();
  }
  function stageStart() { return mainEl.getBoundingClientRect().top + window.scrollY + stageOffset - pinTop; }
  function stackUpdate() {
    if (!stackMode) return;
    var p = window.scrollY - stageStart(), i = 0;
    for (var k = 1; k < stack.length; k++) if (p >= starts[k] - step / 2) i = k;
    stack.forEach(function (s, k) { s.style.setProperty('--stack-pan', -Math.round(Math.max(0, Math.min(extra[k], p - starts[k]))) + 'px'); });
    if (i === shown) return;
    var id = stack[i].getAttribute('data-stack');
    if (heading && id !== heading) {   // passing through on a nav click: swap quietly, no tick
      shown = i; stack.forEach(function (s, k) { s.classList.toggle('is-current', k === i); }); return;
    }
    heading = null;
    var quiet = shown < 0;
    shown = i;
    active = active === id ? null : active;   // let setActive run even if the click already marked it
    setActive(id, !quiet);
  }
  Object.keys(links).forEach(function (id) {
    links[id].addEventListener('click', function (e) {
      if (!stackMode) return;
      var i = stack.map(function (s) { return s.getAttribute('data-stack'); }).indexOf(id);
      if (i < 0) return;
      e.preventDefault();
      heading = id;
      // jump straight there: only the chosen section rises in, nothing flickers past on the way
      window.scrollTo({ top: stageStart() + starts[i], behavior: 'instant' });
      stackUpdate();
    });
  });
  window.addEventListener('scroll', stackUpdate, { passive: true });
  window.addEventListener('resize', function () { stackLayout(); });
  if (document.fonts) document.fonts.ready.then(function () { stackLayout(); });
  window.addEventListener('load', function () { stackLayout(); });
  // The cover opens tall and then settles shorter: the pinned name, status and nav follow its real
  // height, so they are never tucked behind it (a scroll or reload during the greeting)
  var cover = document.querySelector('.cover'), coverQueued = false;
  if (cover && window.ResizeObserver) {
    new ResizeObserver(function () {
      root.style.setProperty('--cover-h', cover.offsetHeight + 'px');
      if (coverQueued) return; coverQueued = true;
      requestAnimationFrame(function () { coverQueued = false; stackLayout(true); });
    }).observe(cover);
  }
  stackLayout();
  spy();
})();

/* Home cover: the ambient sound of whichever time of day is showing.
   Sound is made with Web Audio (no files), starts off, and remembers the visitor's choice. */
(function () {
  var cover = document.querySelector('.scene.cover');
  if (!cover) return;
  var root = document.documentElement;

  // Sound
  var btn = cover.querySelector('[data-ambient]');
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!btn || !AC) { if (btn) btn.hidden = true; return; }
  var ctx, master, beds = {}, on = false, timer = 0;

  var noise = function () {
    var b = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), d = b.getChannelData(0), last = 0;
    for (var i = 0; i < d.length; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    var s = ctx.createBufferSource(); s.buffer = b; s.loop = true; s.start(); return s;
  };
  var wind = function (out, freq, level, rate) {
    var f = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain();
    f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = level;
    lfo.frequency.value = rate; depth.gain.value = level * .6;
    lfo.connect(depth); depth.connect(g.gain); lfo.start();
    noise().connect(f); f.connect(g); g.connect(out);
  };
  var bed = function (name) { var g = ctx.createGain(); g.gain.value = 0; g.connect(master); beds[name] = g; return g; };
  var tone = function (out, type, f0, f1, at, len, level) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(f1, at + len);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(level, at + Math.min(.03, len / 3));
    g.gain.exponentialRampToValueAtTime(.0001, at + len);
    o.connect(g); g.connect(out); o.start(at); o.stop(at + len + .02);
  };
  var build = function () {
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    wind(bed('day'), 1100, .1, .09);
    wind(bed('mid'), 620, .11, .06);
    var night = bed('night');
    wind(night, 340, .07, .05);
    [110, 164.8].forEach(function (f) { var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.value = .014; o.connect(g); g.connect(night); o.start(); });
  };
  var moments = {
    day: function (t) { // a bird
      var n = 2 + Math.floor(Math.random() * 3), base = 2600 + Math.random() * 1200;
      for (var i = 0; i < n; i++) tone(beds.day, 'sine', base, base * (i % 2 ? .82 : 1.22), t + i * .14, .11, .028);
      return 2500 + Math.random() * 5000;
    },
    mid: function (t) { // a slow chime
      var notes = [392, 440, 523.25, 587.33, 659.25, 783.99], f = notes[Math.floor(Math.random() * notes.length)];
      tone(beds.mid, 'sine', f, f, t, 3.4, .03); tone(beds.mid, 'sine', f * 2, f * 2, t, 1.6, .007);
      return 3000 + Math.random() * 4500;
    },
    night: function (t) { // crickets
      for (var i = 0; i < 5; i++) tone(beds.night, 'sine', 4300, 4250, t + i * .075, .05, .007);
      return 900 + Math.random() * 1200;
    }
  };
  var tick = function () {
    if (!on) return;
    var m = moments[root.dataset.mood] || moments.day;
    timer = setTimeout(tick, m(ctx.currentTime + .05));
  };
  var showBed = function () {
    if (!ctx) return;
    Object.keys(beds).forEach(function (k) { beds[k].gain.setTargetAtTime(k === root.dataset.mood ? 1 : 0, ctx.currentTime, .7); });
  };
  var set = function (want, remember) {
    on = want;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (remember) { try { localStorage.setItem('v3-ambient', on ? 'on' : 'off'); } catch (e) {} }
    clearTimeout(timer);
    if (on) { if (!ctx) build(); ctx.resume(); showBed(); master.gain.setTargetAtTime(1, ctx.currentTime, .8); tick(); }
    else if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, .3);
  };
  btn.addEventListener('click', function () { set(!on, true); });
  new MutationObserver(function () { showBed(); }).observe(root, { attributes: true, attributeFilter: ['data-mood'] });
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) { ctx.suspend(); clearTimeout(timer); } else if (on) { ctx.resume(); tick(); }
  });
  // A returning visitor who left it on: browsers need one tap or key first
  var saved = null; try { saved = localStorage.getItem('v3-ambient'); } catch (e) {}
  if (saved === 'on') {
    btn.setAttribute('aria-pressed', 'true');
    var wake = function (e) {
      removeEventListener('pointerdown', wake); removeEventListener('keydown', wake);
      if (!e.target.closest || !e.target.closest('[data-ambient]')) set(true, false);
    };
    addEventListener('pointerdown', wake); addEventListener('keydown', wake);
  }
})();
