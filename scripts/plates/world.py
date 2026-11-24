#!/usr/bin/env python3
"""
One world, drawn once, used three times.

  src/partials/film.svg       How it works: the three districts on one slab,
                              with the scene layers the film animates
  src/partials/iso-world-N    Worlds: each district on its own
  src/partials/proving.html   Validation: the proving path, three gates

Language: graphite massing with fine white hatching on bone paper, orange only
where the machine changes something; leader labels in plain words.
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from iso import Iso, STYLE, f, tower

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'partials')
STYLE['w'] = dict(top='rgba(246,241,232,.10)', xf='rgba(246,241,232,.03)', yf='rgba(246,241,232,.06)', hatch='rgba(246,241,232,.30)', edge='#f6f1e8')
STYLE['wa'] = dict(top='#f7a432', xf='#cf7800', yf='#e58a06', hatch='rgba(40,20,0,.25)', edge='#fff8ec')
INK = '#141210'

# ------------------------------------------------------------------ fitting
def measure(build):
    """Run a drawing at unit scale and return its extent in screen units."""
    g = Iso(10, 10, 0, 0, 1.0, '')
    pts = []
    P0 = g.P
    def P(x, y, z=0):
        q = P0(x, y, z); pts.append(q); return q
    g.P = P
    build(g)
    xs, ys = [q[0] for q in pts], [q[1] for q in pts]
    return min(xs), min(ys), max(xs), max(ys)

def fitted(build, box, label):
    """An Iso whose drawing fills box = (x, y, w, h), centred."""
    x0, y0, x1, y1 = measure(build)
    bx, by, bw, bh = box
    s = min(bw / (x1 - x0), bh / (y1 - y0))
    ox = bx + (bw - (x1 - x0) * s) / 2 - x0 * s
    oy = by + (bh - (y1 - y0) * s) / 2 - y0 * s
    return Iso(0, 0, ox, oy, s, label)

# ------------------------------------------------------------------ primitives
def cyl(g, x, y, z, r, h, st='g', hatch=1.0, dz=0.0):
    S = STYLE[st]
    T, B = g.P(x, y, z + h), g.P(x, y, z)
    rx, ry = 1.2247 * r * g.s, 0.7071 * r * g.s
    side = (f'M{f(T[0]-rx)} {f(T[1])}L{f(B[0]-rx)} {f(B[1])}A{f(rx)} {f(ry)} 0 0 0 {f(B[0]+rx)} {f(B[1])}'
            f'L{f(T[0]+rx)} {f(T[1])}Z')
    out = f'<path d="{side}" fill="{S["yf"]}"/>'
    if hatch:
        k = 0.55 / hatch
        for i in range(1, int(h / k)):
            yy = B[1] - i * k * g.s
            out += f'<path d="M{f(B[0]-rx)} {f(yy)}A{f(rx)} {f(ry)} 0 0 0 {f(B[0]+rx)} {f(yy)}" fill="none" stroke="{S["hatch"]}" stroke-width=".6"/>'
    out += (f'<path d="M{f(T[0]-rx)} {f(T[1])}L{f(B[0]-rx)} {f(B[1])}A{f(rx)} {f(ry)} 0 0 0 {f(B[0]+rx)} {f(B[1])}L{f(T[0]+rx)} {f(T[1])}" fill="none" stroke="{S["edge"]}" stroke-width="1.05"/>'
            f'<ellipse cx="{f(T[0])}" cy="{f(T[1])}" rx="{f(rx)}" ry="{f(ry)}" fill="{S["top"]}" stroke="{S["edge"]}" stroke-width="1.05"/>')
    g.raw(x + y + dz, out)

def ring_x(g, x, cy, cz, r, n=40):
    """A circle standing on a face of constant x."""
    pts = [g.P(x, cy + r * math.cos(2 * math.pi * k / n), cz + r * math.sin(2 * math.pi * k / n)) for k in range(n)]
    return 'M' + ' L'.join(f'{f(a)} {f(b)}' for a, b in pts) + 'Z'

def tri_y(g, x0, x1, y, z, zt):
    return [g.P(x0, y, z), g.P(x1, y, z), g.P((x0 + x1) / 2, y, zt)]

def water(g, x0, x1, y0, y1, step=2.2, depth=-500):
    s = ''
    yy = y0
    k = 0
    while yy < y1:
        a, b = g.P(x0 + (k % 3) * 2, yy, 0), g.P(x1 - (k % 2) * 3, yy, 0)
        s += g.line(a, b, 'rgba(20,18,16,.22)', 0.7)
        yy += step; k += 1
    g.raw(depth, s)

# ------------------------------------------------------------------ the districts
def money(g, x0, y0):
    """A settlement bank: stepped plinth, hall, colonnade and pediment, two
    towers behind; on the hall's flank, a vault door of two rings."""
    g.box(x0, y0, 1.6, 36, 28, 1.0, 'gl', hatch=0, dz=-30)
    g.box(x0 + 1.2, y0 + 1.2, 2.6, 33.6, 25.6, 1.0, 'gl', hatch=0, dz=-29)
    g.box(x0 + 3, y0 + 3, 3.6, 30, 18, 13, 'g', hatch=1.0, roof=2.2)
    # colonnade in front of the hall's long face
    for k in range(8):
        cyl(g, x0 + 5 + k * 3.7, y0 + 24, 3.6, 0.75, 10.5, 'gl', hatch=1.4, dz=20)
    g.box(x0 + 3, y0 + 21.6, 14.1, 30, 4.4, 1.6, 'gl', hatch=0, dz=26)
    tri = tri_y(g, x0 + 3, x0 + 33, y0 + 26, 15.7, 21)
    S = STYLE['g']
    roof = [g.P(x0 + 3, y0 + 21.6, 15.7), g.P(x0 + 18, y0 + 21.6, 21), g.P(x0 + 18, y0 + 26, 21), g.P(x0 + 3, y0 + 26, 15.7)]
    g.raw(x0 + y0 + 52, g.poly(roof, S['top'], S['edge'], 1.05) + g.poly(tri, S['yf'], S['edge'], 1.05)
          + g.line(g.P(x0 + 9, y0 + 26, 16.6), g.P(x0 + 27, y0 + 26, 16.6), S['hatch'], .6))
    # the vault door: two rings on the flank (x = x0 + 33)
    xv = x0 + 33
    g.raw(x0 + y0 + 60, f'<path d="{ring_x(g, xv, y0 + 8.4, 9.8, 3.6)}" fill="#1d1b18" stroke="#f6f1e8" stroke-width="1.2"/>'
          f'<path d="{ring_x(g, xv, y0 + 13.2, 9.8, 3.6)}" fill="none" stroke="#f6f1e8" stroke-width="1.2"/>')
    # towers behind
    g.box(x0 + 2, y0 - 16, 1.6, 10, 10, 30, 'g', hatch=1.1, roof=0, dz=-40)
    g.box(x0 + 15, y0 - 13, 1.6, 8, 8, 21, 'g', hatch=1.1, dz=-38)
    return dict(vault=(xv, y0 + 10.8, 9.8), hall=(x0 + 18, y0 + 3, 16.6))

