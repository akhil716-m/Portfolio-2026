# Reconciliation visual 1, "one transaction, three records", in Hairline's language.
# Each system is its own object (OMS: a stack of order papers; PSP: a two-tier server block;
# Bank: a small bank building) and the transaction is one orange slip that lands on each,
# at its own angle: the same payment, recorded three times. One drawing per system.
import math

C, S = math.cos(math.radians(30)), math.sin(math.radians(30))
def pt(p): return f"{p[0]:.1f},{p[1]:.1f}"
def proj(x, y, a, b, z=0): return (x + (a + b) * C, y + (a - b) * S - z)
def poly(pts, c): return f'<polygon class="{c}" points="{" ".join(pt(p) for p in pts)}"/>'

def prism(x, y, l, w, deg, t, z0=0, da=0, db=0):
    """A box l x w x t, its centre offset (da, db) on the ground from screen point (x, y), turned deg."""
    r = math.radians(deg)
    loc = [(-l / 2, -w / 2), (l / 2, -w / 2), (l / 2, w / 2), (-l / 2, w / 2)]
    ab = [(da + u * math.cos(r) - v * math.sin(r), db + u * math.sin(r) + v * math.cos(r)) for u, v in loc]
    lo = [proj(x, y, a, b, z0) for a, b in ab]
    hi = [proj(x, y, a, b, z0 + t) for a, b in ab]
    sides = sorted(((sum(p[1] for p in q) / 4, q) for q in
                    ([lo[i], lo[(i + 1) % 4], hi[(i + 1) % 4], hi[i]] for i in range(4))), key=lambda s: s[0])
    return ''.join(poly(q, "f-l") for _, q in sides) + poly(hi, "f-t")

W, H, X, Y = 220, 150, 110, 112
VX, VY, VW, VH = 50, 44, 120, 96      # framed tight round the object, so it draws larger
def oms():          # a small stack of order papers
    return ''.join(prism(X + (i % 3) * .9, Y, 34, 24, -10 + (i * 37 % 19), 2, i * 3.1) for i in range(8)), 27
def psp():          # a two-tier server block
    return prism(X, Y, 38, 28, 0, 12) + prism(X, Y, 38, 28, 0, 12, 15), 27
def bank():         # base, four pillars along the front, roof
    g = prism(X, Y, 44, 32, 0, 4)
    for i in range(4):                      # an even row along the front face
        g += prism(X, Y, 4, 4, 0, 18, 4, da=-15 + i * 10, db=-11)
    g += prism(X, Y, 46, 34, 0, 5, 22)
    return g, 27

SYSTEMS = [('oms', oms, -6), ('psp', psp, 5), ('bank', bank, -3)]
out = []
for k, (name, fn, tilt) in enumerate(SYSTEMS):
    body, top = fn()
    out.append(f'<svg class="iso-sys" viewBox="{VX} {VY} {VW} {VH}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">')
    # the same transaction runs through all three: a dashed line at the slip's height, edge to edge
    ly = Y - (top + 6.9)
    x0, x1 = (X if k == 0 else VX), (X if k == len(SYSTEMS) - 1 else VX + VW)
    out.append(f'<path class="sys-link" d="M {x0} {ly:.1f} L {x1} {ly:.1f}"/>')
    out.append(f'<g class="sys-obj">{body}</g>')
    # the transaction, landing on top at this system's own angle
    out.append(f'<g class="sys-slip" style="--k:{k}">{prism(X, Y, 24, 15, tilt, 1.8, top + 6)}</g>')
    out.append('</svg>')
    out.append('@@SPLIT@@')
print('\n'.join(out))
