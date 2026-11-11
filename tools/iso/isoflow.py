# Builds the isometric "where the money goes" figure for HyperSense v3, in Hairline's language:
# hairline strokes, flat faces in the page colours, one accent for the fees.
# Output: an <svg> string (static), animated by CSS keyframes in assets/cs-v3.css.
import math, sys

C, S = math.cos(math.radians(30)), math.sin(math.radians(30))
def iso(x, y, a, b, z):            # a: down-right axis, b: up-right axis, z: up
    return (x + (a + b) * C, y + (a - b) * S - z)

def pt(p): return f"{p[0]:.1f},{p[1]:.1f}"

def box(cx, base_y, s, z0, h, cls):
    """An iso box of footprint s*s centred (screen) at cx, standing on base_y, from z0 to z0+h."""
    x0 = cx - s * C                 # P such that the footprint centre lands on cx
    P = lambda a, b, z: iso(x0, base_y, a, b, z)
    top = [P(0, 0, z0 + h), P(s, 0, z0 + h), P(s, s, z0 + h), P(0, s, z0 + h)]
    left = [P(0, 0, z0), P(s, 0, z0), P(s, 0, z0 + h), P(0, 0, z0 + h)]
    right = [P(s, 0, z0), P(s, s, z0), P(s, s, z0 + h), P(s, 0, z0 + h)]
    poly = lambda pts, c: f'<polygon class="{c}" points="{" ".join(pt(p) for p in pts)}"/>'
    return f'<g class="{cls}">' + poly(left, "f-l") + poly(right, "f-r") + poly(top, "f-t") + '</g>'

W, H = 940, 250
TRACK_Y = 168
START, G1, G2, G3, END = 110, 320, 470, 620, 830
out = [f'<svg class="iso-flow" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" role="img">',
       '<title>Payment flow: $1,000 enters, the acquiring bank, card network and issuing bank each take a fee the merchant never sees, and the merchant receives $980</title>']

# the road: small tiles between the pads
for x in range(START + 44, END - 40, 26):
    if any(abs(x - g) < 40 for g in (G1, G2, G3)): continue
    out.append(box(x, TRACK_Y, 7, 0, 1.5, "tile"))
# pads: solid at both ends, dashed (barely there) for the three intermediaries
out.append(box(START, TRACK_Y, 46, 0, 5, "pad"))
out.append(box(END, TRACK_Y, 46, 0, 5, "pad"))
for i, g in enumerate((G1, G2, G3), 1):
    out.append(box(g, TRACK_Y, 40, 0, 3, f"pad pad--hidden pad{i}"))

# the money: a block whose top three layers are the fees, peeled off one per intermediary
S_BLOCK, BASE_H = 30, 24
layers = [("issuing", 8), ("network", 3), ("acquiring", 4)]   # bottom to top above the base
out.append(f'<g class="money">')
out.append(box(START, TRACK_Y, S_BLOCK, 5, BASE_H, "blk blk-base"))
z = 5 + BASE_H
for name, h in layers:
    out.append(box(START, TRACK_Y, S_BLOCK, z, h, f"blk blk-fee blk-{name}"))
    z += h
out.append('</g>')

# words (unchanged copy from the original figure)
t = lambda x, y, s, cls, anchor="middle": f'<text class="{cls}" x="{x}" y="{y}" text-anchor="{anchor}">{s}</text>'
out.append(t((G1 + G3) / 2, 34, "PAYMENT COSTS, INVISIBLE TO MOST MERCHANTS", "iso-cap"))
out.append(f'<path class="iso-brace" d="M {G1 - 40} 50 L {G1 - 40} 44 L {G3 + 40} 44 L {G3 + 40} 50"/>')
out.append(t(START, 78, "Customer pays", "iso-name iso-name--end"))
out.append(t(G1, 78, "Acquiring bank", "iso-name"))
out.append(t(G2, 78, "Card network", "iso-name"))
out.append(t(G3, 78, "Issuing bank", "iso-name"))
out.append(t(END, 78, "Merchant receives", "iso-name iso-name--end"))
out.append(t(START, 222, "$1,000", "iso-amt"))
out.append(t(G1, 222, "−0.35%", "iso-fee iso-fee1"))
out.append(t(G2, 222, "−0.15%", "iso-fee iso-fee2"))
out.append(t(G3, 222, "−1.50%", "iso-fee iso-fee3"))
out.append(t(END, 222, "$980", "iso-amt iso-amt-out"))
out.append('</svg>')
print('\n'.join(out))
print(f"/* distances: g1 {G1-START}, g2 {G2-START}, g3 {G3-START}, end {END-START} */", file=sys.stderr)