def power(g, x0, y0):
    """An AI campus: three data halls with rooftop plant, a substation yard
    with four transformers, water tanks, and the line coming in."""
    for i in range(3):
        hx = x0 + i * 14
        g.box(hx, y0 + 4, 1.6, 12, 24, 9, 'g', hatch=1.0)
        for r in range(4):
            g.box(hx + 2, y0 + 7 + r * 5.2, 10.6, 8, 3.2, 1.5, 'gl', hatch=0, dz=0.4)
    yx, yy = x0 + 2, y0 - 16
    g.raw(-200, g.poly([g.P(yx, yy, 1.6), g.P(yx + 24, yy, 1.6), g.P(yx + 24, yy + 14, 1.6), g.P(yx, yy + 14, 1.6)], 'none', '#f6f1e8', .8, ' stroke-dasharray="3 2"'))
    for k in range(4):
        g.box(yx + 2 + k * 5.6, yy + 3, 1.6, 3.6, 5.6, 4.2, 'g', hatch=1.3)
    g.box(yx + 1, yy + 10.5, 1.6, 22, 1, 7.5, 'gl', hatch=0)
    cyl(g, x0 + 42, y0 - 8, 1.6, 2.6, 6.5, 'g', hatch=1.2)
    cyl(g, x0 + 42, y0 - 1, 1.6, 2.6, 6.5, 'g', hatch=1.2)
    a1, b1 = tower(g, x0 + 30, y0 - 46, 18, -300)
    a2, b2 = tower(g, x0 + 20, y0 - 32, 18, -280)
    sub = g.P(yx + 12, yy + 11, 9)
    g.raw(-270, g.line(a1, a2, INK, .9) + g.line(b1, b2, INK, .9) + g.line(a2, sub, INK, .9) + g.line(b2, sub, INK, .9))
    return dict(sub=(yx + 12, yy + 6, 6), halls=(x0 + 20, y0 + 4, 11), line=(x0 + 20, y0 - 32, 16))

