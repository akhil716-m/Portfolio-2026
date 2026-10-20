/* Case-study outline (see assets/cs-toc.css). Upgrades the existing #cs-rail in place:
   each page's own script still decides the current section (li.is-active) and handles
   clicks; this file only draws the ruler, the thumb and the reading progress. */
(function () {
  var rail = document.getElementById('cs-rail');
  var list = document.getElementById('cs-rail-list');
  if (!rail || !list || !list.children.length) return;

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TICK = 7, MAJOR = 5, READ = 0.35; // reading line sits 35% down, like the section tracking
  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  rail.classList.add('cs-toc');
  var inner = rail.querySelector('.cs-rail-inner') || rail;

  var track = document.createElement('div');
  track.className = 'cs-toc-track';
  var ruler = document.createElement('div');
  ruler.className = 'cs-toc-ruler';
  ruler.setAttribute('aria-hidden', 'true');
  var thumb = document.createElement('span');
  thumb.className = 'cs-toc-thumb';
  thumb.setAttribute('aria-hidden', 'true');

  inner.insertBefore(track, list);
  track.appendChild(ruler);
  track.appendChild(thumb);
  track.appendChild(list);

  var sections = Array.prototype.map.call(list.querySelectorAll('li[data-id]'), function (li) {
    return { li: li, el: document.getElementById(li.getAttribute('data-id')) };
  }).filter(function (s) { return s.el; });
  if (!sections.length) return;

  function buildTicks() {
    var n = Math.floor(list.offsetHeight / TICK) + 1;
    if (ruler.childElementCount === n) return;
    var html = '';
    for (var i = 0; i < n; i++) html += '<span style="--y:' + i * TICK + ';--base:' + (i % MAJOR === 0 ? 8 : 4) + '"></span>';
    ruler.innerHTML = html;
  }

  var cur = { head: 0, top: 0, h: 0 }, tgt = { head: 0, top: 0, h: 0 }, first = true, frame = 0;

  function measure() {
    var idx = 0;
    sections.forEach(function (s, i) { if (s.li.classList.contains('is-active')) idx = i; });
    var s = sections[idx];
    var link = s.li.querySelector('button') || s.li;
    var base = list.getBoundingClientRect().top;
    var r = link.getBoundingClientRect();
    var line = window.innerHeight * READ;

    var through = 1;
    var next = sections[idx + 1];
    var a = s.el.getBoundingClientRect().top;
    if (next) {
      var b = next.el.getBoundingClientRect().top;
      through = clamp01((line - a) / Math.max(1, b - a));
    } else {
      // Last section: fills as the reading line travels from its top to the end of the page
      var top = window.scrollY + a;
      var end = document.documentElement.scrollHeight - window.innerHeight + line;
      through = clamp01((window.scrollY + line - top) / Math.max(1, end - top));
    }
    tgt.top = r.top - base + 4;
    tgt.h = Math.max(0, r.height - 8);
    tgt.head = r.top - base + through * r.height;
  }

  function paint() {
    ruler.style.setProperty('--head', cur.head.toFixed(1));
    thumb.style.transform = 'translateY(' + (cur.top + 4).toFixed(1) + 'px)';
    thumb.style.height = cur.h.toFixed(1) + 'px';
  }

  function tick() {
    frame = 0;
    if (!rail.classList.contains('is-visible')) return;
    measure();
    if (REDUCE || first) { cur.head = tgt.head; cur.top = tgt.top; cur.h = tgt.h; first = false; paint(); return; }
    var moving = false;
    ['head', 'top', 'h'].forEach(function (k) {
      var d = tgt[k] - cur[k];
      if (Math.abs(d) > 0.25) { cur[k] += d * 0.2; moving = true; } else cur[k] = tgt[k];
    });
    paint();
    if (moving) schedule();
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(tick); }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () { buildTicks(); schedule(); });
  new MutationObserver(function () { buildTicks(); schedule(); })
    .observe(rail, { attributes: true, subtree: true, attributeFilter: ['class'] });

  if (!REDUCE) {
    track.addEventListener('pointermove', function (e) {
      ruler.style.setProperty('--probe', String(e.clientY - list.getBoundingClientRect().top));
    });
    track.addEventListener('pointerleave', function () { ruler.style.setProperty('--probe', '-999'); });
  }

  buildTicks();
  schedule();
})();
