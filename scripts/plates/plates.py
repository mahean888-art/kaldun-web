#!/usr/bin/env python3
"""
How it works, as four plates. Each is a technical drawing of the same sample
institution (a dollar issuer) at one step: its world in plan, the draft pushed
until it breaks, the same world with the terms found, and the record.
Writes src/partials/plates.html (four <svg>s, in order).
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from draw import Doc, f, pol, arc, sector, hatch_sector, leader, ruler

W, H = 1200, 675
PODS = [(-58, 'bank'), (-34, 'bank'), (-10, 'bank'), (14, 'bank'),
        (112, 'exchange'), (150, 'fund'), (198, 'chains'), (240, 'partners')]

def centre_lines(d, cx, cy, r):
    d.line(cx - r, cy, cx + r, cy, 'l3 cl'); d.line(cx, cy - r, cx, cy + r, 'l3 cl')

def plan(d, cx, cy, s=1.0, ticks=True, extra=None, broken=None):
    """The issuer in its world, in plan."""
    R = lambda r: r * s
    centre_lines(d, cx, cy, R(272))
    d.circle(cx, cy, R(250), 'l2')
    if ticks:
        for k in range(72):
            a = k * 5
            x0, y0 = pol(cx, cy, R(250), a); x1, y1 = pol(cx, cy, R(250 - (11 if k % 6 == 0 else 5)), a)
            d.line(x0, y0, x1, y1, 'l3')
    d.step()
    d.circle(cx, cy, R(206), 'l2 dsh')
    d.step()
    for a, kind in PODS:
        x0, y0 = pol(cx, cy, R(108), a); x1, y1 = pol(cx, cy, R(168), a)
        d.line(x0, y0, x1, y1, 'l2')
    d.step()
    for a, kind in PODS:
        w = 9 if kind == 'bank' else 11
        d.path(sector(cx, cy, R(168), R(194), a - w, a + w), 'l1')
        d.path(sector(cx, cy, R(173), R(189), a - w + 2.2, a + w - 2.2), 'l3')
        x0, y0 = pol(cx, cy, R(168), a); x1, y1 = pol(cx, cy, R(176), a)
        d.line(x0, y0, x1, y1, 'l2')
    d.step()
    d.circle(cx, cy, R(108), 'l1'); d.circle(cx, cy, R(101), 'l2')
    for q in range(4):
        a0, a1 = q * 90 + 9, q * 90 + 81
        d.path(sector(cx, cy, R(40), R(94), a0, a1), 'l2')
        hatch_sector(d, cx, cy, R(47), R(88), a0, a1, 12)
    for a in (0, 90):
        for off in (-7, 7):
            dx, dy = pol(0, 0, R(off), a + 90)
            x0, y0 = pol(cx + dx, cy + dy, R(108), a); x1, y1 = pol(cx + dx, cy + dy, R(108), a + 180)
            d.line(x0, y0, x1, y1, 'l1')
    d.step()
    d.circle(cx, cy, R(26), 'ac'); d.rect(cx - R(5), cy - R(5), R(10), R(10), 'ac')
    if broken is not None:
        px, py = pol(cx, cy, R(181), broken)
        k = R(16)
        d.line(px - k, py - k, px + k, py + k, 'l1'); d.line(px - k, py + k, px + k, py - k, 'l1')
        d.circle(px, py, R(26), 'l2')
        tx, ty = pol(cx, cy, R(262), broken)
        d.text(tx, ty, 'BREAKS', 'tn', 'start')
    if extra:
        extra(d, cx, cy, R)
    d.step()

def spec(d, x, y, w, rows, title=None):
    if title:
        d.text(x, y, title, 'tx tx--k'); y += 24
    for k, v in rows:
        d.line(x, y, x + w, y, 'l3')
        d.text(x, y + 27, k, 'tx')
        d.text(x, y + 55, v, 'tv')
        y += 76
    d.line(x, y, x + w, y, 'l3')

# ------------------------------------------------------------------ 01
def plate1():
    d = Doc(W, H, 'Plan of a dollar issuer in its world: the issuer at the centre in four quarters, its banks, exchange, fund, chains and partners on the ring of rails, and the market around it.')
    cx, cy, s = 430, 290, 0.94
    plan(d, cx, cy, s)
    leader(d, *pol(cx, cy, 194 * s, -46), 720, 70, 'BANKS')
    leader(d, *pol(cx, cy, 206 * s, 26), 730, 290, '24/7 RAILS')
    leader(d, *pol(cx, cy, 250 * s, 50), 720, 500, 'MARKETS')
    leader(d, *pol(cx, cy, 194 * s, 240), 160, 70, 'PARTNERS', 'l')
    leader(d, *pol(cx, cy, 70 * s, 200), 196, 290, 'THE ISSUER', 'l')
    leader(d, *pol(cx, cy, 194 * s, 150), 160, 500, 'FUND', 'l')
    d.step()
    spec(d, 920, 90, 230, [('THE WORLD · SHARED', '25 banks, 140 partners'),
                           ('THE ISSUER · ITS OWN', '$41.6B reserve, ledger'),
                           ('POLICY', 'Reserve rules, bank limits'),
                           ('REPLAY', '78 held-out weeks, 1.8%')], 'MODEL V15')
    return d

# ------------------------------------------------------------------ 02
def truss(d, x0, x1, y, h, brk=None):
    """A girder in elevation: two chords and their diagonals; past brk it is broken."""
    xb = brk if brk else x1
    d.line(x0, y, xb - 6, y, 'l1'); d.line(x0, y + h, xb + 4, y + h, 'l1')
    n = int((xb - x0) // 36)
    for k in range(n):
        xa = x0 + k * 36; xm = xa + 18; xn = xa + 36
        d.line(xa, y + h, xm, y, 'l2'); d.line(xm, y, xn, y + h, 'l2')
        d.line(xa, y, xa, y + h, 'l3')
    if brk:
        # the broken span: dashed, sagging
        d.path(f'M{f(xb + 10)} {f(y + 10)}Q{f((xb + x1) / 2)} {f(y + 70)} {f(x1)} {f(y + 46)}', 'l2 dsh')
        d.path(f'M{f(xb + 14)} {f(y + h + 8)}Q{f((xb + x1) / 2)} {f(y + h + 70)} {f(x1)} {f(y + h + 46)}', 'l2 dsh')
        d.path('M' + ' L'.join(f'{f(xb + dx)} {f(y + dy)}' for dx, dy in
                               [(-6, -16), (4, 4), (-4, 14), (8, 26), (0, 38), (6, h + 14)]), 'ac')

def support(d, x, y):
    d.path(f'M{f(x)} {f(y)}L{f(x - 16)} {f(y + 22)}H{f(x + 16)}Z', 'l1')
    for k in range(6):
        d.line(x - 22 + k * 8, y + 22, x - 30 + k * 8, y + 32, 'l3')
    d.line(x - 26, y + 22, x + 26, y + 22, 'l1')

def scale(d, x0, x1, y, frac_draft, label, val, cls_marker='l1'):
    d.text(x0, y - 16, label, 'tx')
    d.text(x1, y - 16, val, 'tv', 'end') if False else None
    d.line(x0, y, x1, y, 'l3')
    for k in range(11):
        xx = x0 + (x1 - x0) * k / 10
        d.line(xx, y - (6 if k % 5 == 0 else 3), xx, y + (6 if k % 5 == 0 else 3), 'l3')
    xd = x0 + (x1 - x0) * frac_draft
    d.line(x0, y, xd, y, 'l1')
    d.path(f'M{f(xd)} {f(y - 2)}L{f(xd - 6)} {f(y - 13)}H{f(xd + 6)}Z', 'l1')
    d.text(xd + 12, y - 4, val, 'tn')

def row(d, x0, xs, x1, y, frac, label, val):
    d.text(x0, y + 5, label, 'tx')
    d.line(xs, y, x1, y, 'l3')
    for k in range(11):
        xx = xs + (x1 - xs) * k / 10
        d.line(xx, y - (6 if k % 5 == 0 else 3), xx, y + (6 if k % 5 == 0 else 3), 'l3')
    xd = xs + (x1 - xs) * frac
    d.line(xs, y, xd, y, 'l1')
    d.path(f'M{f(xd)} {f(y - 3)}L{f(xd - 6)} {f(y - 14)}H{f(xd + 6)}Z', 'l1')
    d.text(xd + 12, y - 8, val, 'tn')

def plate2():
    d = Doc(W, H, 'Elevation of the draft arrangement as a girder under a growing weekend outflow: it breaks at 380 million dollars. Below, the other stresses and where the draft breaks under each.')
    x0, x1, y = 90, 800, 136
    # load arrows, growing left to right
    for k in range(12):
        x = x0 + 30 + k * 56
        L = 14 + k * 5.2
        d.line(x, y - 18 - L, x, y - 10, 'l2')
        d.path(f'M{f(x - 4)} {f(y - 17)}L{f(x)} {f(y - 9)}L{f(x + 4)} {f(y - 17)}', 'l2')
    d.text(x0, 50, 'WEEKEND OUTFLOW, RISING', 'tx')
    d.step()
    xb = x0 + (x1 - x0) * 0.152 / 0.7 * 0.7  # placeholder, set below
    # scale: $0 to $2.5B over x0..x1
    def X(v): return x0 + (x1 - x0) * v / 2.5
    xb = X(0.38)
    support(d, x0, y + 34); 
    truss(d, x0, x1, y, 34, brk=xb)
    support(d, x1, y + 80)
    d.step()
    # the dimension rule under the girder
    yr = y + 150
    d.line(x0, yr, x1, yr, 'l2')
    for v, lab in [(0, '$0'), (0.5, '$0.5B'), (1.0, '$1B'), (1.5, '$1.5B'), (2.0, '$2B'), (2.5, '$2.5B')]:
        d.line(X(v), yr - 6, X(v), yr + 6, 'l2'); d.text(X(v), yr + 28, lab, 'tn', 'middle')
    d.line(xb, y + 60, xb, yr, 'ac dsh')
    d.dot(xb, yr, 4, 'acf')
    d.text(xb + 14, y + 112, 'BREAKS · $380M', 'tx tx--a')
    d.step()
    # the other stresses, each on its own scale
    for i, (fr, lab, val) in enumerate([(2.3 / 8, 'PARTNER N SURGE', '2.3×'), (3.5 / 48, 'ONE BANK OFFLINE', '3.5 h'),
                                         (380 / 690, 'MARCH 2023 WEEKEND', 'short $310M')]):
        row(d, x0, 400, x1, 412 + i * 52, fr, lab, val)
    d.step()
    spec(d, 920, 90, 230, [('THE DRAFT BREAKS AT', '$380M weekend outflow'),
                           ('WORST SHORTFALL', '$310M'),
                           ('METHOD', 'Pushed until par breaks'),
                           ('PROBABILITIES', 'None assumed')], 'STRESS REGIMES')
    return d

# ------------------------------------------------------------------ 03
def plate3():
    d = Doc(W, H, 'The same plan twice. Left, the draft, broken at one bank. Right, with the three terms found: a second payout bank on the 24/7 rails, a daily cap per merchant, and notice with a morning fund sweep.')
    def found(d, cx, cy, R):
        # 1 a second payout bank on the rails
        a = 38
        d.path(sector(cx, cy, R(168), R(194), a - 9, a + 9), 'ac')
        x0, y0 = pol(cx, cy, R(108), a); x1, y1 = pol(cx, cy, R(168), a)
        d.line(x0, y0, x1, y1, 'ac')
        d.path(arc(cx, cy, R(206), a - 40, a + 14), 'ac')
        # 2 caps across the partner spoke
        for r in (128, 140, 152):
            p0 = pol(cx, cy, R(r), 240 - 5); p1 = pol(cx, cy, R(r), 240 + 5)
            d.line(*p0, *p1, 'ac')
        # 3 notice: a time arc by the fund
        d.path(arc(cx, cy, R(222), 136, 164), 'ac')
        for t in (136, 150, 164):
            p0 = pol(cx, cy, R(216), t); p1 = pol(cx, cy, R(228), t)
            d.line(*p0, *p1, 'ac')
    s = 0.74
    plan(d, 280, 268, s, ticks=False, broken=-34)
    plan(d, 820, 268, s, ticks=False, extra=found)
    d.text(280, 40, 'THE DRAFT', 'tx tx--k', 'middle')
    d.text(280, 66, 'AS WRITTEN', 'tn', 'middle')
    d.text(820, 40, 'WITH THE TERMS FOUND', 'tx tx--a', 'middle')
    # numbered callouts
    for n, (x, y) in enumerate([pol(820, 268, 268 * s, 30), pol(820, 268, 268 * s, 240), pol(820, 268, 268 * s, 150)], 1):
        d.circle(x, y, 13, 'ac'); d.text(x, y + 5, str(n), 'tn tx--a', 'middle')
        lab, side = [('SECOND BANK', 'r'), ('DAILY CAP', 'l'), ('NOTICE', 'l')][n - 1]
        d.text(x + (22 if side == 'r' else -22), y + 5, lab, 'tn tx--a', 'start' if side == 'r' else 'end')
    d.step()
    # rules under each: where it breaks
    for cx, v, cls, lab in [(280, 0.38, 'l1', 'BREAKS · $380M'), (820, 1.9, 'ac', 'BREAKS · $1.9B')]:
        x0, x1, y = cx - 200, cx + 200, 520
        d.line(x0, y, x1, y, 'l3')
        for k in range(6):
            xx = x0 + (x1 - x0) * k / 5; d.line(xx, y - 5, xx, y + 5, 'l3')
        xv = x0 + (x1 - x0) * v / 2.5
        d.line(x0, y, xv, y, cls)
        d.dot(xv, y, 4, 'acf' if cls == 'ac' else 'fd')
        d.text(xv, y - 16, lab, 'tx tx--a' if cls == 'ac' else 'tx', 'middle')
    d.text(820, 66, '312 OPTIONS TRIED · 3 KEPT', 'tn', 'middle')
    d.step()
    return d

# ------------------------------------------------------------------ 04
def folder(d, x, y, w, h, tw, th, r, cls):
    d.path(f'M{f(x)} {f(y + th + r)}A{r} {r} 0 0 1 {f(x + r)} {f(y + th)}H{f(x + tw)}L{f(x + tw + 34)} {f(y)}'
           f'H{f(x + w - r)}A{r} {r} 0 0 1 {f(x + w)} {f(y + r)}V{f(y + h - r)}A{r} {r} 0 0 1 {f(x + w - r)} {f(y + h)}'
           f'H{f(x + r)}A{r} {r} 0 0 1 {f(x)} {f(y + h - r)}Z', cls)

def plate4():
    d = Doc(W, H, 'The record: a filed card for the task, with its answer, written down before the outcome, its hash, and when it will be scored; beside it, the line from commitment to outcome to score.')
    x, y, w, h = 110, 36, 520, 500
    folder(d, x, y, w, h, 210, 30, 22, 'l1')
    folder(d, x + 16, y + 16, w - 32, h - 32, 196, 30, 14, 'l2')
    d.text(x + 18, y + 18, 'THE RECORD', 'tx tx--k')
    d.step()
    d.text(x + 56, y + 116, 'NO. 0412', 'tn')
    d.text(x + 56, y + 162, 'Instant redemption', 'ts')
    d.text(x + 56, y + 206, 'for Partner N', 'ts')
    rows = [('ANSWER', 'Yes, with three terms'), ('WEEKEND RUN HELD', '$380M → $1.9B'),
            ('COMMITTED', 'Before the outcome'), ('HASH', '7c41…a9e0'), ('SCORED', 'After 90 days')]
    yy = y + 250
    for k, v in rows:
        d.line(x + 56, yy, x + w - 56, yy, 'l3')
        d.text(x + 56, yy + 30, k, 'tx'); d.text(x + w - 56, yy + 30, v, 'tv', 'end')
        yy += 46
    d.line(x + 56, yy, x + w - 56, yy, 'l3')
    d.step()
    # the line: committed, outcome, scored
    lx0, lx1, ly = 740, 1100, 170
    d.line(lx0, ly, lx1, ly, 'l2')
    pts = [(lx0, 'COMMITTED', 'Day 0'), ((lx0 + lx1) / 2, 'OUTCOME', 'Known'), (lx1, 'SCORED', 'Day 90')]
    for i, (px, k, v) in enumerate(pts):
        if i == 0:
            d.circle(px, ly, 9, 'ac'); d.dot(px, ly, 4, 'acf')
        else:
            d.circle(px, ly, 9, 'l1')
        d.text(px, ly - 30, k, 'tx tx--a' if i == 0 else 'tx', 'middle')
        d.text(px, ly + 40, v, 'tn', 'middle')
    d.step()
    # a seal, as a dial
    sx, sy = 920, 380
    d.circle(sx, sy, 62, 'ac'); d.circle(sx, sy, 52, 'l3')
    for k in range(48):
        p0 = pol(sx, sy, 52, k * 7.5); p1 = pol(sx, sy, 52 - (8 if k % 4 == 0 else 4), k * 7.5)
        d.line(*p0, *p1, 'l3')
    d.text(sx, sy + 6, '0412', 'tx tx--a', 'middle')
    d.step()
    return d

def plates():
    return [plate1(), plate2(), plate3(), plate4()]

CAPS = ['01 · The institution in its world <em>— TOP VIEW</em>',
        '02 · The draft, pushed until par breaks <em>— ELEVATION</em>',
        '03 · The same world, with the terms found <em>— BEFORE AND AFTER</em>',
        '04 · The answer, written down before the outcome <em>— RECORD</em>']

def spine(n):
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'wordmark'))
    import dune
    w, inner = dune.svg_inner('plsp%d' % n, 'currentColor', 14)
    return ('<svg class="fmp__spine" viewBox="-4 -4 108 %s" aria-hidden="true">' % f(w + 8)
            + '<g transform="translate(100 0) rotate(90)">' + inner + '</g></svg>')

if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'partials', 'plates.html')
    ps = plates()
    html = []
    for i, (p, cap) in enumerate(zip(ps, CAPS), 1):
        attrs = ' class="fmp is-on"' if i == 1 else ' class="fmp" aria-hidden="true"'
        html.append('<figure%s id="fm-p-%d" role="tabpanel" aria-labelledby="fm-t-%d" data-pl="%d">' % (attrs, i, i, i)
                    + spine(i) + p.svg() + '<figcaption class="fmp__cap"><i></i>' + cap + '</figcaption></figure>')
    open(out, 'w').write('\n'.join(html) + '\n')
    print('ok', [len(p.o) for p in ps])
