"""Builds the colour/theme preview: lab-home.html plus assets/fx/styles-fx.css.
Hardcoded colours in home-v2's inline CSS and in styles.css are rewritten to CSS
variables so assets/shader-preview.js can swap the accent and the theme live.
Run from the worktree root after build_v2.py."""
import re, os

# case-study pages previewed inside, with the PROJECTS key from assets/fx/fx-core.js
CASES = {'hypersense': 'hypersense', 'reconciliation': 'recon/', 'skilling': 'skilling'}

def v1(page):
    # the archived originals point at styles-v1.css and the -v1 pages; undo that so the lab builds as before
    page = page.replace('href="styles-v1.css"', 'href="styles.css"').replace('href="/home-v1"', 'href="/"').replace('href="/resume-v1"', 'href="/resume"')
    for o in ('hypersense', 'reconciliation', 'skilling'):
        page = page.replace(f'href="/work-{o}-v1"', f'href="/work-{o}"')
    return page.replace('<meta name="robots" content="noindex">\n', '', 1)

def tokenise_page(page):
    # CSS first: <style> blocks and style="" attributes
    page = re.sub(r'(<style[^>]*>)(.*?)(</style>)', lambda m: m.group(1) + tokenise(m.group(2), True) + m.group(3), page, flags=re.S)
    page = re.sub(r'style="([^"]*)"', lambda m: 'style="' + tokenise(m.group(1), True) + '"', page)
    # SVG paint attributes can't hold var(): a themed fill/stroke/stop-color moves into style=""
    page = re.sub(r'<(?:circle|path|line|rect|text|tspan|g|stop|ellipse|polygon|polyline)\b[^>]*>', svg_paint, page)
    return page

PAINT = re.compile(r'\s(fill|stroke|stop-color)="([^"]*)"')
def svg_paint(m):
    tag = m.group(0)
    moved = []
    def take(a):
        val = tokenise(a.group(2), True)
        if val == a.group(2): return a.group(0)
        moved.append(f'{a.group(1)}: {val}')
        return ''
    tag = PAINT.sub(take, tag)
    if not moved: return tag
    if ' style="' in tag:
        return tag.replace(' style="', ' style="' + '; '.join(moved) + '; ', 1)
    end = -2 if tag.endswith('/>') else -1
    return tag[:end].rstrip() + ' style="' + '; '.join(moved) + '"' + tag[end:]

# Canvas diagrams paint from scripts. A tiny reader keeps the live accent and ground
# (set by assets/case-preview.js) as "r,g,b" strings the canvas code can use.
CANVAS_THEME = """<script>
/* fx preview: canvas diagrams read the live accent and ground from the theme tokens */
(function () {
  const c = { acc: '212,255,94', fg: '255,255,255' };
  const read = () => {
    const s = getComputedStyle(document.documentElement);
    const a = s.getPropertyValue('--acc-rgb').trim(), f = s.getPropertyValue('--fg-rgb').trim();
    if (a) c.acc = a.split(/\\s+/).join(',');
    if (f) c.fg = f.split(/\\s+/).join(',');
  };
  window.csAcc = () => c.acc; window.csFg = () => c.fg;
  read(); setInterval(read, 400);
})();
</script>"""

def theme_canvas(page, start_marker):
    """Rewrites lime and white in one canvas script (from start_marker to its closing })();)
    to read the live theme. Other scripts, such as the globe, keep their colours."""
    i = page.find(start_marker)
    if i < 0: return page
    j = page.index('})();', i)
    seg = page[i:j]
    seg = seg.replace("const LIME = '#d4ff5e';", "const LIME = () => `rgb(${csAcc()})`;").replace('fillStyle = LIME;', 'fillStyle = LIME();')
    seg = re.sub(r"'(rgba\((?:212,255,94|255,255,255),[^']*)'", r'`\1`', seg)
    seg = seg.replace('rgba(212,255,94,', 'rgba(${csAcc()},').replace('rgba(255,255,255,', 'rgba(${csFg()},')
    # label greys: near-white keeps its alpha, the mid greys become the ground's ink at ~2/3
    seg = seg.replace('rgba(237,237,237,', 'rgba(${csFg()},')
    seg = re.sub(r'rgba\((?:180,180,180|170,170,170),\$\{', 'rgba(${csFg()},${0.68*', seg)
    return page[:i] + seg + page[j:]

