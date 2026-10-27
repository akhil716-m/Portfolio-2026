/* v3 shared behaviour for every v3 page: the time-of-day setting (cover mood + theme), click / scroll sounds, and the
   left nav (a dot that springs to the section in view). Pages mark their nav links with
   data-spy="<id>" and the matching sections with data-section; the first link stands
   for the top of the page. Page-specific scripts stay inline in each page. */
(function () {
  var root = document.documentElement;

  // Time of day: one setting for the whole site, with three modes that are also the themes:
  // Day (white), Mid (paper), Night (dark). Auto (the default) follows the visitor's clock:
  // Day 6 am to 4 pm, Mid 4 to 7 pm, Night 7 pm to 6 am. The control shows only the selected
  // mode; clicking it opens all three. A pick is remembered; picking the mode for the
  // visitor's own time goes back to Auto.
  var MOOD_THEME = { day: 'white', mid: 'paper', night: 'dark' };
  var timeBtns = document.querySelectorAll('[data-set-time]');
  function moodNow() {
    var h = new Date().getHours();
    return h >= 6 && h < 16 ? 'day' : h >= 16 && h < 19 ? 'mid' : 'night';
  }
  function greeting(mood) {
    if (mood === 'night') return 'Hello, night owl.';
    if (mood === 'mid') return 'Good evening.';
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
  var tabGroups = document.querySelectorAll('.time-tabs');
  function closeTabs() { tabGroups.forEach(function (g) { g.classList.remove('is-open'); }); }
  timeBtns.forEach(function (b) {
    b.addEventListener('click', function (e) {
      var group = b.closest('.time-tabs');
      e.stopPropagation();
      if (!group.classList.contains('is-open')) { closeTabs(); group.classList.add('is-open'); return; }
      var choice = b.dataset.setTime === moodNow() ? 'auto' : b.dataset.setTime;
      try { if (choice === 'auto') localStorage.removeItem('v3-time'); else localStorage.setItem('v3-time', choice); } catch (err) {}
      applyTime(choice);
      closeTabs();
    });
  });
  document.addEventListener('click', closeTabs);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeTabs(); });
  setInterval(function () { if (root.dataset.timeChoice === 'auto') applyTime('auto'); }, 60000);

  // Click sounds, made with Web Audio (no files), after directoryyy.com: the nav plays
  // a two-note chime with a short echo, every other button or link a soft press.
  var SOUNDS = {
    chime: { gain: .5, layers: [
      { type: 'tone', freq: 1046.5, attack: .006, decay: .22, peak: .09 },
      { type: 'tone', freq: 1568, offset: .09, attack: .006, decay: .26, peak: .08 }
    ], echo: { delay: .12, feedback: .25, wet: .18, lowpass: 4000 } },
    tick: { gain: .55, layers: [
      { type: 'noise', filter: 'bandpass', freq: 3200, q: 1.6, attack: .001, decay: .035, peak: .22 },
      { type: 'tone', freq: 1760, attack: .002, decay: .06, peak: .05 }
    ] },
    press: { gain: .4, layers: [
      { type: 'noise', filter: 'bandpass', freq: 1700, q: 1.4, attack: .001, decay: .02, peak: .13 }
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
          src.connect(g);
        } else {
          var n = Math.max(1, Math.floor((end - t) * c.sampleRate)), buf = c.createBuffer(1, n, c.sampleRate), data = buf.getChannelData(0);
          for (var i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
          src = c.createBufferSource(); src.buffer = buf;
          var f = c.createBiquadFilter(); f.type = l.filter; f.frequency.value = l.freq; f.Q.value = l.q;
          src.connect(f).connect(g);
        }
        g.connect(out); src.start(t); src.stop(end);
      });
    };
    if (c.state === 'running') go(); else c.resume().then(function () { if (c.state === 'running') go(); }, function () {});
  }
  // Browsers only allow sound after the first tap, click or key press: wake the audio then,
  // so the scroll ticks that follow can be heard
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, function wake() { var c = audio(); if (c && c.state !== 'running') c.resume(); window.removeEventListener(ev, wake); }, { passive: true });
  });
  document.addEventListener('click', function (e) {
    var el = e.target instanceof Element && e.target.closest('button, a[href], summary, [role="button"]');
    if (!el || el.matches(':disabled')) return;
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
  // Home page: sections stack, only the current one shows (styles-v3.css)
  var stack = document.querySelectorAll('[data-stack]');
  if (stack.length) document.documentElement.classList.add('stack-on');
  // a section taller than most of the screen can't hold its place, so it scrolls as usual
  // each pinned section sits with its middle level with the middle of the nav list
  function measure() {
    // measured inside the nav, which is pinned to the top of the screen once the page scrolls
    var nav = document.querySelector('.v3-nav'), g = document.querySelector('.nav-group');
    var mid = nav && g && g.offsetHeight ? g.getBoundingClientRect().top - nav.getBoundingClientRect().top + g.offsetHeight / 2 : window.innerHeight / 2;
    var v3 = document.querySelector('.v3'), v3Top = v3 ? v3.getBoundingClientRect().top + window.scrollY : 0;
    stack.forEach(function (s, i) {
      var h = s.offsetHeight;
      if (i === 0) {   // Home: pushed down so it opens level with the middle of the nav
        s.style.paddingTop = '0px'; h = s.offsetHeight;   // padding, as the intro's own margin would swallow a margin
        var top = s.getBoundingClientRect().top + window.scrollY;
        var pad = Math.max(0, Math.round(v3Top + mid - h / 2 - top));
        s.style.paddingTop = pad + 'px';
        s.style.setProperty('--stack-top', Math.round(mid - h / 2 - pad) + 'px');   // pinned, the content (not the padding) stays centred
        s.classList.toggle('is-tall', h > window.innerHeight * .78);
        return;
      }
      if (i === stack.length - 1) s.style.marginBottom = Math.max(0, Math.round(window.innerHeight - mid - h / 2)) + 'px';
      s.classList.toggle('is-tall', h > window.innerHeight * .78);
      s.style.setProperty('--stack-top', Math.max(24, Math.round(mid - h / 2)) + 'px');
    });
  }
  if (stack.length) { measure(); window.addEventListener('resize', measure); if (document.fonts) document.fonts.ready.then(measure); }
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
    if (pinned) return;
    var current = first;
    sections.forEach(function (s) { if (s.getBoundingClientRect().top < window.innerHeight * 0.45) current = s.id; });
    // At the very bottom the last section can't reach the line, so mark it anyway
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = sections[sections.length - 1].id;
    setActive(current, true);
  }
  window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(spy); } }, { passive: true });
  spy();
})();