def trade(g, x0, y0):
    """A container port: stacks on the quay, a ship-to-shore crane, and a
    vessel alongside on the water."""
    for c in range(4):
        for r in range(3):
            g.box(x0 + 2 + c * 7, y0 + 2 + r * 5, 1.6, 6.2, 4.4, 3.6 + (c + r) % 2 * 3.4, 'g', hatch=1.3)
    cx = x0 + 30
    for lx, ly in ((cx, y0 + 30), (cx + 6, y0 + 30), (cx, y0 + 37), (cx + 6, y0 + 37)):
        g.box(lx, ly, 1.6, 1.1, 1.1, 21, 'gl', hatch=0, dz=40)
    g.box(cx - .5, y0 + 29, 22.6, 7.6, 9.6, 2, 'g', hatch=1.4, dz=44)
    g.box(cx + 2.6, y0 + 18, 24.6, 1.6, 42, 1.2, 'gl', hatch=0, dz=60)
    water(g, x0 - 8, x0 + 46, y0 + 41, y0 + 66)
    # the vessel alongside
    L, B, Hh, vx, vy = 34, 9, 3.6, x0 + 2, y0 + 48
    g.box(vx, vy, 0, L, B, Hh, 'g', hatch=1.0, dz=-20)
    tip = (vx + L + 6, vy + B / 2)
    S = STYLE['g']
    g.raw(vx + vy + 30, g.poly([g.P(vx + L, vy + B, 0), g.P(*tip, 0), g.P(*tip, Hh), g.P(vx + L, vy + B, Hh)], S['yf'], S['edge'], 1.05)
          + g.poly([g.P(vx + L, vy, Hh), g.P(*tip, Hh), g.P(vx + L, vy + B, Hh)], S['top'], S['edge'], 1.05))
    g.box(vx + 1.5, vy + 1, Hh, 4, B - 2, 7, 'gl', hatch=1.4, dz=1)
    for b in range(6):
        for r in range(2):
            g.box(vx + 7 + b * 4.4, vy + 1 + r * 3.6, Hh, 4, 3.2, 3 if b % 2 else 4.4, 'g', hatch=1.4, dz=1.2)
    return dict(ship=(vx + 18, vy + 4, 6), crane=(cx + 3, y0 + 33, 22), quay=(x0 + 12, y0 + 8, 6))

