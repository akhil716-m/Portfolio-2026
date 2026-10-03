/* Shader + colour preview: a floating switcher on home-v2-fx.html that tries, live and
   in place, a theme (dark or one of two light grounds), an accent colour, and a shader
   per zone (hero, covers, explorations, about, closing). Every shader is rebuilt from
   the chosen accent and theme. The choice is kept in the URL hash, so a reload or a
   shared link shows the same mix. Preview only: not loaded by the real pages. */
import { mountShader } from './shaders.js';
import { THEMES, PALETTES, PROJECTS, projectOf, PROJ_MODES, R, NAMES, rgb, paintTheme, loadShared, saveShared } from './fx/fx-core.js';


// Zones: where the canvas goes, which letters make sense there, and the recommended pick
const ZONES = [
  { id: 'hero', label: 'Hero', letters: ['H', 'M', 'F', 'E'], rec: 'H', targets: () => [heroLayer()] },
  { id: 'covers', label: 'Covers', letters: ['A', 'B', 'C', 'M', 'G', 'D'], rec: 'A', targets: () => [...document.querySelectorAll('.t-media')] },
  { id: 'x', label: 'Explorations', letters: ['A', 'C', 'E', 'M', 'H'], rec: 'E', targets: () => [document.querySelector('.x-panel')] },
  { id: 'about', label: 'About', letters: ['E', 'H', 'M'], rec: 'E', targets: () => [document.querySelector('.fig')] },
  { id: 'close', label: 'Closing', letters: ['F', 'M', 'D', 'H'], rec: 'F', targets: () => [document.querySelector('.contact')] },
];

// The hero is contained at 1400px, so its shader sits on a full-bleed layer inside it
let heroEl;
function heroLayer() {
  if (!heroEl) {
    heroEl = document.createElement('div');
    heroEl.className = 'fx-hero-layer';
    heroEl.setAttribute('aria-hidden', 'true');
    document.querySelector('.hero').prepend(heroEl);
  }
  return heroEl;
}




const state = { theme: 'dark', acc: 'lime', proj: 'covers', spread: 1.4, fx: {} };
// Hero glow: the shader's own zoom, plus a fixed turn and shift for the corner glow
// (H). Measured over its full motion cycle, the original placement put light up to
// ~125/255 behind the headline; turned -10° and moved right 0.45 / up 0.25 (zoom 1.4),
// the headline peaks at 9–16 at 1280–1440px wide while the corner light stays.
const HERO_PLACE = { H: { rotation: -10, offsetX: 0.45, offsetY: 0.25 } };
const SPREADS = ['H', 'M'];
const mounts = {};

function paint() {
  paintTheme(state.theme, PALETTES[state.acc]);
  document.documentElement.dataset.fxAcc = state.acc;
}

async function apply(zone, letter) {
  (mounts[zone.id] || []).forEach(m => m.dispose());
  mounts[zone.id] = [];
  const els = zone.targets().filter(Boolean);
  els.forEach(el => { el.classList.remove('fx-on'); el.removeAttribute('data-fx'); el.style.removeProperty('--tray'); });
  if (zone.id === 'covers') tintMoments();
  state.fx[zone.id] = letter || '';
  if (!letter) return;
  const t = THEMES[state.theme];
  for (const el of els) {
    // covers take their project's tone unless per-project colour is off
    const p = (zone.id === 'covers' && state.proj !== 'off' && projectOf(el)) || PALETTES[state.acc];
    const [kind, base] = R[letter](p, t, t.dark ? p.dark : p.light);
    const params = zone.id === 'hero' && SPREADS.includes(letter) ? { ...base, ...HERO_PLACE[letter], scale: state.spread } : base;
    if (p !== PALETTES[state.acc]) el.style.setProperty('--tray', t.dark ? p.ink : p.wash[2]);
    el.classList.add('fx-on');
    el.dataset.fx = letter;
    try { mounts[zone.id].push(await mountShader(el, kind, params)); }
    catch (err) { console.warn('Shader not mounted', zone.id, letter, err); }
  }
}

// "Covers + text": each project's sentence, node and button take its own tone too
function tintMoments() {
  const t = THEMES[state.theme];
  document.querySelectorAll('.t-moment').forEach(m => {
    const media = m.querySelector('.t-media');
    const p = state.proj === 'text' && media && projectOf(media);
    if (p) {
      const a = t.dark ? p.dark : p.light;
      m.style.setProperty('--accent', a);
      m.style.setProperty('--acc-rgb', rgb(a));
      m.dataset.tinted = '';
    } else {
      delete m.dataset.tinted;
      m.style.removeProperty('--accent');
      m.style.removeProperty('--acc-rgb');
    }
  });
}

// changes run one after another, so quick clicks never leave a stray canvas behind
let queue = Promise.resolve();
const run = fn => (queue = queue.then(fn).then(() => { write(); sync(); }).catch(err => console.warn(err)));
const remountAll = async () => { for (const z of ZONES) await apply(z, state.fx[z.id]); };

