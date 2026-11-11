# Reconciliation visuals for /02 exception types and /03 match shapes, in Hairline's language.
# Every record is the same small orange slip from visuals 1-2.
#   match(n, m): n records on the left linked to m on the right (one-to-one ... many-to-many).
#   EXC: one drawing per exception type, two records that differ in one way each.
# Imported by the page patcher; run it to print every drawing.
import math
from recon1 import prism, slab, proj, poly

VB = "0 0 160 80"
L, R = 42, 118                                   # left and right record columns (screen x)
def slip(x, y, z=0, l=26, w=16):
    return prism(x, y, l, w, 0, 1.8, z)
def ghost(x, y, l=26, w=16):                     # a record that should be there but isn't
    return f'<g class="ghost">{prism(x, y, l, w, 0, 1.8)}</g>'
def ink(x, y, pts, z=1.9, c="ink"):             # a mark printed on a record's top face
    return poly([proj(x, y, a, b, z) for a, b in pts], c)
ARROW = [(-9, -1.3), (2, -1.3), (2, -4.5), (9, 0), (2, 4.5), (2, 1.3), (-9, 1.3)]
def lines(widths):                                # rows of text on a record, each its own length
    return [[(-9, b - .8), (-9 + w, b - .8), (-9 + w, b + .8), (-9, b + .8)] for b, w in zip((4, 0, -4), widths)]
def svg(body, cls="iso-mini"):
    return f'<svg class="{cls}" viewBox="{VB}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">{body}</svg>'
# a small ⇄ between the two records: they come from two sources and are being compared
CMP = ('<path class="cmp" d="M 73 39 L 87 39 M 84 36.5 L 87 39 L 84 41.5"/>'
       '<path class="cmp" d="M 87 46 L 73 46 M 76 43.5 L 73 46 L 76 48.5"/>')
def rows(n):
    return [42] if n == 1 else [18, 42, 66]

def match(n, m):
    """n records on the left, m on the right, every left one linked to every right one."""
    links = ''.join(f'<path class="mlink" d="M {L + 18} {a - 1} L {R - 18} {b - 1}"/>' for a in rows(n) for b in rows(m))
    left = ''.join(slip(L, y) for y in rows(n))
    right = ''.join(slip(R, y) for y in rows(m))
    return svg(f'{links}<g class="sys-slip">{left}</g><g class="sys-obj">{right}</g>')


# Figures and currency marks printed on a record: strokes drawn as thin ink bars on its top face.
# Glyph space is x along the text (a) and y up the page (b); each glyph is about 4 wide and 7 tall.
GLYPH = {
    '0': [[(0, 0), (4, 0), (4, 7), (0, 7), (0, 0)]],
    '4': [[(3, 0), (3, 7), (0, 2.5), (4.4, 2.5)]],
    '5': [[(4, 7), (0, 7), (0, 3.6), (4, 3.6), (4, 0), (0, 0)]],
    'rupee': [[(0, 7), (4.6, 7)], [(0, 5.2), (4.6, 5.2)],
              [(0, 7), (2.4, 7), (3.8, 6.2), (3.8, 5.6), (2.4, 3.8), (0, 3.8)], [(0.4, 3.8), (3.8, 0)]],
    'dollar': [[(4, 5.6), (0.8, 5.6), (0, 4.8), (0, 4.1), (0.8, 3.5), (3.2, 3.5), (4, 2.9), (4, 2.2), (3.2, 1.4), (0, 1.4)],
               [(2, 0), (2, 7)]],
}
def stroke(x, y, p, q, t=1.1, c="ink"):
    (x0, y0), (x1, y1) = p, q
    d = math.hypot(x1 - x0, y1 - y0) or 1
    nx, ny = -(y1 - y0) / d * t / 2, (x1 - x0) / d * t / 2
    return poly([proj(x, y, x0 + nx, y0 + ny, 1.9), proj(x, y, x1 + nx, y1 + ny, 1.9),
                 proj(x, y, x1 - nx, y1 - ny, 1.9), proj(x, y, x0 - nx, y0 - ny, 1.9)], c)
def glyph(x, y, g, da, db, k=1, c="ink"):
    out = ''
    for line in GLYPH[g]:
        pts = [(da + u * k, db + v * k) for u, v in line]
        out += ''.join(stroke(x, y, pts[i], pts[i + 1], 1.1 * k ** .5, c) for i in range(len(pts) - 1))
    return out
def text(x, y, s, red=None, k=1.1):               # a short figure, centred on the record
    w = (4 * len(s) + 2 * (len(s) - 1)) * k
    return ''.join(glyph(x, y, ch, -w / 2 + i * 6 * k, -3.5 * k, k, "ink-diff" if i == red else "ink") for i, ch in enumerate(s))
def mark(x, y, g):                                # one currency mark, centred and larger
    return glyph(x, y, g, -2.2 * 1.35, -3.5 * 1.35, 1.35)


def pairs(n):
    """n accounts on each side, each linked only to its own partner: several one-to-one pairs side by side."""
    links = ''.join(f'<path class="mlink" d="M {L + 18} {y - 1} L {R - 18} {y - 1}"/>' for y in rows(n))
    left = ''.join(slip(L, y) for y in rows(n))
    right = ''.join(slip(R, y) for y in rows(n))
    return svg(f'{links}<g class="sys-slip">{left}</g><g class="sys-obj">{right}</g>')

