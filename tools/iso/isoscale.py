# "Same base, different volume, different cost" for HyperSense v3, in Hairline's language.
# Every merchant gets the same 10x10 plinth. Each raised pillar is the same unit of volume
# ($5M a year), so small = 1 pillar, mid = 10, enterprise = all 100. The blue is the fees,
# always 2% of the raised volume: a hairline on the small merchant's pillar, a fifth of a
# pillar for mid, two whole pillars for enterprise.
import math

C, S = math.cos(math.radians(30)), math.sin(math.radians(30))
def pt(p): return f"{p[0]:.1f},{p[1]:.1f}"

def box(ox, oy, a0, b0, s_a, s_b, z0, h, cls, extra=""):
    """Iso box with its footprint corner at (a0, b0) in a plinth's grid space (origin ox, oy)."""
    P = lambda a, b, z: (ox + (a + b) * C, oy + (a - b) * S - z)
    a1, b1, z1 = a0 + s_a, b0 + s_b, z0 + h
    top = [P(a0, b0, z1), P(a1, b0, z1), P(a1, b1, z1), P(a0, b1, z1)]
    left = [P(a0, b0, z0), P(a1, b0, z0), P(a1, b0, z1), P(a0, b0, z1)]
    right = [P(a1, b0, z0), P(a1, b1, z0), P(a1, b1, z1), P(a1, b0, z1)]
    poly = lambda pts, c: f'<polygon class="{c}" points="{" ".join(pt(p) for p in pts)}"/>'
    return f'<g class="{cls}"{extra}>' + poly(left, "f-l") + poly(right, "f-r") + poly(top, "f-t") + '</g>'

W, H = 960, 144
N, CELL, GAP, PIL_H, PLINTH_H, RIM = 10, 9.0, 1.6, 30, 5, 4
SIDE = N * CELL + 2 * RIM
GROUND = 84
FEE = 0.02

# each merchant's base fits its pillars, at the same cell size, so pillars compare one to one:
# small 1x1, mid a 2x5 grid, enterprise 10x10 (rows along a, columns along b)
GRIDS = {1: (1, 1), 10: (2, 5), 100: (10, 10)}
def cells(count):
    ra, rb = GRIDS[count]
    return [(a, b) for a in range(ra) for b in range(rb)]

tiers = [(110, 1), (110, 10), (110, 100)]
W = 220
out = []
for i, (cx, count) in enumerate(tiers):
    out.append(f'<svg class="iso-scale" data-tier="{i}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">')
    ra, rb = GRIDS[count]
    A, B = ra * CELL + 2 * RIM, rb * CELL + 2 * RIM   # this base's size
    ox = cx - (A + B) / 2 * C               # footprint centred on (cx, GROUND) for every tier
    oy = GROUND - (A - B) / 2 * S
    raised = cells(count)
    fee_units = count * FEE                 # in pillars: 0.02, 0.2, 2
    # blue goes on the frontmost pillars: whole pillars first, the remainder as a band
    order = sorted(raised, key=lambda c: (-(c[0] - c[1]), -c[0]))
    whole, part = int(fee_units), fee_units - int(fee_units)
    out.append(f'<g class="st" data-tier="{i}">')
    out.append(box(ox, oy, 0, 0, A, B, -PLINTH_H, PLINTH_H, "plinth"))
    # painter's order: back to front
    for (a, b) in sorted(raised, key=lambda c: (c[0] - c[1], c[0])):
        a0, b0 = RIM + a * CELL + GAP / 2, RIM + b * CELL + GAP / 2
        s = CELL - GAP
        k = order.index((a, b))
        d = f' style="--d:{.15 + i * .25 + (k % 20) * .03:.2f}s"'
        if k < whole:
            out.append(box(ox, oy, a0, b0, s, s, 0, PIL_H, "pil pil--fee", d))
        elif k == whole and part > 0:
            cap = max(PIL_H * part, 1.2)       # never thinner than a hairline, so the small merchant's cost still shows
            out.append(f'<g class="pil"{d}>' + box(ox, oy, a0, b0, s, s, 0, PIL_H - cap, "pil-body") +
                       box(ox, oy, a0, b0, s, s, PIL_H - cap, cap, "pil-cap") + '</g>')
        else:
            out.append(box(ox, oy, a0, b0, s, s, 0, PIL_H, "pil", d))
    out.append('</g>')
    out.append('</svg>')
    out.append('@@SPLIT@@')
print('\n'.join(out))
