# "Many fragmented signals, one investigation" for HyperSense v3, in Hairline's language.
# Left: each signal is drawn as the kind of thing it is (paper for documents, coins for fees,
# a small crate for events), lying crooked in one loose column, its name to its left.
# Middle: HyperSense as one block. Right: the five modules as identical slips, in line.
# Two drawings: wide and phone.
import math, random

C, S = math.cos(math.radians(30)), math.sin(math.radians(30))
def pt(p): return f"{p[0]:.1f},{p[1]:.1f}"
def proj(x, y, a, b, z=0): return (x + (a + b) * C, y + (a - b) * S - z)
def poly(pts, c): return f'<polygon class="{c}" points="{" ".join(pt(p) for p in pts)}"/>'

def prism(x, y, l, w, deg, t, z0=0):
    """A box of l x w x t lying on the ground (from z0), centred on (x, y), turned deg in its plane."""
    r = math.radians(deg)
    loc = [(-l / 2, -w / 2), (l / 2, -w / 2), (l / 2, w / 2), (-l / 2, w / 2)]
    ab = [(u * math.cos(r) - v * math.sin(r), u * math.sin(r) + v * math.cos(r)) for u, v in loc]
    lo = [proj(x, y, a, b, z0) for a, b in ab]
    hi = [proj(x, y, a, b, z0 + t) for a, b in ab]
    sides = []
    for i in range(4):
        j = (i + 1) % 4
        q = [lo[i], lo[j], hi[j], hi[i]]
        sides.append((sum(p[1] for p in q) / 4, q))
    sides.sort(key=lambda s: s[0])                      # back (higher on screen) first
    return ''.join(poly(q, "f-l") for _, q in sides) + poly(hi, "f-t")

def coin(x, y, r, z):
    rx, ry, h = r * 1.22, r * .7, 2.6
    yb, yt = y - z, y - z - h
    side = (f'<path class="f-l" d="M {x - rx:.1f} {yb:.1f} L {x - rx:.1f} {yt:.1f} '
            f'A {rx:.1f} {ry:.1f} 0 0 0 {x + rx:.1f} {yt:.1f} L {x + rx:.1f} {yb:.1f} '
            f'A {rx:.1f} {ry:.1f} 0 0 1 {x - rx:.1f} {yb:.1f} Z"/>')
    return side + f'<ellipse class="f-t" cx="{x:.1f}" cy="{yt:.1f}" rx="{rx:.1f}" ry="{ry:.1f}"/>'

def thing(kind, n, x, y, deg, k=1.0):
    """The object for one signal: 'paper' (n sheets), 'coins' (n coins) or 'crate'."""
    g = []
    if kind == 'paper':
        for i in range(n):
            g.append(prism(x + i * 1.8, y - i * 2.4, 24 * k, 15 * k, deg + i * 7, 1.6))
    elif kind == 'coins':
        for i in range(n):
            g.append(coin(x + (i % 2) * 1.6 - .8, y, 6.5 * k, i * 3.2))
    else:
        g.append(prism(x, y, 13 * k, 13 * k, deg, 9 * k))
    return f'<g class="src src--{kind}">' + ''.join(g) + '</g>'

def block(x, y, s, h, cls):
    x0 = x - s * C
    P = lambda a, b, z: proj(x0, y, a, b, z)
    top = [P(0, 0, h), P(s, 0, h), P(s, s, h), P(0, s, h)]
    left = [P(0, 0, 0), P(s, 0, 0), P(s, 0, h), P(0, 0, h)]
    right = [P(s, 0, 0), P(s, s, 0), P(s, s, h), P(s, 0, h)]
    return f'<g class="{cls}">' + poly(left, "f-l") + poly(right, "f-r") + poly(top, "f-t") + '</g>'

def slip(x, y, l, w, cls):
    return f'<g class="{cls}">' + prism(x, y, l, w, 0, 2.2) + '</g>'

def curve(x1, y1, x2, y2, cls, extra=""):
    mx = (x1 + x2) / 2
    return f'<path class="{cls}" pathLength="1" d="M {x1:.1f} {y1:.1f} C {mx:.1f} {y1:.1f}, {mx:.1f} {y2:.1f}, {x2:.1f} {y2:.1f}"{extra}/>'

def vcurve(x1, y1, x2, y2, cls, extra=""):
    my = (y1 + y2) / 2
    return f'<path class="{cls}" pathLength="1" d="M {x1:.1f} {y1:.1f} C {x1:.1f} {my:.1f}, {x2:.1f} {my:.1f}, {x2:.1f} {y2:.1f}"{extra}/>'

def text(x, y, s, cls, anchor="start"):
    return f'<text class="{cls}" x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}">{s}</text>'

# each signal, and the kind of thing it is
SIGNALS = [('Processor invoices', 'paper', 2), ('Scheme fees', 'coins', 2), ('Interchange', 'coins', 3),
           ('Settlement reports', 'paper', 3), ('FX markup', 'coins', 1), ('Chargebacks', 'crate', 1),
           ('Acquirer markup', 'coins', 2), ('IC++ statements', 'paper', 2), ('PSP reports', 'paper', 1),
           ('Cross-border fees', 'coins', 2), ('Contract rates', 'paper', 1), ('Refund costs', 'crate', 1),
           ('Assessment fees', 'coins', 1), ('Gateway fees', 'coins', 2)]
