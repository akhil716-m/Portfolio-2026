# The phone version of the HyperSense "where the money goes" figure (isoflow.py), stacked top to
# bottom so every word stays readable: the same money block, pads, tiles and fees, the stops one
# under another, names and amounts in one column on the right. Same classes as the wide figure,
# so cs-v3.css styles it; the block moves down instead of across (iso-v-* keyframes).
import math

C, S = math.cos(math.radians(30)), math.sin(math.radians(30))
def iso(x, y, a, b, z): return (x + (a + b) * C, y + (a - b) * S - z)
def pt(p): return f"{p[0]:.1f},{p[1]:.1f}"

def box(cx, base_y, s, z0, h, cls):
    x0 = cx - s * C
    P = lambda a, b, z: iso(x0, base_y, a, b, z)
    top = [P(0, 0, z0 + h), P(s, 0, z0 + h), P(s, s, z0 + h), P(0, s, z0 + h)]
    left = [P(0, 0, z0), P(s, 0, z0), P(s, 0, z0 + h), P(0, 0, z0 + h)]
    right = [P(s, 0, z0), P(s, s, z0), P(s, s, z0 + h), P(s, 0, z0 + h)]
    poly = lambda pts, c: f'<polygon class="{c}" points="{" ".join(pt(p) for p in pts)}"/>'
    return f'<g class="{cls}">' + poly(left, "f-l") + poly(right, "f-r") + poly(top, "f-t") + '</g>'

W, H, CX, TX, STEP = 300, 530, 70, 136, 104       # TX: the words' left edge
STOPS = [80 + k * STEP for k in range(5)]           # customer, three intermediaries, merchant
t = lambda x, y, s, cls: f'<text class="{cls}" x="{x}" y="{y}">{s}</text>'
out = [f'<svg class="iso-flow iso-flow--v" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" role="img">',
       '<title>Payment flow: $1,000 enters, the acquiring bank, card network and issuing bank each take a fee, the merchant receives $980</title>']

# the road between the stops
for a, b in zip(STOPS, STOPS[1:]):
    for dy in (34, 52, 70):
        out.append(box(CX, a + dy, 7, 0, 1.5, "tile"))
# pads: solid at both ends, dashed for the intermediaries
out.append(box(CX, STOPS[0], 46, 0, 5, "pad"))
out.append(box(CX, STOPS[-1], 46, 0, 5, "pad"))
for i, y in enumerate(STOPS[1:4], 1):
    out.append(box(CX, y, 40, 0, 3, f"pad pad--hidden pad{i}"))

# the money: base plus three fee layers, peeled off one per intermediary
out.append('<g class="money">')
out.append(box(CX, STOPS[0], 30, 5, 24, "blk blk-base"))
z = 29
for name, h in (("issuing", 8), ("network", 3), ("acquiring", 4)):
    out.append(box(CX, STOPS[0], 30, z, h, f"blk blk-fee blk-{name}"))
    z += h
out.append('</g>')

# names and amounts, one column
names = ["Customer", "Acquiring bank", "Card network", "Issuing bank", "Merchant"]
amts = [("$1,000", "iso-amt"), ("&minus;$3.50", "iso-fee iso-fee1"), ("&minus;$1.50", "iso-fee iso-fee2"),
        ("&minus;$15.00", "iso-fee iso-fee3"), ("$980", "iso-amt iso-amt-out")]
for k, y in enumerate(STOPS):
    end = k in (0, 4)
    out.append(t(TX, y - 4, names[k], "iso-name" + (" iso-name--end" if end else "")))
    out.append(t(TX, y + 15, *amts[k]))
# what happens on the way, shown as the block passes
tags = [("Gateway", "Tokenisation"), ("Processing", "Routing"), ("Authorisation", "3DS"), ("Settlement", "Payout")]
for k, (a, b) in enumerate(tags, 1):
    mid = STOPS[k - 1] + STEP / 2
    out.append(t(TX, mid - 2, a, f"iso-tag iso-tag{k}"))
    out.append(t(TX, mid + 12, b, f"iso-tag iso-tag{k} iso-tag--late"))
out.append('</svg>')
print('\n'.join(out))