# ------------------------------------------------------------------ the film
def film():
    W, H = 1600, 900
    def build(g):
        g.box(-2, -20, 0, 154, 66, 1.6, 'g', hatch=0, dz=-900)
        g.raw(-880, g.line(g.P(2, 40, 1.6), g.P(148, 40, 1.6), 'rgba(246,241,232,.55)', .9, '7 5'))
        return money(g, 2, 2), power(g, 52, 4), trade(g, 102, -2)
    g = fitted(build, (300, 110, 1000, 700), '')
    P = g.P
    s = g.s
    m, p, t = build(g)
    road = [P(2, 40, 1.6), P(148, 40, 1.6)]
    base = ''.join(x for _, x in sorted(g.items, key=lambda q: q[0]))

    def lp(x, y, z): return P(x, y, z)
    trace = ''
    for n, (a, b, c) in enumerate([(lp(20, 30, 4), lp(48, 40, 22), lp(66, 30, 11)),
                                   (lp(88, 30, 11), lp(110, 42, 22), lp(122, 20, 6)),
                                   (lp(*p['line']), lp(70, -22, 26), lp(*p['sub']))]):
        trace += f'<path pathLength="1" style="--n:{n}" d="M{f(a[0])} {f(a[1])}Q{f(b[0])} {f(b[1])} {f(c[0])} {f(c[1])}" fill="none" stroke="#f39200" stroke-width="2.4" stroke-linecap="round"/>'

    def tag(n, at, to, text, side='r'):
        ax, ay = at; tx, ty = to
        el = tx - 22 if side == 'r' else tx + 22
        lx, anc = (tx + 10, 'start') if side == 'r' else (tx - 10, 'end')
        return (f'<g style="--n:{n}"><circle cx="{f(ax)}" cy="{f(ay)}" r="4.4" fill="{INK}" stroke="#f6f1e8" stroke-width="1.4"/>'
                f'<path d="M{f(ax)} {f(ay)}L{f(el)} {f(ty)}H{f(tx)}" stroke="{INK}" stroke-width="1.2" fill="none"/>'
                f'<text class="fm-l" x="{f(lx)}" y="{f(ty + 7)}" text-anchor="{anc}">{text}</text></g>')
    tags = (tag(0, lp(*m['hall']), (330, 120), 'Banks and settlement hours', 'l')
            + tag(1, lp(*p['sub']), (1150, 80), 'Substation and the grid')
            + tag(2, lp(*p['halls']), (1290, 330), 'Data halls under contract')
            + tag(3, lp(*t['ship']), (1300, 790), 'Cargo, routes and the port')
            + tag(4, lp(12, 40, 1.6), (330, 700), 'Contracts and rules', 'l'))

    def ring(at, r=34):
        return f'<circle class="fm-ring" cx="{f(at[0])}" cy="{f(at[1])}" r="{r}" fill="none" stroke="{INK}" stroke-width="2.2" stroke-dasharray="6 5"/>'
    stress = ring(lp(*p['sub']), 40) + ring(lp(*m['vault']), 34) + ring(lp(*t['ship']), 40)
    a2 = lp(*p['line']); sub = lp(*p['sub'])
    stress += f'<path class="fm-wirehot" d="M{f(a2[0])} {f(a2[1])}L{f(sub[0])} {f(sub[1])}" stroke="{INK}" stroke-width="3" stroke-dasharray="10 10" fill="none"/>'

    # what the machine found, in orange
    fg = Iso(W, H, g.ox, g.oy, s, '')
    for k in range(3):
        fg.box(94, 18 + k * 6, 1.6, 7, 4.4, 4.4, 'a', hatch=1.2)
    found0 = ''.join(x for _, x in sorted(fg.items, key=lambda q: q[0]))
    fg.items = []
    fg.box(40, -14, 1.6, 8, 7, 6, 'a', hatch=1.2)
    found1 = ''.join(x for _, x in sorted(fg.items, key=lambda q: q[0]))
    r0, r1, r2 = P(100, 56, 0), P(134, 72, 0), P(156, 44, 0)
    found2 = f'<path d="M{f(r0[0])} {f(r0[1])}Q{f(r1[0])} {f(r1[1])} {f(r2[0])} {f(r2[1])}" fill="none" stroke="#f39200" stroke-width="3" stroke-dasharray="1"/>'
    pl = lambda x, n: f'<g style="--n:{n}">' + x.replace('<path ', '<path pathLength="1" ') + '</g>'
    found = pl(found0, 0) + pl(found1, 1) + pl(found2, 2)

    coins = ''.join(f'<g class="fm-coin" style="--d:{k * 2.6}s;offset-path:path(\'M{f(road[0][0])} {f(road[0][1])}L{f(road[1][0])} {f(road[1][1])}\')"><rect x="-5" y="-5" width="10" height="10" fill="#f39200" stroke="#fff8ec" stroke-width="1.2" transform="rotate(30)"/></g>' for k in range(4))

    # the futures behind: folder cards, each holding the slab in outline
    sl = [P(-2, -20, 1.6), P(152, -20, 1.6), P(152, 46, 1.6), P(-2, 46, 1.6)]
    sil = 'M' + ' L'.join(f'{f(a)} {f(b)}' for a, b in sl) + 'Z'
    cards = ''
    for k in range(6):
        cards += (f'<g class="fm-cardk" style="--k:{k}"><path d="M300 230A18 18 0 0 1 318 212H560L600 160H1282A18 18 0 0 1 1300 178V732A18 18 0 0 1 1282 750H318A18 18 0 0 1 300 732Z" fill="#f3eee5" stroke="{INK}" stroke-width="2"/>'
                  f'<path d="M314 238A12 12 0 0 1 326 226H566L606 174H1274A12 12 0 0 1 1286 186V724A12 12 0 0 1 1274 736H326A12 12 0 0 1 314 724Z" fill="none" stroke="{INK}" stroke-width="1"/>'
                  f'<path d="{sil}" fill="none" stroke="rgba(20,18,16,.28)" stroke-width="2" transform="translate(0 40)"/></g>')

    rec = ('<g class="fm-rec">'
           f'<path d="M1010 556A16 16 0 0 1 1026 540H1150L1180 506H1494A16 16 0 0 1 1510 522V842A16 16 0 0 1 1494 858H1026A16 16 0 0 1 1010 842Z" fill="#f6f1e8" stroke="{INK}" stroke-width="2"/>'
           f'<path d="M1022 562A10 10 0 0 1 1032 552H1156L1186 518H1488A10 10 0 0 1 1498 528V836A10 10 0 0 1 1488 846H1032A10 10 0 0 1 1022 836Z" fill="none" stroke="{INK}" stroke-width="1"/>'
           '<text class="fm-k" x="1048" y="584">No. 0187</text>'
           '<text class="fm-s" x="1048" y="632">Committed before</text><text class="fm-s" x="1048" y="672">the outcome</text>'
           f'<path d="M1048 704H1472M1048 750H1472M1048 796H1472" stroke="rgba(20,18,16,.18)" stroke-width="1.4"/>'
           '<text class="fm-k" x="1048" y="734">RULES</text><text class="fm-v" x="1472" y="734" text-anchor="end">Same for both</text>'
           '<text class="fm-k" x="1048" y="780">HASH</text><text class="fm-v" x="1472" y="780" text-anchor="end">3e9f…c21a</text>'
           '<text class="fm-k" x="1048" y="826">SCORED</text><text class="fm-v" x="1472" y="826" text-anchor="end">After the outcome</text>'
           '<g class="fm-stamp"><circle cx="1418" cy="620" r="40" fill="none" stroke="#f39200" stroke-width="3"/><circle cx="1418" cy="620" r="32" fill="none" stroke="#f39200" stroke-width="1.2"/>'
           '<path d="M1400 621l12 12 24-26" fill="none" stroke="#f39200" stroke-width="4" stroke-linecap="square"/></g></g>')

    grid = ('<defs><pattern id="fm-g1" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(20,18,16,.06)" stroke-width="1"/></pattern>'
            '<pattern id="fm-g2" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="rgba(20,18,16,.09)" stroke-width="1"/></pattern></defs>')
    svg = (f'<svg class="fm__svg" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Three districts on one slab: a settlement bank, an AI campus with its substation, and a container port. The machine traces how they depend on each other, finds where the plan breaks, adds what holds in orange, and records its answer before the outcome.">'
           + grid + f'<rect width="{W}" height="{H}" fill="#efe9de"/><rect width="{W}" height="{H}" fill="url(#fm-g1)"/><rect width="{W}" height="{H}" fill="url(#fm-g2)"/>'
           + '<rect class="fm-gridfill" width="1600" height="900" fill="url(#fm-g2)"/>'
           + f'<g class="fm-cards">{cards}</g>'
           + f'<g class="fm-world"><g class="fm-base">{base}{coins}</g>'
           + f'<g class="fm-trace">{trace}</g><g class="fm-tags">{tags}</g><g class="fm-stress">{stress}</g><g class="fm-found">{found}</g></g>'
           + rec + '</svg>')
    open(os.path.join(OUT, 'film.svg'), 'w').write(svg)

