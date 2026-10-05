/* Home shaders, as chosen in the colour + shader lab (lab-home): hero ambient glow (H),
   covers grain blob (B) in each project's own tone, about dot grid (E), closing
   horizon (Z). The ground and accent are baked into styles.css (dark, neutral white);
   this only mounts the shaders and tints each project's sentence, node and button.
   To try other letters, colours or grounds, use /lab-home. */
import { mountShader } from './shaders.js';
import { THEMES, PALETTES, projectOf, R, rgb } from './fx/fx-core.js';

const theme = THEMES.dark;
const base = PALETTES.ink;

// The hero is contained at 1400px, so its shader sits on a full-bleed layer inside it
function heroLayer() {
  const el = document.createElement('div');
  el.className = 'fx-hero-layer';
  el.setAttribute('aria-hidden', 'true');
  document.querySelector('.hero')?.prepend(el);
  return el;
}

// The hero glow is turned and shifted so the light stays in the corner, off the headline
// (same placement and spread as the lab)
const HERO_PLACE = { rotation: -10, offsetX: 0.45, offsetY: 0.25, scale: 1.4 };

const ZONES = [
  { letter: 'H', targets: () => [heroLayer()], place: HERO_PLACE },
  { letter: 'B', targets: () => [...document.querySelectorAll('.t-media')], perProject: true },
  { letter: 'E', targets: () => [document.querySelector('.fig')] },
  { letter: 'Z', targets: () => [document.querySelector('.contact')] },
];

// Each project's sentence, node and button take its own tone
function tintMoments() {
  document.querySelectorAll('.t-moment').forEach(m => {
    const media = m.querySelector('.t-media');
    const p = media && projectOf(media);
    if (!p) return;
    m.style.setProperty('--accent', p.dark);
    m.style.setProperty('--acc-rgb', rgb(p.dark));
    m.dataset.tinted = '';
  });
}

async function mount(zone) {
  for (const el of zone.targets().filter(Boolean)) {
    const p = (zone.perProject && projectOf(el)) || base;
    const [kind, base_] = R[zone.letter](p, theme, p.dark);
    const params = zone.place ? { ...base_, ...zone.place } : base_;
    if (p !== base) el.style.setProperty('--tray', p.ink);
    el.classList.add('fx-on');
    el.dataset.fx = zone.letter;
    try { await mountShader(el, kind, params); }
    catch (err) { console.warn('Shader not mounted', err); }
  }
}

tintMoments();
(async () => { for (const z of ZONES) await mount(z); })();
