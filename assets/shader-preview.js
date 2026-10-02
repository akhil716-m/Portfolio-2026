/* Shader + colour preview: a floating switcher on home-v2-fx.html that tries, live and
   in place, a theme (dark or one of two light grounds), an accent colour, and a shader
   per zone (hero, covers, explorations, about, closing). Every shader is rebuilt from
   the chosen accent and theme. The choice is kept in the URL hash, so a reload or a
   shared link shows the same mix. Preview only: not loaded by the real pages. */
import { mountShader } from './shaders.js';

const T = '#00000000'; // transparent, so the page itself shows through

// Grounds. Paper is the warm off-white from the Fork reference; Mist is its cool twin.
const THEMES = {
  dark:  { label: 'Dark',  dark: true,  bg: '#0a0a0a', bgSoft: '#131313', card: '#161616', line: '#1f1f1f', lineSoft: '#181818',
           text: '#ededed', soft: '#8a8a8a', muted: '#7a7a7a', fg: '255 255 255',
           surf: ['#0c0c0c', '#121212', '#161616', '#1c1c1c'], ln: ['#1f1f1f', '#2a2a2a', '#3a3a3a'], sh: '0 0 0', shk: 1 },
  paper: { label: 'Paper', dark: false, bg: '#f3f0e8', bgSoft: '#ece8de', card: '#faf8f3', line: '#e2ddd1', lineSoft: '#e9e5db',
           text: '#16130f', soft: '#5f584e', muted: '#776f63', fg: '22 19 15',
           surf: ['#f8f6f0', '#efebe2', '#fbfaf6', '#ebe6dc'], ln: ['#e2ddd1', '#d8d2c4', '#c9c1b1'], sh: '60 45 25', shk: 0.22 },
  mist:  { label: 'Mist',  dark: false, bg: '#eef0f3', bgSoft: '#e6e9ed', card: '#f7f8fa', line: '#dde1e7', lineSoft: '#e5e8ec',
           text: '#121419', soft: '#565d68', muted: '#6b727d', fg: '18 20 25',
           surf: ['#f5f6f8', '#e9ecf0', '#fafbfc', '#e4e7ec'], ln: ['#dde1e7', '#d1d6de', '#c1c7d1'], sh: '30 40 60', shk: 0.2 },
};

// Accents. `dark` is the accent on the dark ground, `light` a deeper one that reads on
// the light grounds; soft/mid/ink are its tints; `wash` is a pastel set for the shaders.
const PALETTES = {
  lime:    { label: 'Lime',    dark: '#d4ff5e', light: '#5c7a00', soft: '#e9f7b6', mid: '#4a5a24', ink: '#1c2410', wash: ['#eef6d2', '#d3e89a', '#f6f8ec', '#b5d65a'] },
  ember:   { label: 'Ember',   dark: '#ff7a3d', light: '#e2561c', soft: '#ffd9c4', mid: '#a8461b', ink: '#2a1006', wash: ['#ffe1cf', '#ffb08a', '#fff2ea', '#ff8a52'] },
  apricot: { label: 'Apricot', dark: '#ffb38a', light: '#d9692f', soft: '#ffe3d1', mid: '#b4612f', ink: '#2b1608', wash: ['#ffd9c2', '#e6d6ff', '#fff4ec', '#cfe6ff'] },
  rose:    { label: 'Rose',    dark: '#f0739a', light: '#d5567d', soft: '#f6d3de', mid: '#9c3558', ink: '#2a0a17', wash: ['#f6d3de', '#eeb0c4', '#fcf0f4', '#e58aa8'] },
  iris:    { label: 'Iris',    dark: '#9d91ff', light: '#6a5cf0', soft: '#ddd8ff', mid: '#4b40b0', ink: '#120e33', wash: ['#e2ddff', '#c0b6ff', '#f5f3ff', '#9d91ff'] },
  cobalt:  { label: 'Cobalt',  dark: '#6f8cff', light: '#2f54eb', soft: '#d3dcff', mid: '#2440b0', ink: '#081333', wash: ['#dae2ff', '#a9bbff', '#f2f5ff', '#7b95ff'] },
  sage:    { label: 'Sage',    dark: '#7fd1a0', light: '#2f8a5b', soft: '#d6eedf', mid: '#2f6b4a', ink: '#0b2216', wash: ['#dcefe3', '#b0dcc0', '#f1f8f3', '#86c9a0'] },
};

