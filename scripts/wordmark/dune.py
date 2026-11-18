#!/usr/bin/env python3
"""
The Foresight Machines wordmark: wide geometric capitals drawn as single strokes,
after the Dune lettering the founders chose. Cap height 100; strokes end flat.
F and R break where Dune breaks them, C and E share one bowl (E adds a centre dot),
S is two half-loops, M and N are arches, A is a bare chevron.

  python3 scripts/wordmark/dune.py            prints the path data and width
Used by scripts/wordmark/apply.py, which writes the mark into the pages.
"""
S = 10.0            # stroke: a touch heavier than the reference, so it holds at 14px
H = 100.0
h = S / 2
TOP, BOT, MID = h, H - h, 50.0
GAP, SPACE = 27.0, 72.0

def f(x): return f'{x:.1f}'.rstrip('0').rstrip('.')

def glyph(c):
    """Return (width, path data, dots[(cx, cy, r)])."""
    if c == 'F':
        w = 86; return w, f'M0 {f(TOP)}H{w}M{f(w*0.8)} {f(MID)}H{f(h)}V{f(H)}', []
    if c == 'O':
        r = 50 - h; return 100, f'M{f(h)} 50A{f(r)} {f(r)} 0 1 1 {f(100-h)} 50A{f(r)} {f(r)} 0 1 1 {f(h)} 50Z', []
    if c == 'R':
        w = 86; r = 24; r2 = 16; m = 48
        return w, (f'M0 {f(TOP)}H{f(w-h-r)}A{r} {r} 0 0 1 {f(w-h)} {f(TOP+r)}V{f(H)}'
                   f'M{f(h)} {f(H)}V{f(m)}H{f(w-h-r2)}A{r2} {r2} 0 0 0 {f(w-h)} {f(m-r2)}'), []
    if c in 'CE':
        w = 92; R = 50 - h
        d = f'M{w} {f(TOP)}H{f(h+R)}A{f(R)} {f(R)} 0 0 0 {f(h+R)} {f(BOT)}H{w}'
        return w, d, ([(w * 0.64, 50, S * 0.9)] if c == 'E' else [])
    if c == 'S':
        w = 88; r = (MID - TOP) / 2
        return w, (f'M{w} {f(TOP)}H{f(h+r)}A{f(r)} {f(r)} 0 0 0 {f(h+r)} {f(MID)}'
                   f'H{f(w-h-r)}A{f(r)} {f(r)} 0 0 1 {f(w-h-r)} {f(BOT)}H0'), []
    if c == 'I':
        return S, f'M{f(h)} 0V{f(H)}', []
    if c == 'G':
        w = 92; R = 50 - h
        return w, f'M{w} {f(TOP)}H{f(h+R)}A{f(R)} {f(R)} 0 0 0 {f(h+R)} {f(BOT)}H{f(w-h)}V{f(MID+2)}H{f(w*0.6)}', []
    if c == 'H':
        w = 84; return w, f'M{f(h)} 0V{f(H)}M{f(w-h)} 0V{f(H)}M{f(h)} {f(MID)}H{f(w-h)}', []
    if c == 'T':
        w = 88; return w, f'M0 {f(TOP)}H{w}M{f(w/2)} {f(TOP)}V{f(H)}', []
    if c == 'M':
        w = 112; ra = (w / 2 - h) / 2; y = TOP + ra
        return w, (f'M{f(h)} {f(H)}V{f(y)}A{f(ra)} {f(ra)} 0 0 1 {f(w/2)} {f(y)}V{f(H)}'
                   f'M{f(w/2)} {f(y)}A{f(ra)} {f(ra)} 0 0 1 {f(w-h)} {f(y)}V{f(H)}'), []
    if c == 'A':
        # apex placed so its outer point just meets the cap line; feet run past the
        # baseline and are cut flat by the clip
        import math
        w = 100; th = math.atan((w / 2) / H); ay = h / math.sin(th); bx = h / math.cos(th)
        k = (w / 2 - bx) / (H - ay); x8 = bx - 8 * k
        return w, f'M{f(x8)} {f(H+8)}L{f(w/2)} {f(ay)}L{f(w-x8)} {f(H+8)}', []
    if c == 'N':
        w = 86; rn = (w - S) / 2; y = TOP + rn
        return w, f'M{f(h)} {f(H)}V{f(y)}A{f(rn)} {f(rn)} 0 0 1 {f(w-h)} {f(y)}V{f(H)}', []
    raise KeyError(c)

def shift(d, dx):
    """Move a path drawn at x=0 to x=dx (absolute commands only)."""
    import re
    out, toks = [], re.findall(r'[A-Za-z]|-?\d+(?:\.\d+)?', d)
    i, cmd, k = 0, None, 0
    args = {'M': 2, 'L': 2, 'H': 1, 'V': 1, 'A': 7, 'Z': 0}
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd, k = t, 0; out.append(t); i += 1; continue
        n = args[cmd]; pos = k % n
        v = float(t)
        if cmd in 'ML' and pos == 0: v += dx
        if cmd == 'H': v += dx
        if cmd == 'A' and pos == 5: v += dx
        out.append(f(v)); k += 1; i += 1
    s = ''
    for t in out:
        s += t if (t.isalpha() or not s or s[-1].isalpha()) else ' ' + t
    return s

def mark(text='FORESIGHT MACHINES'):
    x, ds, dots = 0.0, [], []
    for ch in text:
        if ch == ' ':
            x += SPACE - GAP; continue
        w, d, dd = glyph(ch)
        ds.append(shift(d, x)); dots += [(cx + x, cy, r) for cx, cy, r in dd]
        x += w + GAP
    return x - GAP, ''.join(ds), dots

def weight(stroke):
    """Rebuild the geometry at another stroke, so bars stay inside the cap height."""
    global S, h, TOP, BOT
    S = float(stroke); h = S / 2; TOP, BOT = h, H - h

def svg_inner(clip_id, color='currentColor', stroke=10.0):
    weight(stroke)
    w, d, dots = mark()
    return w, (f'<clipPath id="{clip_id}"><rect x="-2" y="0" width="{f(w+4)}" height="100"/></clipPath>'
               f'<g clip-path="url(#{clip_id})" fill="none" stroke="{color}" stroke-width="{f(stroke)}" stroke-linejoin="miter" stroke-miterlimit="8">'
               f'<path d="{d}"/></g>'
               + ''.join(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{color}"/>' for cx, cy, r in dots))

if __name__ == '__main__':
    w, d, dots = mark()
    print(w); print(d[:300]); print(dots)