# ------------------------------------------------------------------ the worlds, one district each
def worlds():
    slabs = {money: (-4, -22, 44, 54), power: (-2, -20, 50, 52), trade: (-2, -2, 50, 44)}
    labels = {money: 'A settlement bank in isometric: stepped plinth, colonnade, two towers behind, and a vault door of two rings.',
              power: 'An AI campus in isometric: three data halls, a substation with four transformers, water tanks, and the line coming in.',
              trade: 'A container port in isometric: stacks on the quay, a ship-to-shore crane, and a vessel alongside.'}
    for i, fn in enumerate([money, power, trade], 1):
        sx, sy, sw, sd = slabs[fn]
        def build(g, fn=fn, sx=sx, sy=sy, sw=sw, sd=sd):
            g.box(sx, sy, 0, sw, sd, 1.6, 'g', hatch=0, dz=-900)
            fn(g, 0, 0)
        g = fitted(build, (30, 30, 840, 640), labels[fn])
        build(g)
        svg = g.svg('iso iso--w').replace('viewBox="0 0 0 0"', 'viewBox="0 0 900 700"', 1)
        open(os.path.join(OUT, f'iso-world-{i}.html'), 'w').write(svg)

# ------------------------------------------------------------------ validation: the proving path
def proving():
    label = 'The proving path, in isometric: a track that passes through three gates, each larger than the last, with the machine’s path drawn in orange.'
    def frame(g):
        g.box(0, 0, 0, 120, 16, 1.2, 'w', hatch=0, dz=-900)
        g.P(-6, 8, 1.4); g.P(124, 8, 1.4); g.P(100, 8, 30)
    g = fitted(frame, (60, 90, 1080, 400), label)
    P = g.P
    g.box(0, 0, 0, 120, 16, 1.2, 'w', hatch=0, dz=-900)
    for k in range(30):
        g.raw(-800, g.line(P(2 + k * 4, 3, 1.2), P(2 + k * 4, 13, 1.2), 'rgba(246,241,232,.22)', .7))
    gates = [(18, 9, 2.2), (58, 14, 3.0), (98, 20, 4.0)]
    for gx, gh, gw in gates:
        g.box(gx, -2, 1.2, gw, gw, gh, 'w', hatch=1.1)
        g.box(gx, 18 - gw, 1.2, gw, gw, gh, 'w', hatch=1.1, dz=2)
        g.box(gx, -2, 1.2 + gh, gw, 20, gw * 0.8, 'w', hatch=1.1, dz=3)
    a, b = P(-6, 8, 1.4), P(124, 8, 1.4)
    g.over.append(f'<path d="M{f(a[0])} {f(a[1])}L{f(b[0])} {f(b[1])}" stroke="#f39200" stroke-width="2.4" fill="none"/>'
                  f'<rect x="{f(b[0]-6)}" y="{f(b[1]-6)}" width="12" height="12" fill="#f39200" transform="rotate(30 {f(b[0])} {f(b[1])})"/>')
    for (gx, gh, gw), (txt, n) in zip(gates, [('RL environments', '01'), ('Replay', '02'), ('Live decisions', '03')]):
        top = P(gx + gw / 2, 8, 1.2 + gh + gw * 0.8)
        ty = top[1] - 46
        g.over.append(f'<g class="pv-l"><path d="M{f(top[0])} {f(top[1]-4)}V{f(ty+8)}" stroke="#f6f1e8" stroke-width="1"/>'
                      f'<text x="{f(top[0])}" y="{f(ty-6)}" text-anchor="middle"><tspan class="pv-n">{n}</tspan>  {txt}</text></g>')
    svg = g.svg('iso pv__svg').replace('viewBox="0 0 0 0"', 'viewBox="0 0 1200 520"', 1)
    open(os.path.join(OUT, 'proving.html'), 'w').write(svg)

if __name__ == '__main__':
    film(); worlds(); proving()
    print('ok')
