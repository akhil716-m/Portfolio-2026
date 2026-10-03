/* Shared pieces of the colour + shader preview: grounds, accents, per-project tones,
   shader recipes, and the preview state shared between the home preview and the
   case-study previews (kept in localStorage, so a theme picked on the home page is
   the one you see inside a case study). Preview only. */

export const T = '#00000000'; // transparent, so the page itself shows through

// Grounds. Paper is the warm off-white from the Fork reference; Mist is its cool twin.
export const THEMES = {
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
export const PALETTES = {
  lime:    { label: 'Lime',    dark: '#d4ff5e', light: '#5c7a00', soft: '#e9f7b6', mid: '#4a5a24', ink: '#1c2410', wash: ['#eef6d2', '#d3e89a', '#f6f8ec', '#b5d65a'] },
  ember:   { label: 'Ember',   dark: '#ff7a3d', light: '#e2561c', soft: '#ffd9c4', mid: '#a8461b', ink: '#2a1006', wash: ['#ffe1cf', '#ffb08a', '#fff2ea', '#ff8a52'] },
  apricot: { label: 'Apricot', dark: '#ffb38a', light: '#d9692f', soft: '#ffe3d1', mid: '#b4612f', ink: '#2b1608', wash: ['#ffd9c2', '#e6d6ff', '#fff4ec', '#cfe6ff'] },
  rose:    { label: 'Rose',    dark: '#f0739a', light: '#d5567d', soft: '#f6d3de', mid: '#9c3558', ink: '#2a0a17', wash: ['#f6d3de', '#eeb0c4', '#fcf0f4', '#e58aa8'] },
  iris:    { label: 'Iris',    dark: '#9d91ff', light: '#6a5cf0', soft: '#ddd8ff', mid: '#4b40b0', ink: '#120e33', wash: ['#e2ddff', '#c0b6ff', '#f5f3ff', '#9d91ff'] },
  cobalt:  { label: 'Cobalt',  dark: '#6f8cff', light: '#2f54eb', soft: '#d3dcff', mid: '#2440b0', ink: '#081333', wash: ['#dae2ff', '#a9bbff', '#f2f5ff', '#7b95ff'] },
  ink:     { label: 'Ink (neutral)', dark: '#ededed', light: '#16130f', soft: '#e6e2d8', mid: '#5f584e', ink: '#141414', wash: ['#ebe7de', '#d9d3c6', '#f6f4ef', '#b9b1a2'] },
  sage:    { label: 'Sage',    dark: '#7fd1a0', light: '#2f8a5b', soft: '#d6eedf', mid: '#2f6b4a', ink: '#0b2216', wash: ['#dcefe3', '#b0dcc0', '#f1f8f3', '#86c9a0'] },
};

// Per-project tones, sampled from each cover so the tray reads as part of the work:
// HyperSense's Juspay blue, Reconciliation's orange title, Up-skill's teal photos,
// Attendance's lavender-to-pink wash. Matched against the cover image's file name.
export const PROJECTS = {
  'hypersense': { label: 'HyperSense', dark: '#6f9bff', light: '#2f63e0', soft: '#d6e2ff', mid: '#2a4fb0', ink: '#0a1638', wash: ['#dfe8ff', '#a8c0ff', '#f1f5ff', '#5b8af0'] },
  'recon/':     { label: 'Reconciliation', dark: '#ff9a4d', light: '#e8742a', soft: '#ffe0c7', mid: '#b05a1e', ink: '#2b1405', wash: ['#ffe4cf', '#ffbf8f', '#fff4ea', '#f4925a'] },
  'skilling':   { label: 'Up-skill', dark: '#5cc3ad', light: '#23856f', soft: '#d3efe8', mid: '#226b5c', ink: '#06221c', wash: ['#d8f0ea', '#a3d9cb', '#effaf7', '#5bb39e'] },
  'attendance': { label: 'Attendance', dark: '#b39cff', light: '#7a5cf0', soft: '#e6ddff', mid: '#5a42b8', ink: '#160f38', wash: ['#ebe3ff', '#f5cde3', '#f8f4ff', '#a58cf5'] },
};
export const projectOf = el => {
  const src = el.querySelector('img')?.getAttribute('src') || '';
  const key = Object.keys(PROJECTS).find(k => src.includes(k));
  return key ? PROJECTS[key] : null;
};
export const PROJ_MODES = { off: 'Off', covers: 'Covers', text: 'Covers + text' };

// The lab's letters as recipes: (palette, theme, accent) → [kind, params]
export const R = {
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
export const NAMES = { A: 'Grain corners', B: 'Grain blob', C: 'Dither warp', D: 'Dither sphere', E: 'Dot grid', F: 'God rays', G: 'Grain wave', H: 'Ambient glow', M: 'Mesh gradient' };

export const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(' ');

// Writes a ground and an accent onto <html> as the tokens the -fx stylesheets read
export function paintTheme(themeKey, p, accentOverride) {
  const t = THEMES[themeKey];
  const a = accentOverride || (t.dark ? p.dark : p.light);
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
  document.documentElement.dataset.fxTheme = themeKey;
}

const KEY = 'fxPreview';
export function loadShared() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
export function saveShared(patch) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...loadShared(), ...patch })); } catch { /* private mode: hash still works */ }
}
