/* Resume preview: the resume in whatever theme and colour were picked on the home
   preview (shared through localStorage), with a small switcher to change them here
   too. White and grey carry the page; the chosen colour marks the download button,
   the active nav link and the design skills. Preview only. */
import { THEMES, PALETTES, rgb, paintTheme, loadShared, saveShared } from './fx/fx-core.js';

const shared = loadShared();
const state = {
  theme: THEMES[shared.theme] ? shared.theme : 'dark',
  acc: PALETTES[shared.acc] ? shared.acc : 'sand',
  page: shared.resumePage === 'dark' ? 'dark' : 'white', // what the résumé looks like when the theme is dark
};

// A résumé is read like a document, and a dark sheet leaves it with no hierarchy: grey text
// on near-black. So in dark mode the sheet itself can turn white (the page around it stays
// dark): a white sheet, near-black type, the accent deepened to read on white.
const SHEET = { '--bg-soft': '#ffffff', '--bg-card': '#fafafa', '--line': '#e4e4e7', '--line-soft': '#eeeef0',
  '--text': '#0f0f10', '--text-soft': '#52525b', '--text-muted': '#71717a', '--fg-rgb': '15 15 16', '--on-accent': '#ffffff' };
function paintSheet() {
  const doc = document.querySelector('.resume-doc');
  if (!doc) return;
  const white = state.theme === 'dark' && state.page === 'white';
  const p = PALETTES[state.acc];
  const vars = white ? { ...SHEET, '--accent': p.light, '--acc-rgb': rgb(p.light) } : {};
  [...Object.keys(SHEET), '--accent', '--acc-rgb'].forEach(k => white ? doc.style.setProperty(k, vars[k]) : doc.style.removeProperty(k));
  doc.style.color = white ? 'var(--text)' : '';
}

// The four skill groups used four fixed hues (lime, teal, blue, violet). In the new
// language only the design group takes the accent; the rest are quiet neutral pills.
const css = `
.pill-design   { background: rgb(var(--acc-rgb) / 0.08); color: var(--accent); border: 1px solid rgb(var(--acc-rgb) / 0.22); }
.pill-research,
.pill-tools,
.pill-ai       { background: rgb(var(--fg-rgb) / 0.04); color: var(--text-soft); border: 1px solid rgb(var(--fg-rgb) / 0.1); }

.fxp { position: fixed; left: 16px; bottom: 16px; z-index: 9999; width: 300px; padding: 12px 12px 10px; color-scheme: dark;
  border: 1px solid rgba(255,255,255,.1); border-radius: 12px; background: rgba(14,14,14,.88);
  -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); box-shadow: 0 20px 40px -20px rgba(0,0,0,.5);
  font: 400 11px/1.4 'Geist Mono', monospace; color: #8a8a8a; }
.fxp-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: #ededed; }
.fxp-head a { margin-left: auto; color: #8a8a8a; text-decoration: none; }
.fxp-head a:hover { color: #ededed; }
.fxp button { font: inherit; cursor: pointer; border: 1px solid rgba(255,255,255,.1); background: transparent; color: #8a8a8a; border-radius: 6px; padding: 3px 7px; }
.fxp button:hover { color: #ededed; border-color: rgba(255,255,255,.25); }
.fxp-row { display: grid; grid-template-columns: 56px 1fr; align-items: center; gap: 8px; padding: 4px 0; }
.fxp-opts { display: flex; flex-wrap: wrap; gap: 4px; }
.fxp-opts button[aria-pressed="true"] { background: #ededed; border-color: #ededed; color: #0a0a0a; }
.fxp-sw { width: 22px; height: 22px; padding: 0 !important; border-radius: 50% !important; background: var(--c) !important; }
.fxp-sw[aria-pressed="true"] { box-shadow: 0 0 0 2px #0e0e0e, 0 0 0 3.5px #ededed; }
.fxp-now { margin-top: 6px; color: #ededed; }
.fxp-row[hidden] { display: none; }
.fxp.is-min .fxp-row, .fxp.is-min .fxp-now { display: none; }
.fxp.is-min .fxp-head { margin: 0; }
@media (max-width: 600px) { .fxp { left: 8px; right: 8px; bottom: 8px; width: auto; } }
@media print { .fxp { display: none; } }
`;
document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);

const panel = document.createElement('div');
panel.className = 'fxp';
panel.innerHTML = `<div class="fxp-head"><span>Resume preview</span><a href="/home-v2-fx">← Home preview</a><button type="button" data-min aria-label="Collapse">–</button></div>
  <div class="fxp-row" data-group="theme"><span>Theme</span><div class="fxp-opts">
    ${Object.entries(THEMES).map(([k, t]) => `<button type="button" data-v="${k}">${t.label}</button>`).join('')}
  </div></div>
  <div class="fxp-row" data-group="page"><span>In dark</span><div class="fxp-opts">
    <button type="button" data-v="white">White sheet</button><button type="button" data-v="dark">Dark sheet</button>
  </div></div>
  <div class="fxp-row" data-group="acc"><span>Colour</span><div class="fxp-opts">
    ${Object.entries(PALETTES).map(([k, p]) => `<button type="button" class="fxp-sw" data-v="${k}" title="${p.label}" aria-label="${p.label}"></button>`).join('')}
  </div></div>
  <div class="fxp-now"></div>`;
document.body.append(panel);

function render() {
  const t = THEMES[state.theme], p = PALETTES[state.acc];
  paintTheme(state.theme, p);
  paintSheet();
  panel.querySelector('[data-group="page"]').hidden = state.theme !== 'dark';
  panel.querySelectorAll('[data-group="page"] button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === state.page)));
  panel.querySelectorAll('[data-group="theme"] button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === state.theme)));
  panel.querySelectorAll('[data-group="acc"] button').forEach(b => {
    const q = PALETTES[b.dataset.v];
    b.style.setProperty('--c', t.dark ? q.dark : q.light);
    b.setAttribute('aria-pressed', String(b.dataset.v === state.acc));
  });
  panel.querySelector('.fxp-now').textContent = `${t.label} · ${p.label} ${t.dark ? p.dark : p.light}`;
  saveShared({ theme: state.theme, acc: state.acc, resumePage: state.page });
}

panel.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.hasAttribute('data-min')) { panel.classList.toggle('is-min'); b.textContent = panel.classList.contains('is-min') ? '+' : '–'; return; }
  const group = b.closest('[data-group]')?.dataset.group;
  if (!group) return;
  state[group] = b.dataset.v;
  render();
});

render();