def tokenise(css, case=False):
    out = []
    for line in css.split('\n'):
        if line.strip().startswith('--'):      # leave the :root token definitions alone
            out.append(line); continue
        l = line
        l = re.sub(r'rgba\(\s*212,\s*255,\s*94,\s*([^)]+?)\s*\)', r'rgb(var(--acc-rgb) / \1)', l)
        l = re.sub(r'rgba\(\s*255,\s*255,\s*255,\s*([0-9.]+)\s*\)', r'rgb(var(--fg-rgb) / \1)', l)
        l = re.sub(r'rgba\(\s*(?:10,\s*10,\s*10|6,\s*6,\s*6|20,\s*20,\s*20),\s*([0-9.]+)\s*\)', r'rgb(var(--bg-rgb) / \1)', l)
        l = re.sub(r'rgba\(\s*0,\s*0,\s*0,\s*([0-9.]+)\s*\)', r'rgb(var(--sh-rgb) / calc(\1 * var(--sh-k)))', l)
        l = re.sub(r'#d4ff5e\b', 'var(--accent)', l, flags=re.I)
        l = re.sub(r'#e9f7b6\b', 'var(--acc-soft)', l, flags=re.I)
        l = re.sub(r'#4a5a24\b', 'var(--acc-mid)', l, flags=re.I)
        l = re.sub(r'#1c2410\b', 'var(--acc-ink)', l, flags=re.I)
        l = re.sub(r'color:\s*#(0a0a0a|000)\b', 'color: var(--on-accent)', l, flags=re.I)
        if case:
            l = re.sub(r'(?<![-\w])color:\s*#fff(fff)?\b', 'color: var(--text)', l, flags=re.I)
        for hexes, var in [
            (('0c0c0c',), '--surf-1'),
            (('111', '121212', '0f0f0f'), '--surf-2'),
            (('141414', '161616', '191919'), '--surf-3'),
            (('1c1c1c',), '--surf-4'),
            (('1f1f1f', '222'), '--ln-1'),
            (('262626', '272727', '2a2a2a', '2e2e2e'), '--ln-2'),
            (('3a3a3a',), '--ln-3'),
        ]:
            for h in hexes:
                l = re.sub(r'#' + h + r'\b', f'var({var})', l, flags=re.I)
        out.append(l)
    return '\n'.join(out)

html = open('lab-home-source.html').read()
start = html.index('<style>'); end = html.index('</style>', start)
html = html[:start] + tokenise(html[start:end]) + html[end:]
assert html.count('href="styles-v1.css"') == 1
html = html.replace('href="styles-v1.css"', 'href="assets/fx/styles-fx.css"')
assert html.count('</body>') == 1
html = html.replace('</body>', '<script type="module" src="assets/shader-preview.js"></script>\n</body>')
for slug in CASES:
    html = html.replace(f'href="/work-{slug}"', f'href="/lab-work-{slug}"')
html = html.replace('href="/resume"', 'href="/lab-resume"')
open('lab-home.html', 'w').write(html)

os.makedirs('assets/fx', exist_ok=True)
css = tokenise(open('styles-v1.css').read())
# relative url()s in styles.css are written from the root; the copy sits two levels down
css = re.sub(r'url\((["\']?)(?!data:|https?:|/|\.\./)', r'url(\1../../', css)
open('assets/fx/styles-fx.css', 'w').write(css)

left = re.findall(r'rgba\(\s*212|#d4ff5e', html[start:html.index('</style>', start)] + css, flags=re.I)
print('built; leftover lime refs outside tokens:', len(left))

for slug, key in CASES.items():
    page = tokenise_page(v1(open(f'work-{slug}-v1.html').read()))
    if slug == 'hypersense':
        # the ecosystem graph is drawn on a canvas; the globe keeps its own colours
        page = theme_canvas(page, "document.getElementById('cs-graph')")
        # the outer band of the scale arcs: the lime glow was faint on purpose, so any other
        # accent needs a little more to read as a gradient at all
        page = page.replace('<stop offset="0.7" style="stop-color: rgb(var(--acc-rgb) / 0.012)"/>', '<stop offset="0.7" style="stop-color: rgb(var(--acc-rgb) / 0.04)"/>')
        page = page.replace('<stop offset="1" style="stop-color: rgb(var(--acc-rgb) / 0.06)"/>', '<stop offset="1" style="stop-color: rgb(var(--acc-rgb) / 0.16)"/>')
        page = page.replace('</head>', CANVAS_THEME + '\n</head>', 1)
    assert page.count('href="styles.css"') == 1
    page = page.replace('href="styles.css"', 'href="assets/fx/styles-fx.css"')
    page = page.replace('<html lang="en"', f'<html lang="en" data-fx-project="{key}"', 1)
    if 'noindex' not in page:
        page = page.replace('<head>', '<head>\n<meta name="robots" content="noindex">', 1)
    page = page.replace('href="/"', 'href="/lab-home"')
    for other in CASES:
        page = page.replace(f'href="/work-{other}"', f'href="/lab-work-{other}"')
    page = page.replace('href="/resume"', 'href="/lab-resume"')
    assert page.count('</body>') == 1
    page = page.replace('</body>', '<script type="module" src="assets/case-preview.js"></script>\n</body>')
    open(f'lab-work-{slug}.html', 'w').write(page)
    print('built', f'lab-work-{slug}.html', 'project', key, 'noindex' in page, 'data-fx-project' in page)

# the resume, in the theme and colour picked on the home preview
page = tokenise_page(v1(open('resume-v1.html').read()))
assert page.count('href="styles.css"') == 1
page = page.replace('href="styles.css"', 'href="assets/fx/styles-fx.css"')
if 'noindex' not in page:
    page = page.replace('<head>', '<head>\n<meta name="robots" content="noindex">', 1)
page = page.replace('href="/"', 'href="/lab-home"').replace('href="/resume"', 'href="/lab-resume"')
for other in CASES:
    page = page.replace(f'href="/work-{other}"', f'href="/lab-work-{other}"')
assert page.count('</body>') == 1
page = page.replace('</body>', '<script type="module" src="assets/resume-preview.js"></script>\n</body>')
open('lab-resume.html', 'w').write(page)
print('built resume-fx.html', 'noindex' in page, page.count('/lab-resume'))