C = [(-10, -10), (10, -10), (10, 10), (-10, 10)]
DISC = [(11 * math.cos(a / 12 * math.tau), 11 * math.sin(a / 12 * math.tau)) for a in range(12)]
EXC = {
    # the amounts differ: the same record, its figure not the same (500 against 400, the odd digit in red)
    'amount': svg(CMP + f'<g class="sys-slip">{slip(L, 44)}{slip(R, 44)}</g>'
                  f'{text(L, 44, "500")}{text(R, 44, "400", red=0)}'),
    # the currencies differ: the same record, one marked in rupees and the other in dollars
    'currency': svg(CMP + f'<g class="sys-slip">{slip(L, 44)}{slip(R, 44)}</g>'
                    f'{mark(L, 44, "rupee")}{mark(R, 44, "dollar")}'),
    # the direction is flipped: the same record, its arrow pointing the other way
    'direction': svg(CMP + f'<g class="sys-slip">{slip(L, 44)}{slip(R, 44)}</g>'
                     f'{ink(L, 44, ARROW)}{ink(R, 44, [(-a, b) for a, b in ARROW])}'),
    # a reference field differs: the same record, its last line of text not the same (in red)
    'metadata': svg(CMP + f'<g class="sys-slip">{slip(L, 44)}{slip(R, 44)}</g>'
                    f'{"".join(ink(L, 44, q) for q in lines((18, 18, 12)))}'
                    f'{"".join(ink(R, 44, q) for q in lines((18, 18)))}{ink(R, 44, lines((18, 18, 6))[2], c="ink-diff")}'),
    # one side has no record
    'missing': svg(CMP + f'<g class="sys-slip">{slip(L, 44)}</g>{ghost(R, 44)}'),
    # can't be categorised: a lone record, not orange
    'unknown': svg(f'<g class="sys-obj">{slip(80, 44)}</g>'),
}

if __name__ == "__main__":
    for n, m in ((1, 1), (1, 3), (3, 1)):
        print(f'<!-- {n} to {m} -->\n{match(n, m)}')
    print(f'<!-- 3 to 3, as pairs -->\n{pairs(3)}')
    for k, v in EXC.items():
        print(f'<!-- {k} -->\n{v}')

# Account and entry level, nested: two accounts (OMS and PSP trays) compared as a whole, and
# inside them four entries each, linked one-to-one (1-1), one-to-many (2-2,3) and many-to-one (3,4-4).
# The trays lie side by side with their entries facing, so the links run across like rungs.
def topology():
    TX, TY, GAP, Z = 200, 150, 104, 4               # left tray centre (screen), tray spacing, height
    DA = (-48, -16, 16, 48)                         # entries along each tray
    P = lambda a, b, z=Z + 1.8: proj(TX, TY, a, b, z)
    pairs = [(0, 0), (1, 1), (1, 2), (2, 3), (3, 3)]
    g = [f'<g class="sys-obj">{prism(TX, TY, 128, 36, 0, Z)}{prism(TX, TY, 128, 36, 0, Z, db=GAP)}</g>']
    g += [f'<path class="mlink" d="M {P(DA[i], 7)[0]:.1f} {P(DA[i], 7)[1]:.1f} L {P(DA[j], GAP - 7)[0]:.1f} {P(DA[j], GAP - 7)[1]:.1f}"/>'
          for i, j in pairs]
    g.append('<g class="sys-slip">' + ''.join(prism(TX, TY, 22, 14, 0, 1.8, Z, da=a) for a in DA) + '</g>')
    g.append('<g class="sys-obj">' + ''.join(prism(TX, TY, 22, 14, 0, 1.8, Z, da=a, db=GAP) for a in DA) + '</g>')
    # the account-level comparison: one link that joins the two trays themselves, at their near ends,
    # ahead of the entry links (the same idea as grouping records in a tray: the whole account is compared)
    (lx, ly), (rx, ry) = P(-80, 0, 0), P(-80, GAP, 0)
    A, B0, B1 = -58, 18, GAP - 18                    # just before the first entry; tray edge to tray edge
    head = lambda b, s: [P(A - 3, b - 5 * s, Z), P(A, b, Z), P(A + 3, b - 5 * s, Z)]
    (x0, y0), (x1, y1) = P(A, B0, Z), P(A, B1, Z)
    g.append(f'<path class="alink" d="M {x0:.1f} {y0:.1f} L {x1:.1f} {y1:.1f}"/>'
             + ''.join('<path class="alink" d="M ' + ' L '.join(f'{x:.1f} {y:.1f}' for x, y in head(bb, sg)) + '"/>'
                       for bb, sg in ((B1, 1), (B0, -1))))
    g.append(f'<text class="iso-cap" x="{lx:.1f}" y="{ly + 2:.1f}" text-anchor="middle">OMS</text>'
             f'<text class="iso-cap" x="{rx:.1f}" y="{ry + 2:.1f}" text-anchor="middle">PSP</text>')
    return f'<svg class="iso-topo" viewBox="110 40 270 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">{"".join(g)}</svg>'
