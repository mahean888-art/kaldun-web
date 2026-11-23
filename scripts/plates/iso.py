#!/usr/bin/env python3
"""
Isometric drawings for the site, in one language: graphite massing with fine
white hatching on bone drafting paper; orange only where the machine changes
something. Writes src/partials/iso-*.html (inline SVG).

  iso-campus-1..4  How it works: a sample AI campus, one drawing per step
  iso-world-1..3   Worlds: settlement vault, campus, container vessel
"""
import math, os

C30, S30 = math.cos(math.radians(30)), 0.5
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'partials')

def f(v):
    s = f'{v:.1f}'
    return s[:-2] if s.endswith('.0') else s

STYLE = {
    'g':  dict(top='#3b3733', xf='#1d1b18', yf='#2a2724', hatch='rgba(246,241,232,.26)', edge='#f6f1e8'),
    'gl': dict(top='#4a4540', xf='#26231f', yf='#33302b', hatch='rgba(246,241,232,.22)', edge='#f6f1e8'),
    'a':  dict(top='#f7a432', xf='#cf7800', yf='#e58a06', hatch='rgba(40,20,0,.22)', edge='#fff8ec'),
}

class Iso:
    def __init__(self, w, h, ox, oy, s, label):
        self.w, self.h, self.ox, self.oy, self.s, self.label = w, h, ox, oy, s, label
        self.items = []      # (depth, svg)
        self.over = []       # drawn after the massing (labels, markers)

    def P(self, x, y, z=0):
        return (self.ox + (x - y) * C30 * self.s, self.oy + (x + y) * S30 * self.s - z * self.s)

    def poly(self, pts, fill, stroke=None, sw=1.1, extra=''):
        d = 'M' + ' L'.join(f'{f(px)} {f(py)}' for px, py in pts) + 'Z'
        st = f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"' if stroke else ''
        return f'<path d="{d}" fill="{fill}"{st}{extra}/>'

    def line(self, a, b, stroke, sw=0.6, dash=None):
        da = f' stroke-dasharray="{dash}"' if dash else ''
        return f'<path d="M{f(a[0])} {f(a[1])}L{f(b[0])} {f(b[1])}" stroke="{stroke}" stroke-width="{sw}" fill="none"{da}/>'

    def box(self, x, y, z, w, d, h, st='g', hatch=1.0, roof=0, dz=0.0, ghost=False):
        """A solid box; visible faces are the top, the +x face and the +y face."""
        P = self.P
        x1, y1, z1 = x + w, y + d, z + h
        S = STYLE[st]
        out = []
        if ghost:
            for a, b in [((x, y1, z), (x1, y1, z)), ((x1, y, z), (x1, y1, z)), ((x, y1, z1), (x1, y1, z1)), ((x1, y, z1), (x1, y1, z1)),
                         ((x, y, z1), (x1, y, z1)), ((x, y, z1), (x, y1, z1)), ((x1, y1, z), (x1, y1, z1)), ((x, y1, z), (x, y1, z1)), ((x1, y, z), (x1, y, z1))]:
                out.append(self.line(P(*a), P(*b), '#f6f1e8', 0.9, '3 3'))
            self.items.append((x + w / 2 + y + d / 2 + dz, ''.join(out)))
            return
        top = [P(x, y, z1), P(x1, y, z1), P(x1, y1, z1), P(x, y1, z1)]
        xf = [P(x1, y, z), P(x1, y1, z), P(x1, y1, z1), P(x1, y, z1)]
        yf = [P(x, y1, z), P(x1, y1, z), P(x1, y1, z1), P(x, y1, z1)]
        out += [self.poly(xf, S['xf']), self.poly(yf, S['yf']), self.poly(top, S['top'])]
        if hatch:
            k = 0.55 / hatch
            n = int(h / k)
            for i in range(1, n):
                zz = z + i * k
                out.append(self.line(P(x1, y, zz), P(x1, y1, zz), S['hatch']))
                out.append(self.line(P(x, y1, zz), P(x1, y1, zz), S['hatch']))
        if roof:
            n = int(d / roof)
            for i in range(1, n):
                yy = y + i * roof
                out.append(self.line(P(x, yy, z1), P(x1, yy, z1), S['hatch']))
        e = S['edge']
        out.append(self.poly(top, 'none', e, 1.05))
        for a, b in [((x1, y, z), (x1, y1, z)), ((x, y1, z), (x1, y1, z)), ((x1, y1, z), (x1, y1, z1)), ((x1, y, z), (x1, y, z1)), ((x, y1, z), (x, y1, z1))]:
            out.append(self.line(P(*a), P(*b), e, 1.05))
        self.items.append((x + w / 2 + y + d / 2 + dz, ''.join(out)))

    def raw(self, depth, svg):
        self.items.append((depth, svg))

    def leader(self, at, to, text, side='r'):
        """Dot on the subject, a thin elbowed line, a plain label."""
        ax, ay = at; tx, ty = to
        elbow = tx - 18 if side == 'r' else tx + 18
        anchor = 'start' if side == 'r' else 'end'
        lx = tx + 8 if side == 'r' else tx - 8
        self.over.append(f'<g class="lb"><circle cx="{f(ax)}" cy="{f(ay)}" r="3.6" fill="#141210" stroke="#f6f1e8" stroke-width="1.2"/>'
                         f'<path d="M{f(ax)} {f(ay)}L{f(elbow)} {f(ty)}H{f(tx)}" stroke="#141210" stroke-width="1" fill="none"/>'
                         f'<text x="{f(lx)}" y="{f(ty + 4.5)}" text-anchor="{anchor}">{text}</text></g>')

    def svg(self, cls='iso'):
        body = ''.join(s for _, s in sorted(self.items, key=lambda t: t[0]))
        return (f'<svg class="{cls}" viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{self.label}" xmlns="http://www.w3.org/2000/svg">'
                + body + ''.join(self.over) + '</svg>')