// state lives in the hash: #theme=paper&acc=ember&fx=hero:H,covers:A,...
function read() {
  // the hash wins; without one, pick up whatever was last chosen (here or inside a case study)
  const h = location.hash.length > 1 ? new URLSearchParams(location.hash.slice(1)) : new URLSearchParams(loadShared().home || '');
  if (THEMES[h.get('theme')]) state.theme = h.get('theme');
  if (PALETTES[h.get('acc')]) state.acc = h.get('acc');
  if (PROJ_MODES[h.get('proj')]) state.proj = h.get('proj');
  const sp = parseFloat(h.get('spread'));
  if (sp >= 0.6 && sp <= 1.8) state.spread = sp;
  const fx = h.get('fx');
  ZONES.forEach(z => { state.fx[z.id] = z.rec; });
  if (fx !== null) fx.split(',').forEach(pair => { const [k, v] = pair.split(':'); if (k in state.fx) state.fx[k] = R[v] ? v : ''; });
}
function write() {
  const fx = ZONES.map(z => `${z.id}:${state.fx[z.id] || ''}`).join(',');
  const q = `theme=${state.theme}&acc=${state.acc}&proj=${state.proj}&spread=${state.spread}&fx=${fx}`;
  history.replaceState(null, '', `#${q}`);
  saveShared({ theme: state.theme, acc: state.acc, proj: state.proj, home: q });
}

const css = `
html { transition: background-color .4s ease; }
.fx-hero-layer { position: absolute; top: 0; bottom: 0; left: calc(50% - 50vw); width: 100vw; z-index: -2; pointer-events: none;
  -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent); mask-image: linear-gradient(to bottom, black 60%, transparent); }
.fx-hero-layer:not(.fx-on) { display: none; }
/* keep the headline's intended break at every desktop width: "…that balance" /
   "complexity with care." Without it, mid-size screens pull "complexity" up and the
   first line runs into the top-right light */
@media (min-width: 761px) { .hero-title .quiet { display: block; } }
/* Neutral accent: the sentence goes grey and the key phrase carries the emphasis in
   white (ink on light), so the hierarchy holds without any colour */
html[data-fx-acc="ink"] .t-moment:not([data-tinted]) .t-line { color: var(--text-soft); }
html[data-fx-acc="ink"] .t-moment:not([data-tinted]) .t-line em { color: var(--text); font-weight: 500; }
.hero:has(.fx-hero-layer.fx-on)::before { opacity: 0.5; }

.t-media.fx-on { position: relative; background: var(--tray); }
.t-media.fx-on img { position: relative; width: 84%; height: auto; aspect-ratio: 16 / 9; margin: 9% auto 0; border-radius: 6px 6px 0 0;
  box-shadow: 0 30px 60px -24px rgb(var(--sh-rgb) / calc(.8 * var(--sh-k))), 0 0 0 1px rgb(var(--fg-rgb) / .06); }

.x-panel.fx-on { background-image: none; }
.x-panel.fx-on::before { display: none; }
.x-panel[data-fx="E"] > canvas { opacity: .4; }
.x-panel[data-fx="M"] > canvas, .x-panel[data-fx="H"] > canvas { opacity: .8; }

.fig.fx-on::before { display: none; }
.fig.fx-on > canvas { -webkit-mask-image: linear-gradient(to bottom, transparent, black 12%, black 88%, transparent);
  mask-image: linear-gradient(to bottom, transparent, black 12%, black 88%, transparent); opacity: .35; }
.fig[data-fx="M"] > canvas { opacity: .7; }

.contact.fx-on .cl-beam { display: none; }
.contact.fx-on > canvas { -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent);
  mask-image: linear-gradient(to bottom, black 50%, transparent); }
.contact[data-fx="D"] > canvas { opacity: .5; }

.fxp { position: fixed; left: 16px; bottom: 16px; z-index: 9999; width: 340px; padding: 12px 12px 10px; color-scheme: dark;
  border: 1px solid rgba(255,255,255,.1); border-radius: 12px; background: rgba(14,14,14,.88);
  -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); box-shadow: 0 20px 40px -20px rgba(0,0,0,.5);
  font: 400 11px/1.4 'Geist Mono', monospace; color: #8a8a8a; }
.fxp-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; color: #ededed; }
.fxp button { font: inherit; cursor: pointer; border: 1px solid rgba(255,255,255,.1); background: transparent; color: #8a8a8a; border-radius: 6px; padding: 3px 7px; }
.fxp button:hover { color: #ededed; border-color: rgba(255,255,255,.25); }
.fxp-range { align-items: center; gap: 8px; flex-wrap: nowrap; }
.fxp-range input { flex: 1; accent-color: #ededed; }
.fxp-range output { min-width: 32px; color: #ededed; }
.fxp-row { display: grid; grid-template-columns: 88px 1fr; align-items: center; gap: 8px; padding: 4px 0; }
.fxp-row--sep { margin-bottom: 4px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,.08); }
.fxp-opts { display: flex; flex-wrap: wrap; gap: 4px; }
.fxp-opts button { min-width: 28px; }
.fxp-opts button[aria-pressed="true"] { background: #ededed; border-color: #ededed; color: #0a0a0a; }
.fxp-opts button.is-rec::after { content: '•'; margin-left: 3px; }
.fxp-sw { width: 22px; height: 22px; min-width: 0 !important; padding: 0 !important; border-radius: 50% !important; background: var(--c) !important; }
.fxp-sw[aria-pressed="true"] { box-shadow: 0 0 0 2px #0e0e0e, 0 0 0 3.5px #ededed; }
.fxp-now { margin-top: 6px; color: #ededed; }
.fxp-foot { display: flex; gap: 6px; margin-top: 10px; }
.fxp.is-min .fxp-row, .fxp.is-min .fxp-foot, .fxp.is-min .fxp-now { display: none; }
.fxp.is-min .fxp-head { margin: 0; }
@media (max-width: 600px) { .fxp { left: 8px; right: 8px; bottom: 8px; width: auto; } }
`;
document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);