// The lab's letters as recipes: (palette, theme, accent) → [kind, params]
const R = {
  A: (p, t, a) => ['grain', t.dark
    ? { shape: 'corners', colorBack: t.bg, colors: [a, p.mid, p.ink], softness: 0.75, intensity: 0.28, noise: 0.4 }
    : { shape: 'corners', colorBack: p.wash[2], colors: [p.wash[3], p.wash[1], p.wash[0]], softness: 0.8, intensity: 0.25, noise: 0.3 }],
  B: (p, t, a) => ['grain', { shape: 'blob', scale: 1.2, softness: 0.85, intensity: 0.2, noise: 0.45, ...(t.dark
    ? { colorBack: t.bg, colors: [a, p.soft, p.mid] }
    : { colorBack: p.wash[2], colors: [p.wash[3], p.wash[1], p.wash[0]] }) }],
  C: (p, t, a) => ['dither', { shape: 'warp', type: '4x4', size: 2, speed: 0.25, ...(t.dark
    ? { colorBack: p.ink, colorFront: a + 'b0' }
    : { colorBack: p.wash[2], colorFront: p.wash[3] }) }],
  D: (p, t, a) => ['dither', { shape: 'sphere', type: '8x8', size: 3, scale: 0.9, speed: 0.35, colorBack: t.bg, colorFront: a }],
  E: (p, t, a) => ['dots', { colorBack: T, colorFill: t.dark ? a : p.mid, size: 1.4, gapX: 24, gapY: 24, sizeRange: 0.7, opacityRange: 0.95 }],
  F: (p, t, a) => ['rays', t.dark
    ? { colorBack: T, colorBloom: a, colors: [a + '33', a + '66', p.soft, p.mid], offsetY: -1.05, intensity: 0.32, density: 0.18, spotty: 0.5, midIntensity: 0.2, bloom: 0.22, speed: 0.25 }
    : { colorBack: T, colorBloom: p.wash[3], colors: [a + '40', p.wash[3] + 'aa', '#ffffff', p.wash[1]], offsetY: -1.05, intensity: 0.5, density: 0.2, spotty: 0.5, midIntensity: 0.3, bloom: 0.35, speed: 0.25 }],
  G: (p, t) => ['grain', { shape: 'wave', colorBack: t.bg, softness: 0.95, intensity: 0.1, noise: 0.45, scale: 1.6, rotation: -12,
    colors: t.dark ? [p.ink, p.mid, p.ink] : [p.wash[2], p.wash[3], p.wash[2]] }],
  H: (p, t, a) => ['grain', { shape: 'corners', colorBack: T, softness: 0.9, intensity: 0.15, noise: 0.3, scale: 1.6,
    colors: t.dark ? [a, p.mid, T] : [p.wash[3], p.wash[1], T] }],
  M: (p, t) => ['mesh', t.dark
    ? { colors: [p.ink, t.bg, p.mid, p.ink], distortion: 0.8, swirl: 0.1, grainOverlay: 0.15, speed: 0.2 }
    : { colors: p.wash, distortion: 0.8, swirl: 0.15, grainMixer: 0.2, grainOverlay: 0.12, speed: 0.2 }],
};
const NAMES = { A: 'Grain corners', B: 'Grain blob', C: 'Dither warp', D: 'Dither sphere', E: 'Dot grid', F: 'God rays', G: 'Grain wave', H: 'Ambient glow', M: 'Mesh gradient' };

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

const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(' ');

const state = { theme: 'dark', acc: 'lime', fx: {} };
const mounts = {};

