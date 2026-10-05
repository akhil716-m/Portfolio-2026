/* Case-study preview: carries the theme picked on the home preview inside a case study.
   The case study stays neutral (white and grey on dark, ink and grey on light) and the
   project's own cover colour shows up only in a few places, or everywhere, or nowhere,
   to compare. The hero can take a faint version of the cover's dither. Preview only. */
import { mountShader } from './shaders.js';
import { THEMES, PALETTES, PROJECTS, R, rgb, paintTheme, loadShared, saveShared } from './fx/fx-core.js';

const project = PROJECTS[document.documentElement.dataset.fxProject];
// inside stays neutral; if Sand was picked on the home page, it's the neutral's third colour
const NEUTRAL = loadShared().acc === 'sand' ? PALETTES.sand : PALETTES.ink;

const INSIDE = { neutral: 'Neutral', touches: 'Few touches', project: 'Project' };
const HERO = { off: 'Off', glow: 'Glow', dither: 'Dither' };

const shared = loadShared();
const state = {
  theme: THEMES[shared.theme] ? shared.theme : 'paper',
  inside: INSIDE[shared.inside] ? shared.inside : 'touches',
  hero: HERO[shared.caseHero] ? shared.caseHero : 'glow',
};

// The few places the project colour is allowed when "Few touches" is on: the hero,
// the reading-progress bar, and the small section labels. Everything else is neutral.
const css = `
html[data-inside="touches"] :is(.cs-hero, #cs-progress, .cs-label) { --accent: var(--proj); --acc-rgb: var(--proj-rgb); }
html[data-hero="glow"] .cs-hero::before { background: radial-gradient(ellipse 60% 55% at 85% 5%, rgb(var(--proj-rgb) / .16), transparent 70%); }
html[data-fx-theme="dark"][data-hero="glow"] .cs-hero::before { background: radial-gradient(ellipse 60% 55% at 85% 5%, rgb(var(--proj-rgb) / .12), transparent 70%); }
html[data-hero="off"] .cs-hero::before { display: none; }
html[data-hero="dither"] .cs-hero::before { display: none; }
.fx-cs-layer { position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: .9;
  -webkit-mask-image: radial-gradient(ellipse 60% 75% at 100% 0%, black 25%, transparent 72%);
  mask-image: radial-gradient(ellipse 60% 75% at 100% 0%, black 25%, transparent 72%); }
html[data-fx-theme="dark"] .fx-cs-layer { opacity: .55; }

.fxp { position: fixed; left: 16px; bottom: 16px; z-index: 9999; width: 320px; padding: 12px 12px 10px; color-scheme: dark;
  border: 1px solid rgba(255,255,255,.1); border-radius: 12px; background: rgba(14,14,14,.88);
  -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); box-shadow: 0 20px 40px -20px rgba(0,0,0,.5);
  font: 400 11px/1.4 'Geist Mono', monospace; color: #8a8a8a; }
.fxp-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; color: #ededed; gap: 8px; }
.fxp-head a { color: #8a8a8a; text-decoration: none; margin-left: auto; }
.fxp-head a:hover { color: #ededed; }
.fxp button { font: inherit; cursor: pointer; border: 1px solid rgba(255,255,255,.1); background: transparent; color: #8a8a8a; border-radius: 6px; padding: 3px 7px; }
.fxp button:hover { color: #ededed; border-color: rgba(255,255,255,.25); }
.fxp-row { display: grid; grid-template-columns: 64px 1fr; align-items: center; gap: 8px; padding: 4px 0; }
.fxp-opts { display: flex; flex-wrap: wrap; gap: 4px; }
.fxp-opts button[aria-pressed="true"] { background: #ededed; border-color: #ededed; color: #0a0a0a; }
.fxp-now { margin-top: 6px; display: flex; align-items: center; gap: 8px; color: #ededed; }
.fxp-now i { width: 10px; height: 10px; border-radius: 50%; background: var(--c); }
.fxp.is-min .fxp-row, .fxp.is-min .fxp-now { display: none; }
.fxp.is-min .fxp-head { margin: 0; }
@media (max-width: 600px) { .fxp { left: 8px; right: 8px; bottom: 8px; width: auto; } }
`;
document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);

let heroMount = null;
let layer = null;

async function render() {
  const t = THEMES[state.theme];
  const pa = t.dark ? project.dark : project.light;
  // neutral everywhere, unless "Project" puts the cover colour on every accent
  paintTheme(state.theme, state.inside === 'project' ? project : NEUTRAL);
  const root = document.documentElement;
  root.style.setProperty('--proj', pa);
  root.style.setProperty('--proj-rgb', rgb(pa));
  root.dataset.inside = state.inside;
  root.dataset.hero = state.hero;

  if (heroMount) { heroMount.dispose(); heroMount = null; }
  if (state.hero === 'dither') {
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'fx-cs-layer';
      layer.setAttribute('aria-hidden', 'true');
      document.querySelector('.cs-hero').prepend(layer);
    }
    layer.hidden = false;
    const [kind, params] = R.C(project, t, pa);
    try { heroMount = await mountShader(layer, kind, { ...params, colorBack: '#00000000' }); }
    catch (err) { console.warn('Hero shader not mounted', err); }
  } else if (layer) {
    layer.hidden = true;
  }
  saveShared({ theme: state.theme, inside: state.inside, caseHero: state.hero });
  sync();
}

const row = (group, label, opts) => `<div class="fxp-row" data-group="${group}"><span>${label}</span><div class="fxp-opts">
  ${Object.entries(opts).map(([k, l]) => `<button type="button" data-v="${k}">${l}</button>`).join('')}</div></div>`;

const panel = document.createElement('div');
panel.className = 'fxp';
panel.innerHTML = `<div class="fxp-head"><span>Inside preview</span><a href="/lab-home">← Home preview</a><button type="button" data-min aria-label="Collapse">–</button></div>
  ${row('theme', 'Theme', Object.fromEntries(Object.entries(THEMES).map(([k, t]) => [k, t.label])))}
  ${row('inside', 'Colour', INSIDE)}
  ${row('hero', 'Hero', HERO)}
  <div class="fxp-now"><i></i><span></span></div>`;
document.body.append(panel);

function sync() {
  panel.querySelectorAll('[data-group]').forEach(g => {
    g.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(state[g.dataset.group] === b.dataset.v)));
  });
  const t = THEMES[state.theme];
  const pa = t.dark ? project.dark : project.light;
  panel.querySelector('.fxp-now i').style.setProperty('--c', pa);
  panel.querySelector('.fxp-now span').textContent = `${project.label} ${pa}`;
}

let queue = Promise.resolve();
panel.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.hasAttribute('data-min')) { panel.classList.toggle('is-min'); b.textContent = panel.classList.contains('is-min') ? '+' : '–'; return; }
  const group = b.closest('[data-group]')?.dataset.group;
  if (!group) return;
  state[group] = b.dataset.v;
  queue = queue.then(render).catch(err => console.warn(err));
});

queue = queue.then(render);
