# The About portrait stands on a thin isometric plinth, in the same hairline style as Currently.
import math, importlib.util
spec = importlib.util.spec_from_file_location('n', 'isonow.py'); 
src = open('isonow.py').read().split('X, Y = 60, 60')[0]
exec(src)
X, Y, T = 80, 45, 5
g = prism(X, Y, 96, 64, 0, T)
# top face runs y 0..80, its centre at (80, 40): 41 of the 88 units from the top
print(f'<svg class="iso-plinth" viewBox="8 -1 144 88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">{g}</svg>')
