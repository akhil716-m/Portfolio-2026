/* v3 shared behaviour for every v3 page: the time-of-day setting (cover mood + theme), click / scroll sounds, and the
   left nav (a dot that springs to the section in view). Pages mark their nav links with
   data-spy="<id>" and the matching sections with data-section; the first link stands
   for the top of the page. Page-specific scripts stay inline in each page. */
(function () {
  var root = document.documentElement;

  // Time of day: one setting for the whole site, shown as tabs (the selected one is named).
  // Auto (the default) follows the visitor's clock; a pick is remembered, and picking the tab
  // for the visitor's own time goes back to Auto. It sets the cover's mood and the theme that goes with it:
  // morning and afternoon white, evening paper, night dark.
  var MOOD_THEME = { morning: 'white', afternoon: 'white', evening: 'paper', night: 'dark' };
  var GREETS = { morning: 'Good morning.', afternoon: 'Good afternoon.', evening: 'Good evening.', night: 'Hello, night owl.' };
  var timeBtns = document.querySelectorAll('[data-set-time]');
  function moodNow() {
    var h = new Date().getHours();
    return h >= 5 && h < 11 ? 'morning' : h < 16 ? 'afternoon' : h < 19 ? 'evening' : 'night';
  }
  function applyTime(choice) {
    var mood = choice === 'auto' ? moodNow() : choice, theme = MOOD_THEME[mood];
    root.dataset.timeChoice = choice;
    root.dataset.mood = mood;
    timeBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.setTime === mood); });
    document.querySelectorAll('[data-greet]').forEach(function (el) { el.textContent = GREETS[mood]; });
    if (root.dataset.theme !== theme) {
      root.dataset.theme = theme;
      document.dispatchEvent(new CustomEvent('v3:theme', { detail: theme }));
    }
  }
  applyTime(root.dataset.timeChoice || 'auto');
  timeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      // the tab for the visitor's own time of day means Auto again
      var choice = b.dataset.setTime === moodNow() ? 'auto' : b.dataset.setTime;
      try { if (choice === 'auto') localStorage.removeItem('v3-time'); else localStorage.setItem('v3-time', choice); } catch (e) {}
      applyTime(choice);
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
    tick: { gain: .4, layers: [
      { type: 'noise', filter: 'bandpass', freq: 5400, q: 1.8, attack: .001, decay: .018, peak: .14 },
      { type: 'tone', freq: 2600, attack: .001, decay: .012, peak: .018 }
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
  document.addEventListener('click', function (e) {
    var el = e.target instanceof Element && e.target.closest('button, a[href], summary, [role="button"]');
    if (!el || el.matches(':disabled')) return;
    var tag = el.closest('[data-sound]');
    var kind = tag ? tag.getAttribute('data-sound') : 'press';
    if (kind !== 'off') play(kind === 'chime' ? 'chime' : 'press');
  }, true);

  // Nav dot: sits 8px after the current label and, when the section changes, springs
  // along a slight curve to the new one (spring 200 / damping 24, 45ms delay)
  var group = document.querySelector('.nav-group');
  var dot = document.querySelector('.nav-dot');
  var dotPos = null, dotAnim = 0;
  function target(a) {
    var label = a.querySelector('span');
    return { x: label.offsetLeft + label.offsetWidth + 8, y: a.offsetTop + (a.offsetHeight - 7) / 2 };
  }
  function place(p) { dot.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)'; }
  function moveDot(a) {
    if (!dot || getComputedStyle(dot).display === 'none') return;
    var to = target(a);
    if (!dotPos || matchMedia('(prefers-reduced-motion: reduce)').matches) { dotPos = to; place(to); return; }
    var from = { x: dotPos.x, y: dotPos.y };
    var dx = to.x - from.x, dy = to.y - from.y;
    // control point pushed sideways so the dot arcs out to the right on the way down
    var bend = .35 * (dy > 0 ? 1 : -1);
    var ctrl = { x: (from.x + to.x) / 2 + Math.abs(dy) * Math.abs(bend), y: (from.y + to.y) / 2 - dx * bend };
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
    }
    active = id;
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
