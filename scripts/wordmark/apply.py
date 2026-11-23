#!/usr/bin/env python3
"""Write the wordmark into every page's top bar and into the footer mark."""
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import dune

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
PAGES = ['index.html', 'discuss/index.html', 'journal/index.html',
         'journal/the-future-should-be-engineered-with-foresight/index.html', '404.html', 'demo/index.html']

NAV_STROKE = 15  # the top bar shows the mark at ~16px tall: a heavier cut, about 2.3px strokes

def nav_svg(n):
    w, inner = dune.svg_inner(f'wmc{n}', stroke=NAV_STROKE)
    return f'<svg class="wm wm--draw" viewBox="-4 -4 {dune.f(w+8)} 108" role="img" aria-label="Foresight Machines">{inner}</svg>'

for i, page in enumerate(PAGES):
    p = os.path.join(ROOT, page)
    s = open(p).read()
    s2, n = re.subn(r'<svg class="wm wm--draw".*?</svg>', lambda m: nav_svg(i + 1), s, flags=re.S)
    if n: open(p, 'w').write(s2)
    print(page, n)

# footer: the twin squares and the name, carved into the paper.
# Three passes of the same drawing: a light edge (down-right), a soft shadow
# (up-left), then the face, a shade darker than the page.
p = os.path.join(ROOT, 'src/partials/footer.html')
s = open(p).read()
x0 = 270
layers = ''
for cls, dx in (('fc-hi', 2.4), ('fc-sh', -2.0), ('fc-face', 0)):
    w, inner = dune.svg_inner('fmc-' + cls, 'currentColor', 12)
    sq = '<rect x="0" y="0" width="100" height="100"/><rect x="118" y="0" width="100" height="100"/>'
    layers += (f'<g class="{cls}" transform="translate({dx} {dx})"><g fill="currentColor" stroke="none">{sq}</g>'
               f'<g transform="translate({x0} 0)">{inner}</g></g>')
svg = (f'<svg viewBox="-8 -8 {dune.f(x0 + w + 16)} 116" preserveAspectRatio="xMidYMid meet" data-foot-svg role="img" aria-label="Foresight Machines">'
       + layers + '</svg>')
s2, n = re.subn(r'<svg viewBox="[^"]*" preserveAspectRatio="xMidYMid meet" data-foot-svg.*?</svg>', lambda m: svg, s, flags=re.S)
open(p, 'w').write(s2); print('footer', n)
