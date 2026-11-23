#!/usr/bin/env python3
"""
The Worlds drawings, in the plates' line language: a settlement vault in front
view (money), a data-centre campus in plan (power), a container vessel in plan
and elevation (trade). One orange element in each: what the machine watches.
Writes src/partials/world-1.html … world-3.html (inline SVG).
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from draw import Doc, f, pol, arc, sector, hatch_sector, leader

W, H = 800, 960

def hatch_rect(d, x, y, w, h, step=12, cls='l3'):
    """45° hatching clipped to a rectangle (wall sections)."""
    n = int((w + h) / step)
    for k in range(1, n):
        c = k * step
        x0, y0 = x + max(0, c - h), y + min(h, c)
        x1, y1 = x + min(w, c), y + max(0, c - w)
        d.line(x0, y0, x1, y1, cls)

# ------------------------------------------------------------------ money
def vault():
    d = Doc(W, H, 'Front view of a settlement vault door: a round door in a heavy frame, twelve bolts, a three-spoke wheel and, in orange, the time lock.')
    cx, cy = 420, 400
    # the wall and frame
    d.rect(110, 90, 620, 620, 'l2')
    d.rect(140, 120, 560, 560, 'l1')
    for (x, y) in [(110, 90), (630, 90), (110, 610), (630, 610)]:
        hatch_rect(d, x + 2, y + 2, 96, 96, 14)
    d.step()
    d.circle(cx, cy, 262, 'l1'); d.circle(cx, cy, 250, 'l2')
    d.step()
    for k in range(12):
        a = k * 30 + 15
        # a bolt: a bar along the radius, through the door's edge
        ux, uy = math.cos(math.radians(a)), math.sin(math.radians(a)); vx, vy = -uy, ux
        p = [(cx + ux * r + vx * t, cy + uy * r + vy * t) for r, t in [(236, -5), (290, -5), (290, 5), (236, 5)]]
        d.path('M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in p) + 'Z', 'l1')
    d.step()
    d.circle(cx, cy, 214, 'l2'); d.circle(cx, cy, 206, 'l3')
    for k in range(60):
        p0 = pol(cx, cy, 214, k * 6); p1 = pol(cx, cy, 206, k * 6)
        d.line(*p0, *p1, 'l3')
    d.circle(cx, cy, 128, 'l1'); d.circle(cx, cy, 118, 'l3')
    d.step()
    # hinge
    for y in (cy - 150, cy + 110):
        d.rect(118, y, 44, 40, 'l1'); d.line(140, y, 140, y + 40, 'l3')
    # the wheel
    for a in (90, 210, 330):
        p0 = pol(cx, cy, 30, a); p1 = pol(cx, cy, 112, a)
        d.line(*p0, *p1, 'l1')
        d.circle(*pol(cx, cy, 120, a), 12, 'l1')
    d.circle(cx, cy, 30, 'l1'); d.circle(cx, cy, 12, 'l2')
    d.step()
    # the time lock, in orange
    tx, ty = cx, cy - 166
    d.circle(tx, ty, 30, 'ac'); d.circle(tx, ty, 22, 'l3')
    for k in range(24):
        p0 = pol(tx, ty, 30, k * 15); p1 = pol(tx, ty, 30 - (7 if k % 6 == 0 else 4), k * 15)
        d.line(*p0, *p1, 'ac' if k % 6 == 0 else 'l3')
    d.line(tx, ty, *pol(tx, ty, 18, -60), 'ac')
    d.step()
    leader(d, tx + 30, ty, 600, 168, 'TIME LOCK')
    leader(d, *pol(cx, cy, 290, 45), 640, 760, 'BOLTS')
    leader(d, 140, cy - 130, 90, 760, 'HINGE', 'l')
    d.step()
    return d

# ------------------------------------------------------------------ power
def campus():
    d = Doc(W, H, 'Site plan of a data-centre campus: three data halls, a substation, storage and the transmission line; the interconnection is drawn in orange.')
    # site boundary
    d.rect(70, 150, 680, 600, 'l2 dsh')
    # transmission line from the top left, pylons as crossed squares
    for i, (x, y) in enumerate([(40, 40), (150, 80), (260, 120)]):
        d.rect(x - 12, y - 12, 24, 24, 'l1'); d.line(x - 12, y - 12, x + 12, y + 12, 'l2'); d.line(x - 12, y + 12, x + 12, y - 12, 'l2')
    d.path('M0 18L40 40L150 80L260 120', 'l2'); d.path('M0 58L40 40', 'l3')
    d.step()
    # the interconnection, in orange
    d.path('M260 120L330 196', 'ac')
    # substation
    sx, sy = 300, 190
    d.rect(sx, sy, 170, 120, 'l1')
    for r in range(3):
        for c in range(4):
            d.rect(sx + 16 + c * 38, sy + 18 + r * 32, 24, 20, 'l2')
    d.line(sx + 8, sy + 60, sx + 162, sy + 60, 'l3')
    d.step()
    # three data halls with their rack rows and cooling on the long side
    for i in range(3):
        x, y, w, h = 110 + i * 205, 360, 170, 290
        d.rect(x, y, w, h, 'l1'); d.rect(x + 8, y + 8, w - 16, h - 16, 'l3')
        for k in range(1, 12):
            d.line(x + 22, y + 10 + k * 22.5, x + w - 22, y + 10 + k * 22.5, 'l3')
        for k in range(7):
            d.rect(x + 14 + k * 21.5, y - 22, 16, 14, 'l2')
    d.step()
    # storage, and the road loop
    d.rect(520, 190, 200, 120, 'l1'); hatch_rect(d, 520, 190, 200, 120, 10)
    d.path('M90 700H730V340H90Z', 'l3')
    # feeders from the substation to each hall
    for i in range(3):
        d.path(f'M{f(385)} {f(310)}V{f(335)}H{f(195 + i * 205)}V{f(338)}', 'l2')
    d.step()
    # north arrow and scale
    d.path('M700 790L712 830L700 822L688 830Z', 'l1'); d.text(700, 780, 'N', 'tn', 'middle')
    d.line(560, 836, 660, 836, 'l2'); d.line(560, 830, 560, 842, 'l2'); d.line(610, 832, 610, 840, 'l3'); d.line(660, 830, 660, 842, 'l2')
    leader(d, 300, 154, 520, 40, 'INTERCONNECTION', 'r')
    leader(d, 385, 250, 600, 104, 'SUBSTATION')
    leader(d, 620, 250, 640, 136, '') if False else None
    leader(d, 195, 520, 90, 800, 'DATA HALLS', 'l') if False else leader(d, 195, 650, 120, 800, 'DATA HALLS', 'r')
    d.step()
    return d

# ------------------------------------------------------------------ trade
def vessel():
    d = Doc(W, H, 'A container vessel in elevation and in plan: the hull, the bridge and the stacked containers; one bay of cargo is drawn in orange.')
    # elevation
    x0, x1, yd = 60, 740, 300
    d.path(f'M{x0} {yd}L{x0 + 20} {yd + 110}H{x1 - 70}Q{x1 - 10} {yd + 100} {x1} {yd}Z', 'l1')
    d.line(x0 + 10, yd + 70, x1 - 4, yd + 70, 'l3 cl')
    d.text(x0 + 60, yd + 62, 'WATERLINE', 'tn')
    d.step()
    # containers in elevation: bays of stacks
    bays = [(110 + k * 52, 4 if k not in (0, 10) else 3) for k in range(11)]
    for k, (bx, n) in enumerate(bays):
        for r in range(n):
            cls = 'ac' if k == 6 else 'l2'
            d.rect(bx, yd - 26 * (r + 1), 48, 24, cls)
    # the bridge at the stern
    d.rect(70, yd - 150, 34, 150, 'l1')
    for r in range(5):
        d.rect(76, yd - 140 + r * 26, 22, 12, 'l3')
    d.line(66, yd - 156, 108, yd - 156, 'l1')
    d.step()
    # plan
    yp = 600
    d.path(f'M{x0} {yp - 60}H{x1 - 90}Q{x1} {yp - 40} {x1 + 20} {yp}Q{x1} {yp + 40} {x1 - 90} {yp + 60}H{x0}Z', 'l1')
    d.line(x0, yp, x1 + 20, yp, 'l3 cl')
    for k in range(11):
        bx = 110 + k * 52
        for r in range(4):
            cls = 'ac' if k == 6 else 'l3'
            d.rect(bx, yp - 50 + r * 25, 48, 22, cls)
    d.rect(70, yp - 44, 34, 88, 'l1')
    d.step()
    # views named, and the bay called out
    d.text(60, 120, 'ELEVATION', 'tx')
    d.text(60, 500, 'PLAN', 'tx')
    leader(d, 110 + 6 * 52 + 24, yd - 104, 560, 150, 'ONE BAY OF CARGO')
    d.step()
    return d

if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'partials')
    for i, (doc, cap) in enumerate([(vault(), 'Settlement vault <em>— FRONT VIEW</em>'),
                                    (campus(), 'Data-centre campus <em>— SITE PLAN</em>'),
                                    (vessel(), 'Container vessel <em>— PLAN AND ELEVATION</em>')], 1):
        svg = doc.svg('fmp__svg').replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" ', 1)
        open(os.path.join(out, f'world-{i}.html'), 'w').write(svg + f'<figcaption class="fmp__cap"><i></i>{cap}</figcaption>')
    print('ok')
