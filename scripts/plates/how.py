#!/usr/bin/env python3
"""
How it works, on a sample AI campus. Writes src/partials/how.html.
Every figure here belongs to one consistent sample: a 300 MW campus that must
energize by month 24 with debt service coverage at or above 1.20x.
"""
import os
P = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'partials')
iso = lambda n: open(os.path.join(P, f'iso-campus-{n}.html')).read()

STEPS = [
    ('Model the world', 'The institution, and the world it depends on: its capital, contracts, counterparties, markets and rules.',
     'Campus B · what it depends on', 'ISOMETRIC'),
    ('Simulate to failure', 'Each decision is stress-tested against past crises and the smallest shock that breaks it.',
     'Campus B · where the plan breaks', 'ISOMETRIC'),
    ('Intervene and discover', 'It finds the change that holds: a new allocation, new terms, a new sequence.',
     'Campus B · the arrangement found', 'ISOMETRIC'),
    ('Commit the record', 'The answer and its evidence, recorded before the outcome.',
     'Campus B · as committed', 'ISOMETRIC'),
]

def chrome(view):
    return (f'<div class="ap__bar"><span class="ap__mk"><i></i><i></i></span><span class="ap__crumb">Campus B <b>/</b> Energization <b>/</b> <em>{view}</em></span>'
            '<span class="ap__tag">Sample</span></div>')

def kv(rows, cls='ap__kv'):
    return ''.join(f'<div class="{cls}"><span>{a}</span><span class="ap__src">{b}</span><b>{c}</b></div>' for a, b, c in rows)

APPS = [
    chrome('Model') + '<div class="ap__in"><p class="ap__t">What the campus depends on</p>'
    + kv([('Interconnection', 'Utility study', 'Month 24'),
          ('Main transformers × 4', 'Supplier order', '128-week lead'),
          ('Tenant lease · 300 MW', 'Signed', 'Starts month 26'),
          ('Construction loan', '$2.1B', 'Draws to month 30'),
          ('Covenant', 'Debt service coverage', '≥ 1.20×')])
    + '<p class="ap__foot"><i></i>Replayed on 14 comparable builds · energization within 2.1 months</p></div>',

    chrome('Stress') + '<div class="ap__in"><p class="ap__t">Coverage as energization slips <span>The plan as drafted</span></p>'
    '<div class="ch"><span class="ch__y" style="top:8%">1.6×</span><span class="ch__y" style="top:50%">1.2×</span><span class="ch__y" style="top:92%">0.8×</span>'
    '<svg viewBox="0 0 400 160" preserveAspectRatio="none"><path class="ch__g" d="M0 13H400M0 80H400M0 147H400"/>'
    '<path class="ch__lim" d="M0 80H400"/><path class="ch__ln" d="M0 33 C60 45 100 64 117 80 S230 128 400 140"/></svg>'
    '<span class="ch__brk" style="left:29.2%"><b>Breaks · month 7</b></span></div>'
    '<p class="ch__x"><span>0</span><span>6</span><span>12</span><span>18</span><span>24 months</span></p>'
    + kv([('Interconnection slips', 'to 1.20×', '7 months'),
          ('Transformers arrive late', 'to 1.20×', '9 months'),
          ('Rates rise 1.5 points', 'lowest', 'Holds · 1.31×')], 'ap__kv ap__kv--s')
    + '<p class="ap__foot">No probabilities assumed.</p></div>',

    chrome('Options') + '<div class="ap__in"><p class="ap__t">214 options tried <span>3 kept</span></p>'
    '<div class="op2"><div class="op2__h"><span>Arrangement</span><span>Holds to</span><span>Lowest coverage</span></div>'
    + ''.join(f'<div class="op2__r{" is-kept" if k else ""}"><span>{a}</span><b>{b}</b><b>{c}</b></div>' for a, b, c, k in [
        ('The plan as drafted', '7 months', '0.92×', 0),
        ('Re-sequence the build only', '10 months', '1.05×', 0),
        ('+ Bridge power on site, 200 MW', '18 months', '1.24×', 0),
        ('+ Halls 3–4 in a second phase', '22 months', '1.29×', 0),
        ('+ Lease ramp tied to energization', '24+ months', '1.34×', 1)])
    + '</div><p class="ap__foot"><i></i>Adds $310M of capital · none of the three was in the plan</p></div>',

    chrome('Record') + '<div class="ap__in"><p class="ap__no">No. 0187</p><p class="ap__q">Energize Campus B on time, with its debt serviced</p>'
    '<div class="rx"><div><p class="rx__k">Team’s plan</p><p class="rx__v">All four halls at once</p><p class="rx__m">Holds to 7 months</p></div>'
    '<div class="is-m"><p class="rx__k">Machine</p><p class="rx__v">Bridge power, phased halls, linked lease</p><p class="rx__m">Holds to 24+ months</p></div></div>'
    + kv([('Rules', '', 'Same for both'), ('Hash', '', '<span class="mono">3e9f…c21a</span>')])
    + '<div class="tl3"><span class="is-done"><i></i>Committed<em>Before the outcome</em></span><span><i></i>Outcome<em>At energization</em></span><span><i></i>Scored<em>90 days after</em></span></div></div>',
]

rail = ''.join(f'<li><button type="button" data-hx-go="{i}" class="{"is-on" if i == 1 else ""}"><span class="hx__n">0{i}</span><span class="hx__t">{t}</span><span class="hx__d">{d}</span></button></li>'
               for i, (t, d, _, _) in enumerate(STEPS, 1))
slides = ''
for i, ((t, d, cap, view), app) in enumerate(zip(STEPS, APPS), 1):
    slides += (f'<div class="hx__slide{" is-on" if i == 1 else ""}" data-hx="{i}">'
               f'<div class="hx__mt"><span class="hx__n">0{i}</span><span class="hx__t">{t}</span><span class="hx__d">{d}</span></div>'
               f'<figure class="hx__sheet">{iso(i)}<figcaption class="hx__cap"><i></i>{cap} <em>— {view}</em></figcaption></figure>'
               f'<div class="hx__app" aria-hidden="true">{app}</div></div>')

html = (f'<div class="hx" data-hx-track><div class="hx__pin">'
        f'<ol class="hx__rail" aria-label="How it works, in four steps">{rail}</ol>'
        f'<div class="hx__fit"><div class="hx__stage">{slides}</div></div>'
        f'</div></div>\n')
open(os.path.join(P, 'how.html'), 'w').write(html)
print('ok')
