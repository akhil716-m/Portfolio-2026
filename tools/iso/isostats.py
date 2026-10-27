# Outcome stats for HyperSense v3, in the same isometric language as the merchant-scale figure.
# One unit per merchant, the same size in all three: 20 flat tiles (demoed), 6 raised pillars
# (piloted), 2 tall blue pillars (converted). Fewer each step, deeper each step. Each base fits
# its units. One small drawing per stat; the copy stays in HTML below each.
import math

C, S = math.cos(math.radians(30)), math.sin(math.radians(30))
def pt(p): return f"{p[0]:.1f},{p[1]:.1f}"

def box(ox, oy, a0, b0, s_a, s_b, z0, h, cls, extra=""):
    P = lambda a, b, z: (ox + (a + b) * C, oy + (a - b) * S - z)
    a1, b1, z1 = a0 + s_a, b0 + s_b, z0 + h
    top = [P(a0, b0, z1), P(a1, b0, z1), P(a1, b1, z1), P(a0, b1, z1)]
    left = [P(a0, b0, z0), P(a1, b0, z0), P(a1, b0, z1), P(a0, b0, z1)]
    right = [P(a1, b0, z0), P(a1, b1, z0), P(a1, b1, z1), P(a1, b0, z1)]
    poly = lambda pts, c: f'<polygon class="{c}" points="{" ".join(pt(p) for p in pts)}"/>'
    return f'<g class="{cls}"{extra}>' + poly(left, "f-l") + poly(right, "f-r") + poly(top, "f-t") + '</g>'

W, H, GROUND = 220, 120, 74
CELL, GAP, RIM, PLINTH_H = 13.0, 2.4, 5, 4
STATS = [  # rows (a), cols (b), unit height, class
    (4, 5, 3, "pil"),            # 20 demoed: flat tiles
    (2, 3, 20, "pil"),           # 6 piloted: raised
    (1, 2, 32, "pil pil--fee"),  # 2 converted: tall, blue
]
out = []
for i, (ra, rb, h, cls) in enumerate(STATS):
    A, B = ra * CELL + 2 * RIM, rb * CELL + 2 * RIM
    ox = W / 2 - (A + B) / 2 * C
    oy = GROUND - (A - B) / 2 * S
    out.append(f'<svg class="iso-stat" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">')
    out.append(box(ox, oy, 0, 0, A, B, -PLINTH_H, PLINTH_H, "plinth"))
    cells = sorted(((a, b) for a in range(ra) for b in range(rb)), key=lambda c: (c[0] - c[1], c[0]))
    for k, (a, b) in enumerate(cells):
        a0, b0 = RIM + a * CELL + GAP / 2, RIM + b * CELL + GAP / 2
        out.append(box(ox, oy, a0, b0, CELL - GAP, CELL - GAP, 0, h, cls, f' style="--d:{.1 + i * .3 + k * .03:.2f}s"'))
    out.append('</svg>')
    out.append('@@SPLIT@@')
print('\n'.join(out))
