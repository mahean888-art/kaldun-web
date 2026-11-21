#!/usr/bin/env python3
"""Write the wordmark into every page's top bar and into the footer mark."""
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import dune

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
PAGES = ['index.html', 'discuss/index.html', 'journal/index.html',
         'journal/the-future-should-be-engineered-with-foresight/index.html', '404.html', 'demo/index.html']

NAV_STROKE = 13.5  # the top bar shows the mark at ~16px tall: balanced weight with open counters

def nav_svg(n):
    w, inner = dune.svg_inner(f'wmc{n}', stroke=NAV_STROKE, small_cut=True)
    return f'<svg class="wm wm--draw" viewBox="-4 -4 {dune.f(w+8)} 108" role="img" aria-label="Foresight Machines">{inner}</svg>'

for i, page in enumerate(PAGES):
    p = os.path.join(ROOT, page)
    s = open(p).read()
    s2, n = re.subn(r'<svg class="wm wm--draw".*?</svg>', lambda m: nav_svg(i + 1), s, flags=re.S)
    if n: open(p, 'w').write(s2)
    print(page, n)

# footer: the twin striped squares, then the name, in orange
p = os.path.join(ROOT, 'src/partials/footer.html')
s = open(p).read()
w, inner = dune.svg_inner('fmc', '#f39200', 11)
x0 = 270
svg = (f'<svg viewBox="-4 -4 {dune.f(x0 + w + 8)} 108" preserveAspectRatio="xMidYMid meet" data-foot-svg role="img" aria-label="Foresight Machines">'
       '<defs><pattern id="fm-stripe" width="10" height="9.375" patternUnits="userSpaceOnUse"><rect width="10" height="5.2" fill="#f39200"/></pattern></defs>'
       '<rect x="0" y="0" width="100" height="100" fill="url(#fm-stripe)"/><rect x="118" y="0" width="100" height="100" fill="url(#fm-stripe)"/>'
       f'<g transform="translate({x0} 0)">{inner}</g></svg>')
s2, n = re.subn(r'<svg viewBox="[^"]*" preserveAspectRatio="xMidYMid meet" data-foot-svg.*?</svg>', lambda m: svg, s, flags=re.S)
open(p, 'w').write(s2); print('footer', n)
