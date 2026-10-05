const out = {};
globalThis.document = { documentElement: { style: { setProperty: (k, v) => { out[k] = v; }, colorScheme: '' }, dataset: {} } };
globalThis.localStorage = { getItem: () => null, setItem() {} };
const m = await import(process.argv[2]);
m.paintTheme('dark', m.PALETTES.ink);
const css = ':root {\n' + Object.entries(out).map(([k, v]) => `  ${k}: ${v};`).join('\n') + '\n  color-scheme: dark;\n}';
console.log(css);
console.log('/*PROJ*/' + JSON.stringify(Object.fromEntries(Object.entries(m.PROJECTS).map(([k, p]) => [k, [p.dark, m.rgb(p.dark)]]))));
