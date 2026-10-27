# Reconciliation visual 1, "one transaction, three records", in Hairline's language.
# One transaction on top, mapped down to three systems, each its own object (OMS: a stack of
# order papers; PSP: a server block; Bank: a bank building), and each keeps the transaction
# in its own form (a square, a strip, a triangle). One drawing on top, then one per system.
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
def face(a, b0, b1, z0, z1, c):
    """A flat panel on the plane a = const (the face that looks down-right), b0..b1 wide, z0..z1 tall."""
    return poly([proj(X, Y, a, b0, z0), proj(X, Y, a, b1, z0), proj(X, Y, a, b1, z1), proj(X, Y, a, b0, z1)], c)
# All three are about 40 x 30 on the ground and 27 tall, so they read as equals.
def oms():          # the order system's records: a loose stack of order papers
    return ''.join(prism(X + (i % 3) * .9, Y, 34, 24, -10 + (i * 37 % 19), 2, i * 3.1) for i in range(8)), 23.7      # top of the 8th paper
def psp():          # the processor: a two-tier server block, a slot light on each tier
    g = prism(X, Y, 40, 30, 0, 12) + prism(X, Y, 40, 30, 0, 12, 15)
    for z in (5, 20):
        g += face(20.05, -10, 8, z, z + 2, "row")
    return g, 27
def bank():         # two steps, pillars along both visible sides, a beam and a stepped cap
    g = prism(X, Y, 42, 32, 0, 3) + prism(X, Y, 38, 28, 0, 3, 3)
    cols = [(-12 + i * 8, -10) for i in range(4)] + [(12, -2), (12, 6)]
    for da, db in sorted(cols, key=lambda c: c[1] - c[0], reverse=True):   # back ones first
        g += prism(X, Y, 3.6, 3.6, 0, 15, 6, da=da, db=db)
    g += prism(X, Y, 40, 30, 0, 3, 21) + prism(X, Y, 34, 24, 0, 3, 24)
    return g, 27

def slab(foot, t, z0, x=X, y=Y):
    """A flat piece with any footprint (ground points a, b round (x, y)), t thick, from z0."""
    lo = [proj(x, y, a, b, z0) for a, b in foot]
    hi = [proj(x, y, a, b, z0 + t) for a, b in foot]
    n = len(foot)
    sides = sorted(((sum(p[1] for p in q) / 4, q) for q in
                    ([lo[i], lo[(i + 1) % n], hi[(i + 1) % n], hi[i]] for i in range(n))), key=lambda s: s[0])
    return ''.join(poly(q, "f-l") for _, q in sides) + poly(hi, "f-t")

# Each system keeps the same transaction in its own form: a square, a long strip, a triangle.
SQUARE = [(-9, -9), (9, -9), (9, 9), (-9, 9)]
STRIP = [(-16, -5.5), (16, -5.5), (16, 5.5), (-16, 5.5)]
TRI = [(-11, -9.5), (13, 0), (-11, 9.5)]
SYSTEMS = [('oms', oms, SQUARE), ('psp', psp, STRIP), ('bank', bank, TRI)]
if __name__ == "__main__":
    # On top, the one transaction (a round token), mapped down to the three systems below. The
    # drawing spans the three columns, so x = 100, 300, 500 are the column centres; the lines run
    # past its bottom edge (overflow visible) to stop just above each system's piece.
    CIRCLE = [(24 * math.cos(math.radians(a)), 24 * math.sin(math.radians(a))) for a in range(0, 360, 15)]
    out = ['<svg class="iso-sys iso-txn" viewBox="0 0 600 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">']
    for cx, (_, fn, _) in zip((100, 300, 500), SYSTEMS):   # a lower object gets a longer line
        out.append(f'<path class="sys-link" d="M 300 52 L {cx} {138 + (27 - fn()[1]) * 1.67:.0f}"/>')
    out.append(f'<g class="sys-slip" style="--k:0">{slab(CIRCLE, 5, 0, 300, 38)}</g>')
    out += ['</svg>', '@@SPLIT@@']
    for k, (name, fn, foot) in enumerate(SYSTEMS):
        body, top = fn()
        out.append(f'<svg class="iso-sys" viewBox="{VX} {VY} {VW} {VH}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">')
        out.append(f'<g class="sys-obj">{body}</g>')
        # the transaction, resting centred on top in this system's own form
        out.append(f'<g class="sys-slip" style="--k:{k + 1}">{slab(foot, 3, top)}</g>')
        out.append('</svg>')
        out.append('@@SPLIT@@')
    print('\n'.join(out))
