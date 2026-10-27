# Turns a v2 case study (work-*.html) into its v3 page (work-*-v3.html) without touching the copy:
# v3 head (fonts, styles-v3.css, theme-before-paint script, cs-v3.css), the v3 top bar (Back +
# time-of-day tabs, taken from the HyperSense v3 page so every case study matches), no progress bar,
# side rail or old top nav, the v3 footer, and links back to /home-v3. The page's own components,
# styles and scripts stay; their visuals are redrawn separately, one by one.
#
# Usage: python3 tools/to-v3.py work-reconciliation.html "Recon accent: light,dark,paper hex"
import re, sys

src_path = sys.argv[1]
light, dark, paper = sys.argv[2].split(',')          # project colour per theme
dst_path = src_path.replace('.html', '-v3.html')
ref = open('work-hypersense-v3.html').read()        # the converted page everything copies from
s = src = open(src_path).read()

def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:80]); s = s.replace(a, b)

def hexrgb(h): h = h.lstrip('#'); return ' '.join(str(int(h[i:i + 2], 16)) for i in (0, 2, 4))

# <html>: theme from v3; the project colour moves into a small style block per theme
s = re.sub(r'<html lang="en"[^>]*>', '<html lang="en" data-theme="white" data-inside="project">', s, 1)
s = re.sub(r'(<title>[^<]*</title>)', r'\1\n<meta name="robots" content="noindex">', s, 1)
s = re.sub(r'<link href="https://fonts.googleapis.com/css2\?family=(?:Playfair|Geist:)[^"]*" rel="stylesheet">',
           '<link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Public+Sans:wght@400;500;600&display=swap" rel="stylesheet">', s, 1)
head_script = re.search(r'<script>\n  // Time of day before first paint:[\s\S]*?</script>', ref).group(0)
v3css = re.search(r'<link rel="stylesheet" href="styles-v3\.css\?v=\d+">', ref).group(0)
cscss = re.search(r'<link rel="stylesheet" href="assets/cs-v3\.css\?v=\d+">', ref).group(0)
v3js = re.search(r'<script src="assets/v3\.js\?v=\d+"></script>', ref).group(0)
rep('<link rel="stylesheet" href="styles.css">\n<link rel="stylesheet" href="assets/cs-toc.css">', v3css + '\n' + head_script)
proj = f'''<style>
/* This project's colour, per theme (deeper on white and paper so it stays readable) */
:root {{ --accent: {light}; --acc-rgb: {hexrgb(light)}; --proj: {light}; --proj-rgb: {hexrgb(light)}; }}
:root[data-theme="paper"] {{ --accent: {paper}; --acc-rgb: {hexrgb(paper)}; --proj: {paper}; --proj-rgb: {hexrgb(paper)}; }}
:root[data-theme="dark"] {{ --accent: {dark}; --acc-rgb: {hexrgb(dark)}; --proj: {dark}; --proj-rgb: {hexrgb(dark)}; }}
</style>'''
rep('<link rel="stylesheet" href="assets/cs-article.css">', '<link rel="stylesheet" href="assets/cs-article.css">\n' + cscss + '\n' + proj)
s = s.replace("'Geist', sans-serif", "var(--font)")

# chrome: progress bar, side rail and old top nav give way to the v3 layout and top bar
s, n = re.subn(r'<div id="cs-progress"[^>]*></div>\n(<div id="cs-sentinel"[^>]*></div>\n)?', '', s, 1)   # Up-skill also has a sentinel
assert n == 1
s = re.sub(r'<!-- CONTEXT RAIL[\s\S]*?</aside>\n\n', '', s, 1)
topbar = re.search(r'    <header class="topbar">[\s\S]*?\n    </header>\n', ref).group(0)
s, n = re.subn(r'<nav>\n  <div class="logo">[\s\S]*?\n</nav>\n',
               '<div class="v3 v3-cs">\n\n  <main class="v3-main" id="top">\n\n' + topbar.replace('\\', '\\\\'), s, 1)
assert n == 1
rep('''<footer>
  <div>© 2026 Akhil Male</div>
  <div class="right"><a href="#">Back to top ↑</a></div>
</footer>''', '''<footer class="foot meta">
  <div>© 2026 Akhil Male</div>
  <div class="right"><a href="#">Back to top ↑</a></div>
</footer>
  </main>
</div>''')
s = s.replace('<a class="cs-cta" href="/">', '<a class="cs-cta" href="/home-v3#work">')

# scripts: the rail / chapter-bar script and the old nav's scroll listener go; v3.js joins
s, n = re.subn(r'/\* Context rail(?: \+ chapter bar|: grouped by act)[\s\S]*?\n\}\)\(\);\n', '', s, 1)
assert n == 1, 'rail script not found'
s = re.sub(r'/\* Nav hairline: [\s\S]*?\n\}\)\(\);\n\n', '', s, 1)   # Up-skill's sentinel version of it
if 'const navEl' in s: rep('''<script>
const navEl = document.querySelector('nav');
window.addEventListener('scroll', () => { navEl.classList.toggle('is-scrolled', window.scrollY > 8); }, { passive: true });
</script>
''', '')
rep('<script src="assets/cs-toc.js" defer></script>', v3js)

# the copy must come through unchanged (only the old nav's words and the new top bar differ)
def words(h):
    h = re.sub(r'<(script|style)[\s\S]*?</\1>', '', h)
    h = h[h.find('<body'):]
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', h)).split()
a, b = words(src), words(s)
import collections
lost = collections.Counter(a) - collections.Counter(b)
gained = collections.Counter(b) - collections.Counter(a)
print('words lost:', dict(lost))
print('words gained:', dict(gained))
open(dst_path, 'w').write(s)
print('wrote', dst_path)