# ------------------------------------------------------------------ the campus
def tower(g, x, y, h=16, depth=-50):
    """A lattice transmission tower in ink, standing on the paper."""
    P = g.P
    b = 1.6
    feet = [P(x - b, y - b, 0), P(x + b, y - b, 0), P(x + b, y + b, 0), P(x - b, y + b, 0)]
    top = P(x, y, h)
    s = ''.join(g.line(ft, top, '#141210', 1) for ft in feet)
    for zz in (h * 0.35, h * 0.62):
        k = 1 - zz / h
        pts = [P(x - b * k, y - b * k, zz), P(x + b * k, y + b * k, zz)]
        s += g.line(pts[0], pts[1], '#141210', 0.7)
    arm_a, arm_b = P(x - 3.2, y + 3.2, h * 0.86), P(x + 3.2, y - 3.2, h * 0.86)
    s += g.line(arm_a, arm_b, '#141210', 1.1)
    g.raw(depth, s)
    return arm_a, arm_b

def campus(step):
    labels = {
        1: 'An AI campus in plan, isometric: four data halls, a substation with four main transformers, the transmission line, and the site edge.',
        2: 'The same campus with the late items marked: the interconnection and the main transformers.',
        3: 'The campus with the arrangement found, in orange: bridge power on site, battery storage, and halls 3 and 4 moved to a second phase.',
        4: 'The campus as committed: the arrangement found, recorded before energization.',
    }
    g = Iso(720, 500, 238, 118, 3.75, labels[step])
    P = g.P
    # the slab and its edge
    g.box(0, 0, 0, 100, 62, 1.6, 'g', hatch=0, dz=-200)
    # site road
    g.raw(-150, g.line(P(4, 58, 1.6), P(96, 58, 1.6), 'rgba(246,241,232,.5)', 0.8, '6 4'))
    # data halls: 1 and 2 built; 3 and 4 a second phase from step 3 on
    halls = [(8, 6), (8, 30), (46, 6), (46, 30)]
    for i, (hx, hy) in enumerate(halls):
        phase2 = step >= 3 and i >= 2
        if phase2:
            g.box(hx, hy, 1.6, 32, 20, 9, 'g', ghost=True)
        else:
            g.box(hx, hy, 1.6, 32, 20, 9, 'g', hatch=1.0)
            for c in range(6):
                g.box(hx + 3 + c * 4.6, hy + 4, 10.6, 3.2, 12, 1.6, 'gl', hatch=0, dz=0.5)
    # substation yard: fence, four transformers, a gantry
    sx, sy = 84, 6
    g.raw(-120, g.poly([P(sx, sy, 1.6), P(sx + 14, sy, 1.6), P(sx + 14, sy + 22, 1.6), P(sx, sy + 22, 1.6)], 'none', '#f6f1e8', 0.8, ' stroke-dasharray="3 2"'))
    late = step == 2
    for k in range(4):
        g.box(sx + 3, sy + 2 + k * 5, 1.6, 7, 3.4, 4.2, 'g', hatch=1.2)
    g.box(sx + 11, sy + 2, 1.6, 1, 18, 7, 'gl', hatch=0)
    # bridge power and storage, found in step 3
    if step >= 3:
        for k in range(3):
            g.box(84, 33 + k * 7, 1.6, 12, 4.6, 4.4, 'a', hatch=1.1)
        for r in range(2):
            for c in range(5):
                g.box(64 + c * 3.6, 54 + r * 0, 1.6, 2.8, 5, 2.6, 'a', hatch=0.9, dz=0.2) if r == 0 else None
    # transmission line in from beyond the site
    a1, b1 = tower(g, 118, -14, 17, -300)
    a2, b2 = tower(g, 106, -6, 17, -260)
    sub = P(sx + 7, sy + 1, 8.6)
    lc = '#141210' if not late else '#141210'
    g.raw(-240, g.line(a1, a2, lc, 0.9) + g.line(b1, b2, lc, 0.9) + g.line(a2, sub, lc, 0.9, '4 3' if late else None)
          + g.line(b2, sub, lc, 0.9, '4 3' if late else None))
    # markers and labels
    if step == 1:
        g.leader(P(24, 6, 11), (150, 46), 'Data halls · 4 × 75 MW', 'l')
        g.leader(P(91, 12, 6.5), (560, 330), 'Substation')
        g.leader(P(106, -6, 15), (520, 40), 'Interconnection')
        g.leader(P(8, 56, 1.6), (150, 420), 'Site · 300 MW', 'l')
    elif step == 2:
        for (mx, my, mz), txt, pos in [((91, 14, 6.5), 'Transformers · late', (560, 330)), ((106, -6, 15), 'Interconnection · slips', (520, 40))]:
            cx, cy = P(mx, my, mz)
            g.over.append(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="17" fill="none" stroke="#141210" stroke-width="1.2" stroke-dasharray="3 3"/>')
            g.leader((cx, cy), pos, txt)
        g.leader(P(24, 6, 11), (150, 46), 'Halls wait for power', 'l')
    elif step == 3:
        g.leader(P(90, 40, 6), (580, 330), 'Bridge power')
        g.leader(P(70, 58, 4), (520, 460), 'Battery storage')
        g.leader(P(62, 16, 10), (520, 40), 'Halls 3–4 · later')
        g.leader(P(24, 6, 11), (150, 46), 'Halls 1–2 · first', 'l')
    elif step == 4:
        g.leader(P(90, 40, 6), (580, 330), 'As committed')
        g.leader(P(24, 6, 11), (150, 46), 'Halls 1–2 first', 'l')
    return g

# ------------------------------------------------------------------ the worlds
def world_vault():
    g = Iso(560, 400, 250, 70, 3.9, 'A settlement vault in isometric: a heavy block with a round door and its time lock in orange, on a plinth.')
    P = g.P
    g.box(0, 0, 0, 60, 46, 2, 'g', hatch=0, dz=-100)
    g.box(8, 8, 2, 40, 30, 26, 'g', hatch=1.0, roof=2.4)
    # round door on the +y face
    cx, cy, cz, r = 28, 38, 15, 9
    ring = []
    for k in range(48):
        t = 2 * math.pi * k / 48
        ring.append(P(cx + r * math.cos(t), cy, cz + r * math.sin(t)))
    d = 'M' + ' L'.join(f'{f(a)} {f(b)}' for a, b in ring) + 'Z'
    inner = []
    for k in range(48):
        t = 2 * math.pi * k / 48
        inner.append(P(cx + r * 0.72 * math.cos(t), cy, cz + r * 0.72 * math.sin(t)))
    d2 = 'M' + ' L'.join(f'{f(a)} {f(b)}' for a, b in inner) + 'Z'
    spokes = ''.join(g.line(P(cx, cy, cz), P(cx + r * 0.6 * math.cos(t), cy, cz + r * 0.6 * math.sin(t)), '#f6f1e8', 1.1) for t in (math.pi / 2, math.pi * 7 / 6, math.pi * 11 / 6))
    lock = P(cx + 6.5, cy, cz + 11.5)
    g.raw(500, f'<path d="{d}" fill="#24211e" stroke="#f6f1e8" stroke-width="1.3"/><path d="{d2}" fill="none" stroke="#f6f1e8" stroke-width=".8"/>' + spokes
          + f'<ellipse cx="{f(lock[0])}" cy="{f(lock[1])}" rx="5.4" ry="6.4" fill="#f39200" stroke="#fff8ec" stroke-width="1"/>')
    return g

def world_campus():
    g = campus(1)
    g.over = []
    g.label = 'An AI campus in isometric: four data halls, a substation with its transformers, and the transmission line.'
    g.w, g.h = 700, 470
    return g

def world_vessel():
    g = Iso(620, 420, 300, 92, 3.6, 'A container vessel in isometric: the hull, the bridge at the stern and stacked containers, one bay in orange.')
    P = g.P
    L, B, Hh = 84, 18, 7
    g.box(0, 0, 0, L, B, Hh, 'g', hatch=1.0, dz=-50)
    tip = (L + 12, B / 2)
    side = [P(L, B, 0), P(*tip, 0), P(*tip, Hh), P(L, B, Hh)]
    front = [P(L, 0, 0), P(*tip, 0), P(*tip, Hh), P(L, 0, Hh)]
    top = [P(L, 0, Hh), P(*tip, Hh), P(L, B, Hh)]
    hatch = ''.join(g.line(P(L, B, z), P(*tip, z), 'rgba(246,241,232,.26)') + g.line(P(L, 0, z), P(*tip, z), 'rgba(246,241,232,.26)') for z in [k * 0.55 for k in range(1, 13)])
    g.raw(-40, g.poly(front, '#1d1b18', '#f6f1e8', 1.05) + g.poly(side, '#2a2724', '#f6f1e8', 1.05) + hatch + g.poly(top, '#3b3733', '#f6f1e8', 1.05))
    g.box(3, 2, Hh, 8, B - 4, 13, 'gl', hatch=1.4)
    for b in range(10):
        for r in range(3):
            st = 'a' if b == 6 else 'g'
            g.box(14 + b * 6.8, 1.6 + r * 5, Hh, 6.2, 4.6, 6 if b not in (0, 9) else 4, st, hatch=1.3, dz=0.3)
    return g

if __name__ == '__main__':
    for s in (1, 2, 3, 4):
        open(os.path.join(OUT, f'iso-campus-{s}.html'), 'w').write(campus(s).svg().replace('viewBox="0 0 720 500"', 'viewBox="0 22 720 456"', 1))
    # each world drawing is framed to its own bounds, with an even margin
    VB = {1: '71 -32 406 333', 2: '13 81 699 365', 3: '220 5 375 300'}
    for i, g in enumerate([world_vault(), world_campus(), world_vessel()], 1):
        svg = g.svg('iso iso--w').replace(f'viewBox="0 0 {g.w} {g.h}"', f'viewBox="{VB[i]}"', 1)
        open(os.path.join(OUT, f'iso-world-{i}.html'), 'w').write(svg)
    print('ok')
