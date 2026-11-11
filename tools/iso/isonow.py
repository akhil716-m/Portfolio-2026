# "Currently" on the v3 home, as a small desk still-life in the case studies' isometric language:
# one object per line. Designing: a board with a frame pinned on it. Building: blocks stacked
# a little off true (Holdr). Reading: two books, one crooked. Listening: a record on its sleeve.
import math

C, S = math.cos(math.radians(30)), math.sin(math.radians(30))
def pt(p): return f"{p[0]:.1f},{p[1]:.1f}"
def proj(x, y, a, b, z=0): return (x + (a + b) * C, y + (a - b) * S - z)
def poly(pts, c): return f'<polygon class="{c}" points="{" ".join(pt(p) for p in pts)}"/>'

def prism(x, y, l, w, deg, t, z0=0, da=0, db=0, top="f-t"):
    r = math.radians(deg)
    loc = [(-l / 2, -w / 2), (l / 2, -w / 2), (l / 2, w / 2), (-l / 2, w / 2)]
    ab = [(da + u * math.cos(r) - v * math.sin(r), db + u * math.sin(r) + v * math.cos(r)) for u, v in loc]
    lo = [proj(x, y, a, b, z0) for a, b in ab]
    hi = [proj(x, y, a, b, z0 + t) for a, b in ab]
    sides = sorted(((sum(p[1] for p in q) / 4, q) for q in
                    ([lo[i], lo[(i + 1) % 4], hi[(i + 1) % 4], hi[i]] for i in range(4))), key=lambda s: s[0])
    return ''.join(poly(q, "f-l") for _, q in sides) + poly(hi, top)

def disc(x, y, r, z, h, cls="f-t"):
    rx, ry = r * 1.22, r * .7
    yb, yt = y - z, y - z - h
    side = (f'<path class="f-l" d="M {x - rx:.1f} {yb:.1f} L {x - rx:.1f} {yt:.1f} '
            f'A {rx:.1f} {ry:.1f} 0 0 0 {x + rx:.1f} {yt:.1f} L {x + rx:.1f} {yb:.1f} '
            f'A {rx:.1f} {ry:.1f} 0 0 1 {x - rx:.1f} {yb:.1f} Z"/>')
    return side + f'<ellipse class="{cls}" cx="{x:.1f}" cy="{yt:.1f}" rx="{rx:.1f}" ry="{ry:.1f}"/>'

X, Y = 60, 60
def designing():   # a board, a frame pinned on it, a small accent tile
    return (prism(X, Y, 46, 34, 0, 3) +
            prism(X, Y, 22, 16, 0, 1.4, 3, da=-6, db=3) +
            prism(X, Y, 9, 9, 0, 1.4, 3, da=12, db=-8, top="f-t f-acc"))
def building():    # three blocks, each set a little off true
    return (prism(X, Y, 20, 20, 0, 10) + prism(X, Y, 18, 18, 9, 10, 10, da=1) +
            prism(X, Y, 15, 15, -7, 10, 20, da=-1, db=1, top="f-t f-acc"))
def reading():     # one book flat, one on it, crooked
    return prism(X, Y, 34, 24, 0, 6) + prism(X, Y, 30, 21, 16, 5, 6, da=2, db=1, top="f-t f-acc")
def listening():   # a sleeve, the record half out of it
    return (prism(X, Y, 34, 34, 0, 2, da=-4, db=4) + disc(X + 8, Y - 4, 15, 2, 1.6) +
            f'<ellipse class="f-acc-fill" cx="{X + 8:.1f}" cy="{Y - 7.6:.1f}" rx="5.5" ry="3.2"/>')

for name, fn in [('designing', designing), ('building', building), ('reading', reading), ('listening', listening)]:
    print(f'<!-- {name} -->')
    print(f'<svg class="iso-now" viewBox="20 18 80 56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g>{fn()}</g></svg>')