function paint() {
  const t = THEMES[state.theme], p = PALETTES[state.acc];
  const a = t.dark ? p.dark : p.light;
  const vars = {
    '--bg': t.bg, '--bg-rgb': rgb(t.bg), '--bg-soft': t.bgSoft, '--bg-card': t.card, '--line': t.line, '--line-soft': t.lineSoft,
    '--text': t.text, '--text-soft': t.soft, '--text-muted': t.muted, '--fg-rgb': t.fg, '--sh-rgb': t.sh, '--sh-k': t.shk,
    '--surf-1': t.surf[0], '--surf-2': t.surf[1], '--surf-3': t.surf[2], '--surf-4': t.surf[3],
    '--ln-1': t.ln[0], '--ln-2': t.ln[1], '--ln-3': t.ln[2],
    '--accent': a, '--acc-rgb': rgb(a), '--acc-soft': p.soft, '--acc-mid': p.mid, '--acc-ink': p.ink,
    '--on-accent': t.dark ? p.ink : '#ffffff', '--glow': `rgb(${rgb(a)} / 0.15)`,
    '--tray': t.dark ? p.ink : p.wash[2],
  };
  const s = document.documentElement.style;
  Object.entries(vars).forEach(([k, v]) => s.setProperty(k, v));
  s.colorScheme = t.dark ? 'dark' : 'light';
  document.documentElement.dataset.fxTheme = state.theme;
}

async function apply(zone, letter) {
  (mounts[zone.id] || []).forEach(m => m.dispose());
  mounts[zone.id] = [];
  const els = zone.targets().filter(Boolean);
  els.forEach(el => { el.classList.remove('fx-on'); el.removeAttribute('data-fx'); });
  state.fx[zone.id] = letter || '';
  if (!letter) return;
  const t = THEMES[state.theme], p = PALETTES[state.acc];
  const [kind, params] = R[letter](p, t, t.dark ? p.dark : p.light);
  for (const el of els) {
    el.classList.add('fx-on');
    el.dataset.fx = letter;
    try { mounts[zone.id].push(await mountShader(el, kind, params)); }
    catch (err) { console.warn('Shader not mounted', zone.id, letter, err); }
  }
}

// changes run one after another, so quick clicks never leave a stray canvas behind
let queue = Promise.resolve();
const run = fn => (queue = queue.then(fn).then(() => { write(); sync(); }).catch(err => console.warn(err)));
const remountAll = async () => { for (const z of ZONES) await apply(z, state.fx[z.id]); };

// state lives in the hash: #theme=paper&acc=ember&fx=hero:H,covers:A,...
function read() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (THEMES[h.get('theme')]) state.theme = h.get('theme');
  if (PALETTES[h.get('acc')]) state.acc = h.get('acc');
  const fx = h.get('fx');
  ZONES.forEach(z => { state.fx[z.id] = z.rec; });
  if (fx !== null) fx.split(',').forEach(pair => { const [k, v] = pair.split(':'); if (k in state.fx) state.fx[k] = R[v] ? v : ''; });
}
function write() {
  const fx = ZONES.map(z => `${z.id}:${state.fx[z.id] || ''}`).join(',');
  history.replaceState(null, '', `#theme=${state.theme}&acc=${state.acc}&fx=${fx}`);
}

const css = `
html { transition: background-color .4s ease; }
.fx-hero-layer { position: absolute; top: 0; bottom: 0; left: calc(50% - 50vw); width: 100vw; z-index: -2; pointer-events: none;
  -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent); mask-image: linear-gradient(to bottom, black 60%, transparent); }
.fx-hero-layer:not(.fx-on) { display: none; }
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
  <div class="fxp-row fxp-row--sep" data-group="acc"><span>Colour</span><div class="fxp-opts">
    ${Object.entries(PALETTES).map(([k, p]) => `<button type="button" class="fxp-sw" data-v="${k}" title="${p.label}" aria-label="${p.label}"></button>`).join('')}
  </div></div>
  ${ZONES.map(z => `<div class="fxp-row" data-zone="${z.id}"><span>${z.label}</span><div class="fxp-opts">
    <button type="button" data-l="">Off</button>
    ${z.letters.map(l => `<button type="button" data-l="${l}" title="${NAMES[l]}"${l === z.rec ? ' class="is-rec"' : ''}>${l}</button>`).join('')}
  </div></div>`).join('')}
  <div class="fxp-now"></div>
  <div class="fxp-foot"><button type="button" data-preset="rec">Recommended •</button><button type="button" data-preset="off">All off</button></div>`;
document.body.append(panel);

function sync() {
  const t = THEMES[state.theme];
  panel.querySelectorAll('[data-group="theme"] button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === state.theme)));
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
