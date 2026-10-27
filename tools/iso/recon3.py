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

C = [(-10, -10), (10, -10), (10, 10), (-10, 10)]
DISC = [(11 * math.cos(a / 12 * math.tau), 11 * math.sin(a / 12 * math.tau)) for a in range(12)]
EXC = {
    # the amounts differ: a taller stack against a shorter one
    'amount': svg(CMP + f'<g class="sys-slip">{"".join(slip(L, 46, z * 2.6) for z in range(4))}'
                  f'{"".join(slip(R, 46, z * 2.6) for z in range(2))}</g>'),
    # the currencies differ: the same record in two different forms
    'currency': svg(CMP + f'<g class="sys-slip">{slab(C, 2, 0, L, 44)}{slab(DISC, 2, 0, R, 44)}</g>'),
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
    for n, m in ((1, 1), (1, 3), (3, 1), (3, 3)):
        print(f'<!-- {n} to {m} -->\n{match(n, m)}')
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
    # the account-level comparison: one ⇄ beyond the far ends of the trays, between the two names
    (lx, ly), (rx, ry) = P(-80, 0, 0), P(-80, GAP, 0)
    mx, my = (lx + rx) / 2, (ly + ry) / 2 - 4
    g.append(f'<path class="cmp" d="M {mx - 12:.1f} {my - 5:.1f} L {mx + 12:.1f} {my - 5:.1f} M {mx + 8:.1f} {my - 9:.1f} L {mx + 12:.1f} {my - 5:.1f} L {mx + 8:.1f} {my - 1:.1f}"/>'
             f'<path class="cmp" d="M {mx + 12:.1f} {my + 5:.1f} L {mx - 12:.1f} {my + 5:.1f} M {mx - 8:.1f} {my + 1:.1f} L {mx - 12:.1f} {my + 5:.1f} L {mx - 8:.1f} {my + 9:.1f}"/>')
    g.append(f'<text class="iso-cap" x="{lx:.1f}" y="{ly + 2:.1f}" text-anchor="middle">OMS</text>'
             f'<text class="iso-cap" x="{rx:.1f}" y="{ry + 2:.1f}" text-anchor="middle">PSP</text>')
    return f'<svg class="iso-topo" viewBox="110 40 270 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">{"".join(g)}</svg>'
