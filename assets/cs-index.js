/* Case-study index: a quiet column of ticks at the right edge, one per section.
   Built from the page's own sections: every <section class="cs-section"> with an id, named by its
   .cs-label (or data-index="Short name" on the section to override). The current tick grows and
   fills as you read through that section; names show on hover, and the new section's name shows
   briefly whenever you cross into it. Styles live in assets/cs-v3.css (.cs-index). */
(function () {
  var secs = [].slice.call(document.querySelectorAll('section.cs-section[id]'));
  if (secs.length < 3) return;

  var nav = document.createElement('nav');
  nav.className = 'cs-index';
  nav.setAttribute('aria-label', 'Sections of this case study');
  var ol = document.createElement('ol');
  var links = secs.map(function (s) {
    var label = s.querySelector('.cs-label');
    var name = (s.dataset.index || (label && label.textContent) || s.id).trim();
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#' + s.id;
    a.innerHTML = '<span class="ci-tick" aria-hidden="true"><i></i></span><span class="ci-name"></span>';
    a.querySelector('.ci-name').textContent = name;
    li.appendChild(a);
    ol.appendChild(li);
    return a;
  });
  nav.appendChild(ol);
  document.body.appendChild(nav);

  var cur = -1, ready = false, hideT, queued = false;
  function update() {
    queued = false;
    var line = window.innerHeight * 0.4, i = -1;
    secs.forEach(function (s, k) { if (s.getBoundingClientRect().top < line) i = k; });
    // the last section can't always reach the line: at the very bottom, mark it anyway
    var atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atEnd) i = secs.length - 1;
    nav.classList.toggle('is-on', i >= 0);
    if (i >= 0) {
      var r = secs[i].getBoundingClientRect();
      var p = atEnd ? 1 : Math.min(1, Math.max(0, (line - r.top) / Math.max(1, r.height)));
      links[i].style.setProperty('--p', p.toFixed(3));
    }
    if (i === cur) return;
    links.forEach(function (a, k) {
      a.classList.toggle('is-active', k === i);
      a.classList.toggle('is-past', k < i);
      if (k === i) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
    // name the new section for a moment (not on first load)
    if (ready && i >= 0) {
      // the same soft tick the home nav plays when you scroll into a new section (assets/v3.js)
      // (only between sections, not when the index first appears)
      if (cur >= 0 && window.v3Sound) window.v3Sound('tick');
      if (cur >= 0 && navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate(8);
      nav.classList.add('is-telling');
      clearTimeout(hideT);
      hideT = setTimeout(function () { nav.classList.remove('is-telling'); }, 1600);
    }
    cur = i;
  }
  window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
  ready = true;
})();
