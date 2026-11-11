# Skills and Tools on the v3 home, in the Currently objects' language.
# Skills: three blocks stepping up away from you, the tallest topped in green (craft that builds).
# Tools: a small toolbox with a green handle.
src = open('isonow.py').read().split('X, Y = 60, 60')[0]
exec(src)
X, Y = 60, 62
def skills():
    return (prism(X, Y, 12, 12, 0, 18, da=-13, top="f-t f-acc") + prism(X, Y, 12, 12, 0, 12) +
            prism(X, Y, 12, 12, 0, 6, da=13))
def tools():
    g = prism(X, Y, 34, 16, 0, 12)                     # the box
    g += prism(X, Y, 36, 18, 0, 2.5, 12)                # its lid
    g += prism(X, Y, 2.4, 2.4, 0, 5, 14.5, da=-8) + prism(X, Y, 2.4, 2.4, 0, 5, 14.5, da=8)   # handle posts
    g += prism(X, Y, 19, 2.6, 0, 2, 19.5, top="f-t f-acc")   # handle grip
    return g
for name, fn in [('skills', skills), ('tools', tools)]:
    print(f'<!-- {name} -->')
    print(f'<svg class="iso-now" viewBox="20 18 80 56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g>{fn()}</g></svg>')