const panel = document.createElement('div');
panel.className = 'fxp';
panel.innerHTML = `<div class="fxp-head"><span>Colour + shader preview</span><button type="button" data-min aria-label="Collapse">–</button></div>
  <div class="fxp-row" data-group="theme"><span>Theme</span><div class="fxp-opts">
    ${Object.entries(THEMES).map(([k, t]) => `<button type="button" data-v="${k}">${t.label}</button>`).join('')}
  </div></div>
  <div class="fxp-row" data-group="acc"><span>Colour</span><div class="fxp-opts">
    ${Object.entries(PALETTES).map(([k, p]) => `<button type="button" class="fxp-sw" data-v="${k}" title="${p.label}" aria-label="${p.label}"></button>`).join('')}
  </div></div>
  <div class="fxp-row fxp-row--sep" data-group="proj"><span>Per project</span><div class="fxp-opts">
    ${Object.entries(PROJ_MODES).map(([k, l]) => `<button type="button" data-v="${k}">${l}</button>`).join('')}
  </div></div>
  ${ZONES.map(z => `<div class="fxp-row" data-zone="${z.id}"><span>${z.label}</span><div class="fxp-opts">
    <button type="button" data-l="">Off</button>
    ${z.letters.map(l => `<button type="button" data-l="${l}" title="${NAMES[l]}"${l === z.rec ? ' class="is-rec"' : ''}>${l}</button>`).join('')}
  </div></div>`).join('')}
  <div class="fxp-row" data-spread><span>Hero spread</span><div class="fxp-opts fxp-range">
    <input type="range" min="0.6" max="1.8" step="0.05" aria-label="Hero glow spread"><output></output></div></div>
  <div class="fxp-now"></div>
  <div class="fxp-foot"><button type="button" data-preset="rec">Recommended •</button><button type="button" data-preset="off">All off</button></div>`;
document.body.append(panel);

function sync() {
  const rg = panel.querySelector('[data-spread] input');
  rg.value = state.spread;
  panel.querySelector('[data-spread] output').textContent = state.spread.toFixed(2);
  panel.querySelector('[data-spread]').style.opacity = SPREADS.includes(state.fx.hero) ? '' : '.4';
  const t = THEMES[state.theme];
  panel.querySelectorAll('[data-group="theme"] button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === state.theme)));
  panel.querySelectorAll('[data-group="proj"] button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === state.proj)));
  panel.querySelectorAll('[data-group="acc"] button').forEach(b => {
    const p = PALETTES[b.dataset.v];
    b.style.setProperty('--c', t.dark ? p.dark : p.light);
    b.setAttribute('aria-pressed', String(b.dataset.v === state.acc));
  });
  panel.querySelectorAll('.fxp-row[data-zone]').forEach(row => {
    row.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String((state.fx[row.dataset.zone] || '') === b.dataset.l)));
  });
  const p = PALETTES[state.acc];
  panel.querySelector('.fxp-now').textContent = `${t.label} · ${p.label} ${t.dark ? p.dark : p.light}`;
}

// spread updates the live hero shader in place, no remount
const range = panel.querySelector('[data-spread] input');
range.addEventListener('input', () => {
  state.spread = parseFloat(range.value);
  if (SPREADS.includes(state.fx.hero)) (mounts.hero || []).forEach(m => m.setUniforms({ u_scale: state.spread }));
  sync();
});
range.addEventListener('change', () => write());

panel.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.hasAttribute('data-min')) { panel.classList.toggle('is-min'); b.textContent = panel.classList.contains('is-min') ? '+' : '–'; return; }
  const group = b.closest('[data-group]')?.dataset.group;
  if (group) {
    state[group] = b.dataset.v;
    run(async () => { paint(); await remountAll(); });
  } else if (b.dataset.preset) {
    run(async () => { for (const z of ZONES) await apply(z, b.dataset.preset === 'rec' ? z.rec : ''); });
  } else {
    const zone = ZONES.find(z => z.id === b.closest('.fxp-row').dataset.zone);
    run(() => apply(zone, b.dataset.l));
  }
});

read();
paint();
run(remountAll);