STEPS = [('Overview', 'What am I paying today?'), ('Drill-Down', 'Why did costs change?'),
         ('Fee Spikes', 'What is driving it?'), ('Audit', 'Was I charged correctly?'),
         ('Forecast', 'What changes are coming?')]
TITLE = ('Fragmented cost signals such as processor invoices, scheme fees, interchange, settlement reports and FX markup '
         'converge into HyperSense, which routes them directly to the five modules of one investigation: '
         'Overview, Drill-Down, Fee Spikes, Audit and Forecast.')
# a loose, uneven column: how far right each signal sits (0..1), hand-set so no two neighbours line up
SWAY = [.15, .62, .34, .9, .5, .08, .72, .28, .95, .44, .12, .66, .3, .82]

def wide():
    random.seed(5)
    W, H = 960, 480
    out = [f'<svg class="iso-conv iso-conv--wide" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{TITLE}">']
    hub = (540, 262)
    hub_in, hub_out = (hub[0] - 26, hub[1] - 6), (hub[0] + 26, hub[1] - 6)
    sig = []
    for i, (name, kind, n) in enumerate(SIGNALS):
        x = 170 + SWAY[i] * 130
        y = 66 + i * 28.5
        sig.append((x, y, random.choice([-1, 1]) * random.uniform(10, 34), name, kind, n))
    steps_y = [140 + k * 64 for k in range(5)]
    for i, (x, y, *_r) in enumerate(sig):
        out.append(curve(x + 16, y - 3, *hub_in, "thr thr-in", f' style="--d:{i * .11:.2f}s"'))
        out.append(curve(x + 16, y - 3, *hub_in, "pulse", f' style="--d:{i * .11:.2f}s"'))
    for k, sy in enumerate(steps_y):
        out.append(curve(*hub_out, 706, sy - 2, "thr thr-out"))
        out.append(curve(*hub_out, 706, sy - 2, "lit", f' style="--k:{k}"'))
    out.append(text(40, 28, 'FRAGMENTED SIGNALS', "cap"))
    for x, y, deg, name, kind, n in sig:
        out.append(thing(kind, n, x, y, deg))
        out.append(text(x - 22, y + 4, name, "sig", "end"))
    out.append(block(hub[0], hub[1] + 10, 34, 24, "hub"))
    out.append(text(hub[0], hub[1] + 50, 'HyperSense', "hub-name", "middle"))
    out.append(text(700, 92, 'ONE INVESTIGATION', "cap"))
    for k, ((title, q), sy) in enumerate(zip(STEPS, steps_y)):
        out.append(f'<g class="step" style="--k:{k}">' + slip(720, sy, 26, 10, "slip slip--step") +
                   text(748, sy - 3, title, "step-name") + text(748, sy + 16, q, "step-q") + '</g>')
    out.append('</svg>')
    return '\n'.join(out)

def narrow():
    # Phone: the signals in two loose columns (each object crooked, its name beside it), a fan of
    # threads into HyperSense in the middle, then a matching fan out to the five modules in a
    # two-column grid underneath.
    random.seed(9)
    W, H = 340, 680
    out = [f'<svg class="iso-conv iso-conv--narrow" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{TITLE}">']
    hub = (170, 392)
    hub_in, hub_out = (hub[0], hub[1] - 34), (hub[0], hub[1] + 14)
    sig = []
    for i, (name, kind, n) in enumerate(SIGNALS):
        col, row = i % 2, i // 2
        x = 22 + col * 172 + (SWAY[i] - .5) * 10
        y = 64 + row * 34
        sig.append((x, y, random.choice([-1, 1]) * random.uniform(10, 32), name, kind, n))
    for i in range(len(sig)):
        sx = 30 + i * (280 / (len(sig) - 1))
        out.append(vcurve(sx, 296, *hub_in, "thr thr-in", f' style="--d:{i * .11:.2f}s"'))
        out.append(vcurve(sx, 296, *hub_in, "pulse", f' style="--d:{i * .11:.2f}s"'))
    out.append(text(4, 24, 'FRAGMENTED SIGNALS', "cap"))
    for x, y, deg, name, kind, n in sig:
        out.append(thing(kind, n, x, y, deg, .85))
        out.append(text(x + 22, y + 4, name, "sig sig--sm", "start"))
    out.append(block(hub[0], hub[1] + 6, 30, 22, "hub"))
    out.append(text(hub[0] + 34, hub[1] - 4, 'HyperSense', "hub-name"))
    # out: five threads fan from HyperSense down to the grid, lighting one after another
    for k in range(len(STEPS)):
        ex = 40 + k * (260 / (len(STEPS) - 1))
        out.append(vcurve(*hub_out, ex, 466, "thr thr-out"))
        out.append(vcurve(*hub_out, ex, 466, "lit", f' style="--k:{k}"'))
    out.append(text(4, 500, 'ONE INVESTIGATION', "cap"))
    for k, (title, q) in enumerate(STEPS):
        x0, sy = (k % 2) * 170, 540 + (k // 2) * 58
        out.append(f'<g class="step" style="--k:{k}">' + slip(x0 + 11, sy, 22, 9, "slip slip--step") +
                   text(x0 + 30, sy - 3, title, "step-name") + text(x0 + 30, sy + 14, q, "step-q") + '</g>')
    out.append('</svg>')
    return '\n'.join(out)

print(wide())
print('@@SPLIT@@')
print(narrow())
