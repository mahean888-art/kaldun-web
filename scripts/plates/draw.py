"""
Line-drawing primitives for the plates: technical drawings in the manner of a
production design book. Every element carries a class the page styles:
  l1  main line        l2  secondary line      l3  hatch / construction
  ac  the one accent   tx  label (mono caps)   tn  small figure
Drawn elements get pathLength=1 and a --d delay so the page can draw them in.
"""
import math

class Doc:
    def __init__(self, w, h, label):
        self.w, self.h, self.label = w, h, label
        self.o = []
        self.d = 0          # current draw step

    def step(self, n=1):
        self.d += n

    def _a(self, el, cls, extra=''):
        self.o.append(f'<{el} class="dr {cls}" pathLength="1" style="--d:{self.d}"{extra}/>')

    def path(self, d, cls='l1'):
        self.o.append(f'<path class="dr {cls}" pathLength="1" style="--d:{self.d}" d="{d}"/>')

    def line(self, x1, y1, x2, y2, cls='l1'):
        self.path(f'M{f(x1)} {f(y1)}L{f(x2)} {f(y2)}', cls)

    def circle(self, cx, cy, r, cls='l1'):
        self.o.append(f'<circle class="dr {cls}" pathLength="1" style="--d:{self.d}" cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}"/>')

    def rect(self, x, y, w, h, cls='l1', rx=0):
        self.o.append(f'<rect class="dr {cls}" pathLength="1" style="--d:{self.d}" x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}"' + (f' rx="{f(rx)}"' if rx else '') + '/>')

    def dot(self, cx, cy, r=3, cls='fd'):
        self.o.append(f'<circle class="{cls}" style="--d:{self.d}" cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}"/>')

    def fill(self, d, cls='fa'):
        self.o.append(f'<path class="{cls}" style="--d:{self.d}" d="{d}"/>')

    def text(self, x, y, s, cls='tx', anchor='start'):
        self.o.append(f'<text class="{cls}" style="--d:{self.d}" x="{f(x)}" y="{f(y)}" text-anchor="{anchor}">{s}</text>')

    def svg(self, cls='fmp__svg'):
        return (f'<svg class="{cls}" viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{self.label}" '
                f'xmlns="http://www.w3.org/2000/svg">' + ''.join(self.o) + '</svg>')

def f(x):
    s = f'{x:.1f}'
    return s[:-2] if s.endswith('.0') else s

def pol(cx, cy, r, a):
    a = math.radians(a)
    return cx + r * math.cos(a), cy + r * math.sin(a)

def arc(cx, cy, r, a0, a1):
    x0, y0 = pol(cx, cy, r, a0); x1, y1 = pol(cx, cy, r, a1)
    large = 1 if (a1 - a0) % 360 > 180 else 0
    return f'M{f(x0)} {f(y0)}A{f(r)} {f(r)} 0 {large} 1 {f(x1)} {f(y1)}'

def sector(cx, cy, r0, r1, a0, a1):
    x0, y0 = pol(cx, cy, r1, a0); x1, y1 = pol(cx, cy, r1, a1)
    x2, y2 = pol(cx, cy, r0, a1); x3, y3 = pol(cx, cy, r0, a0)
    large = 1 if (a1 - a0) % 360 > 180 else 0
    return (f'M{f(x0)} {f(y0)}A{f(r1)} {f(r1)} 0 {large} 1 {f(x1)} {f(y1)}'
            f'L{f(x2)} {f(y2)}A{f(r0)} {f(r0)} 0 {large} 0 {f(x3)} {f(y3)}Z')

def hatch_sector(doc, cx, cy, r0, r1, a0, a1, n, cls='l3'):
    """Radial hatching inside an annular sector, like seating in a plan."""
    for k in range(1, n):
        a = a0 + (a1 - a0) * k / n
        x0, y0 = pol(cx, cy, r0, a); x1, y1 = pol(cx, cy, r1, a)
        doc.line(x0, y0, x1, y1, cls)

def leader(doc, x0, y0, x1, y1, label, side='r', cls='tx'):
    """A label on a short leader: dot at the subject, elbow, text."""
    doc.dot(x0, y0, 2.6)
    xm = x1 - 16 if side == 'r' else x1 + 16
    doc.path(f'M{f(x0)} {f(y0)}L{f(xm)} {f(y1)}H{f(x1)}', 'l2')
    doc.text(x1 + (8 if side == 'r' else -8), y1 + 5, label, cls, 'start' if side == 'r' else 'end')

def ruler(doc, x0, x1, y, ticks, labels=None, cls='l2'):
    """A dimension rule with end stops and ticks."""
    doc.line(x0, y, x1, y, cls)
    doc.line(x0, y - 7, x0, y + 7, cls); doc.line(x1, y - 7, x1, y + 7, cls)
    for i, t in enumerate(ticks):
        x = x0 + (x1 - x0) * t
        doc.line(x, y - 4, x, y + 4, 'l3')
        if labels and labels[i]:
            doc.text(x, y + 26, labels[i], 'tn', 'middle')
