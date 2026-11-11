# Reconciliation visuals 2 and 3 (comparison layers, and an exception), in Hairline's language.
# The same three objects as visual 1 (recon1.py). In the layers the two compared systems carry the
# same record (one slip), and the result is a pad with the two slips square on one another: matched.
# In the exception the records differ (a square and a strip), and on the result pad they don't line up.
# Prints seven drawings separated by @@SPLIT@@: oms, psp, bank, result, exc-oms, exc-psp, exception.
from recon1 import X, Y, prism, slab, SYSTEMS, SQUARE, STRIP

VB = "56 52 108 92"        # a little tighter than visual 1: these sit in a row of five
def svg(obj, slips, cls=""):
    return (f'<svg class="iso-cmp{cls}" viewBox="{VB}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
            f'<g class="sys-obj">{obj}</g><g class="sys-slip">{slips}</g></svg>')
slip = lambda z: prism(X, Y, 24, 15, 0, 1.8, z)
pad = prism(X, Y, 40, 30, 0, 4)
F = {name: fn for name, fn, _ in SYSTEMS}
out = []
for name in ('oms', 'psp', 'bank'):                          # the layers: the same record everywhere
    body, top = F[name]()
    out.append(svg(body, slip(top)))
out.append(svg(pad, slip(4) + slip(5.8)))                    # matched
for name, foot in (('oms', SQUARE), ('psp', STRIP)):         # the exception: each its own form
    body, top = F[name]()
    out.append(svg(body, slab(foot, 3, top)))
out.append(svg(pad, slab(SQUARE, 3, 6, X - 6, Y + 2) + slab(STRIP, 3, 9.5, X + 5, Y - 3), " iso-cmp--exc"))
print('\n@@SPLIT@@\n'.join(out))
