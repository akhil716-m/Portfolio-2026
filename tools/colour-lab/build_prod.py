"""Promotes the lab (lab-home and friends) to the live site with the chosen settings baked in:
dark ground, neutral white accent, covers + text per-project tone, hero E, covers A, about E,
closing Z, case studies neutral with few project touches + glow, resume dark sheet.
Run from the worktree root. Reads the -fx pages and assets/fx/styles-fx.css (built by build_fx.py
from the ORIGINAL styles-v1.css and *-v1 pages), writes index.html, work-*.html, resume.html, styles.css."""
import re, json, subprocess, sys
SP = sys.argv[1]
baked = subprocess.check_output(['node', f'{SP}/bake.mjs', 'file://' + __import__('os').getcwd() + '/assets/fx/fx-core.js'], text=True)
root_css, proj_json = baked.split('/*PROJ*/')
PROJ = json.loads(proj_json)
PROJVARS = json.loads(subprocess.check_output(['node', f'{SP}/bake_proj.mjs', 'file://' + __import__('os').getcwd() + '/assets/fx/fx-core.js'], text=True))

# ---- styles.css: tokenised stylesheet, root tokens baked, case-study touches ----
css = open('assets/fx/styles-fx.css').read()
css = re.sub(r'url\((["\']?)\.\./\.\./', r'url(\1', css)
css += f"""

/* ===== Baked theme (from the colour lab): dark ground, neutral white accent =====
   Change the ground or accent by editing these tokens, or try options at /lab-home.
   The original stylesheet is kept as styles-v1.css. */
{root_css}

/* Case studies: each page sets its project's cover colour on <html> (accent, tints, --proj);
   the hero glow reads --proj-rgb */
html[data-hero="glow"] .cs-hero::before {{ background: radial-gradient(ellipse 60% 55% at 85% 5%, rgb(var(--proj-rgb) / .12), transparent 70%); }}
"""
open('styles.css', 'w').write(css)

def common(page, fx_name):
    page = page.replace('assets/fx/styles-fx.css', 'styles.css')
    page = re.sub(r'\s*<meta name="robots" content="noindex">', '', page, count=1)
    page = page.replace('href="/lab-home"', 'href="/"')
    for s in ('hypersense', 'reconciliation', 'skilling'):
        page = page.replace(f'href="/lab-work-{s}"', f'href="/work-{s}"')
    page = page.replace('href="/lab-resume"', 'href="/resume"')
    page = re.sub(r'<script type="module" src="assets/(?:shader|case|resume)-preview\.js"></script>\n?', '', page)
    page = re.sub(r'(font-style:italic;|font-weight:500;)color:#d4ff5e;', r'\1color:#ededed;', page)   # console greeting
    return page

# ---- home ----
HOME_CSS = """<style>
/* Home shaders (see assets/home-fx.js): hero dot grid, cover tones, about dot grid, closing horizon */
.fx-hero-layer { position: absolute; top: 0; bottom: 0; left: calc(50% - 50vw); width: 100vw; z-index: -2; pointer-events: none;
  -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent); mask-image: linear-gradient(to bottom, black 60%, transparent); }
.fx-hero-layer:not(.fx-on) { display: none; }
/* keep the headline's intended break at every desktop width */
@media (min-width: 761px) { .hero-title .quiet { display: block; } }
/* Neutral accent: the sentence stays grey, the key phrase carries the emphasis in white */
.t-moment:not([data-tinted]) .t-line { color: var(--text-soft); }
.t-moment:not([data-tinted]) .t-line em { color: var(--text); font-weight: 500; }
.hero:has(.fx-hero-layer.fx-on)::before { opacity: 0.5; }

.t-media.fx-on { position: relative; background: var(--tray); }
.t-media.fx-on img { position: relative; width: 84%; height: auto; aspect-ratio: 16 / 9; margin: 9% auto 0; border-radius: 6px 6px 0 0;
  box-shadow: 0 30px 60px -24px rgb(var(--sh-rgb) / calc(.8 * var(--sh-k))), 0 0 0 1px rgb(var(--fg-rgb) / .06); }

.fig.fx-on::before { display: none; }
.fig.fx-on > canvas { -webkit-mask-image: linear-gradient(to bottom, transparent, black 12%, black 88%, transparent);
  mask-image: linear-gradient(to bottom, transparent, black 12%, black 88%, transparent); opacity: .35; }

.contact.fx-on .cl-beam { display: none; }
.contact.fx-on > canvas { -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent); mask-image: linear-gradient(to bottom, black 50%, transparent); }
/* the horizon has no box: it fades out before the section's edges */
.contact[data-fx="Z"] > canvas { -webkit-mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, black 55%, transparent);
  mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, black 55%, transparent); }
</style>
"""
p = common(open('lab-home.html').read(), 'home')
p = p.replace('<html lang="en">', '<html lang="en" data-fx-theme="dark" data-fx-acc="ink">', 1)
p = p.replace('</head>', HOME_CSS + '</head>', 1)
assert p.count('</body>') == 1
p = p.replace('</body>', '<script type="module" src="assets/home-fx.js"></script>\n</body>')
open('index.html', 'w').write(p)

# ---- case studies ----
for slug, key in {'hypersense': 'hypersense', 'reconciliation': 'recon/', 'skilling': 'skilling'}.items():
    p = common(open(f'lab-work-{slug}.html').read(), slug)
    hexv, rgbv = PROJ[key]
    tok = ';'.join(f'{k}:{v}' for k, v in PROJVARS[key].items())
    attrs = f'data-fx-theme="dark" data-inside="project" data-hero="glow" style="--proj:{hexv};--proj-rgb:{rgbv};{tok}"'
    p, n = re.subn(r'<html lang="en" data-fx-project="[^"]*"', f'<html lang="en" {attrs}', p, count=1)
    assert n == 1
    p = p.replace('read(); setInterval(read, 400);', 'read();')   # tokens are static now
    open(f'work-{slug}.html', 'w').write(p)

# ---- resume: dark sheet ----
RESUME_CSS = """<style>
/* The four skill groups used four fixed hues; only the design group takes the accent now */
.pill-design   { background: rgb(var(--acc-rgb) / 0.08); color: var(--accent); border: 1px solid rgb(var(--acc-rgb) / 0.22); }
.pill-research, .pill-tools, .pill-ai { background: rgb(var(--fg-rgb) / 0.04); color: var(--text-soft); border: 1px solid rgb(var(--fg-rgb) / 0.1); }
</style>
"""
p = common(open('lab-resume.html').read(), 'resume')
p = p.replace('<html lang="en">', '<html lang="en" data-fx-theme="dark" data-fx-acc="ink">', 1)
p = p.replace('</head>', RESUME_CSS + '</head>', 1)
open('resume.html', 'w').write(p)
print('built index, 3 case studies, resume, styles.css')
