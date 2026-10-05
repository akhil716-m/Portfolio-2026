const mk = () => { const o = {}; return o; };
let out;
globalThis.document = { documentElement: { style: { setProperty: (k, v) => { out[k] = v; }, colorScheme: '' }, dataset: {} } };
globalThis.localStorage = { getItem: () => null, setItem() {} };
const m = await import(process.argv[2]);
const res = {};
out = {}; m.paintTheme('dark', m.PALETTES.ink); const base = { ...out };
for (const [k, p] of Object.entries(m.PROJECTS)) {
  out = {}; m.paintTheme('dark', p);
  res[k] = Object.fromEntries(Object.entries(out).filter(([n, v]) => base[n] !== v));
}
console.log(JSON.stringify(res));
