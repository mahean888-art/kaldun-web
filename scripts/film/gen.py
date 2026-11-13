#!/usr/bin/env python3
"""Generate the illustrated film (an inline SVG) for the home page.

One panorama of four worlds (money, trade, energy, insurance) drawn in a
hand-inked style. Scenes are driven by CSS from a data-s attribute
(src/styles/r11.css, src/visuals/film.ts). Run: python3 scripts/film/gen.py > src/partials/film.svg
"""
import random

R = random.Random(7)
INK = '#1d1a17'
W, H = 1600, 900
ROAD = 'M20 786C260 778 410 742 498 738L566 738C700 734 900 732 1040 742C1200 752 1360 772 1590 776'
WIRE = 'M1500 486Q1340 520 1180 478Q960 520 760 470Q560 512 360 468Q250 492 150 480'
LANE = 'M1000 880Q900 846 820 832'

out = []
o = out.append

def st(w=2.2):
    return f'stroke="{INK}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"'

def cloud(x, y, s, cls='fm-cl'):
    o(f'<g class="{cls}" style="--dx:{R.randint(40,90)}px;--dur:{R.randint(38,60)}s"><path transform="translate({x} {y}) scale({s})" d="M10 40c-12 0-13-15 0-17 0-14 18-19 27-9 5-15 31-15 36 0 12-7 28 2 24 14 13 0 15 12 3 13z" fill="#fff" {st(2.2/s)}/></g>')

def tower(x, y, w, h, fill='#f5efe2'):
    o(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" {st()}/>')
    for yy in range(y + 14, y + h - 16, 22):
        for xx in range(x + 9, x + w - 12, 16):
            o(f'<rect x="{xx}" y="{yy}" width="8" height="10" fill="#a8c4da"/>')

def bank(x, y, s=1.0, cls=''):
    o(f'<g class="{cls}" transform="translate({x} {y}) scale({s})">'
      f'<path d="M0 34 60 4l60 30z" fill="#efe5d1" {st()}/><rect x="6" y="34" width="108" height="10" fill="#efe5d1" {st()}/>'
      + ''.join(f'<rect x="{14+k*25}" y="44" width="13" height="52" fill="#fffaf0" {st(1.8)}/>' for k in range(4)) +
      f'<rect x="0" y="96" width="120" height="12" fill="#efe5d1" {st()}/><circle cx="60" cy="22" r="6" fill="#f39200" {st(1.6)}/></g>')

def house(x, y, s=1.0, roof='#c9553a', fill='#f6efe2'):
    o(f'<g transform="translate({x} {y}) scale({s})"><path d="M4 30 30 6l26 24v34H4z" fill="{fill}" {st()}/>'
      f'<path d="M0 32 30 4l30 28" fill="none" stroke="{roof}" stroke-width="7" stroke-linecap="round"/><path d="M0 32 30 4l30 28" fill="none" {st(1.6)}/>'
      f'<rect x="22" y="42" width="15" height="22" fill="#a8c4da" {st(1.6)}/></g>')

def tree(x, y, s=1.0):
    o(f'<g transform="translate({x} {y}) scale({s})"><path d="M0 0v30" {st(2.4)}/><circle cx="0" cy="-8" r="17" fill="#a7c98f" {st()}/></g>')

o(f'<svg class="fm__svg" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A landscape of four worlds, money, trade, energy and insurance, and a small machine that models it, tries it across a thousand futures, finds what holds, and records its answer before the outcome.">')
o('<defs>')
o('<filter id="fm-hand" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3"/></filter>')
o('<linearGradient id="fm-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd9ee"/><stop offset=".72" stop-color="#e6f0f5"/></linearGradient>')
o('<pattern id="fm-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0v40" fill="none" stroke="#7a9cb8" stroke-width="1" opacity=".55"/></pattern>')
o('</defs>')

# ---------------------------------------------------------------- sky
o('<rect class="fm-skyfill" width="1600" height="900" fill="url(#fm-sky)"/>')
o(f'<g class="fm-sun"><circle cx="1330" cy="150" r="54" fill="#fbe2a2" {st()}/></g>')
o('<g class="fm-clouds" filter="url(#fm-hand)">')
cloud(90, 70, 1.6); cloud(520, 40, 1.1); cloud(860, 110, 1.4); cloud(1120, 40, 0.9); cloud(1430, 250, 1.0)
o('</g>')
o('<g class="fm-birds" fill="none" stroke="#1d1a17" stroke-width="2.2" stroke-linecap="round"><path d="M640 230q10-10 20 0q10-10 20 0M700 262q8-8 16 0q8-8 16 0M600 280q7-7 14 0q7-7 14 0"/></g>')
o('<rect class="fm-gridfill" width="1600" height="900" fill="url(#fm-grid)"/>')

# ---------------------------------------------------------------- futures cards (behind the world)
o('<g class="fm-cards">')
for k in range(6):
    o(f'<g class="fm-cardk" style="--k:{k}"><rect x="300" y="150" width="1000" height="600" rx="18" fill="#fffdf8" {st(2)}/>'
      f'<path d="M360 600h880M380 600v-90h40v90M440 600v-150h50v150M520 600v-60h60v60M640 600l40-60h120l40 60M900 600v-110m-40 0h80M1000 600l30-130 30 130M1100 600h100v-40h-100z" fill="none" stroke="#b8b1a5" stroke-width="3"/></g>')
o('</g>')

# ---------------------------------------------------------------- the world
o('<g class="fm-world"><g class="fm-base"><g filter="url(#fm-hand)">')
# hills and ground
o(f'<path d="M0 600Q180 520 380 566T760 548Q930 520 1080 470T1340 500Q1480 470 1600 520V900H0z" fill="#dfe6b8" {st()}/>')
o(f'<path d="M0 640Q300 610 560 628T1040 620Q1300 600 1600 640V900H0z" fill="#efe6cd" {st()}/>')
# river and bay
o(f'<path d="M512 600Q500 700 520 760T498 900H566Q590 820 572 760T560 600z" fill="#a9cfe6" {st()}/>')
o(f'<path d="M640 900Q660 806 760 790T1000 800Q1060 840 1060 900z" fill="#a9cfe6" {st()}/>')
o(f'<path d="M700 846q20-8 40 0t40 0M860 860q20-8 40 0t40 0M780 880q20-8 40 0" fill="none" stroke="#5d8fb0" stroke-width="2"/>')
# road
o(f'<path d="{ROAD}" fill="none" stroke="#d9cba8" stroke-width="26" stroke-linecap="round"/>')
o(f'<path d="{ROAD}" fill="none" stroke="{INK}" stroke-width="2" stroke-dasharray="14 12"/>')
# the bridge
o(f'<g class="fm-bridge"><path d="M488 744Q532 712 576 744" fill="none" {st(3)}/><path d="M488 744h88" {st(3)}/><path d="M500 744v-14M532 744v-26M564 744v-14" {st(2)}/></g>')
# power line pylons and wire
for x, y in [(1500, 486), (1180, 478), (760, 470), (360, 468), (150, 480)]:
    o(f'<path d="M{x-14} {y+120}L{x} {y}L{x+14} {y+120}M{x-10} {y+40}h20M{x-12} {y+80}h24" fill="none" {st(2)}/>')
o(f'<path class="fm-wire" d="{WIRE}" fill="none" {st(2)}/>')

# money: the city
tower(60, 470, 70, 170); tower(140, 420, 84, 220); tower(232, 500, 64, 140)
bank(300, 532, 0.92)
o(f'<rect x="420" y="580" width="70" height="60" fill="#f6efe2" {st()}/><path d="M414 580h82l-8-18h-66z" fill="#f39200" {st(1.8)}/>')
tree(40, 650); tree(470, 668, 0.8)
# trade: silos, crane, containers, ship
for x in (604, 650):
    o(f'<path d="M{x} 640V560q20-14 40 0v80" fill="#f2ead8" {st()}/><path d="M{x} 580h40M{x} 600h40" {st(1.4)}/>')
o(f'<path d="M760 640V520h14v120M767 520h120M870 520v40" fill="none" {st(3)}/><rect x="858" y="560" width="26" height="12" fill="#e9d9b8" {st(1.6)}/>')
cols = ['#f39200', '#7fa7c4', '#efe5d1', '#c9553a', '#a7c98f']
for row in range(3):
    for c in range(4):
        o(f'<rect x="{900 + c*34}" y="{646 - row*20}" width="32" height="18" fill="{cols[(row*4+c) % 5]}" {st(1.5)}/>')
o(f'<path d="M600 700h420" {st(2)}/>')
o(f'<g class="fm-ship"><path d="M800 832h180l-22 30H826z" fill="#e9e1cf" {st()}/>'
  + ''.join(f'<rect x="{830+k*30}" y="{812}" width="28" height="20" fill="{cols[k%5]}" {st(1.5)}/>' for k in range(4)) +
  f'<path d="M944 812v-30h20v30" fill="#f6efe2" {st(1.6)}/></g>')
# energy: turbines and solar
for x, y in [(1100, 470), (1210, 440), (1320, 476)]:
    o(f'<path d="M{x} {y}l-5 150h10z" fill="#fbfaf6" {st(1.8)}/>'
      f'<g class="fm-blades" style="transform-origin:{x}px {y}px"><path d="M{x} {y}l4-62-8 0zM{x} {y}l-55 31 4 7zM{x} {y}l51 35 4-7z" fill="#fbfaf6" {st(1.6)}/></g><circle cx="{x}" cy="{y}" r="5" fill="{INK}"/>')
for r in range(2):
    for c in range(5):
        o(f'<path d="M{1370+c*40+r*14} {650+r*26}h34l-10 20h-34z" fill="#5f84a8" {st(1.5)}/>')
# insurance: houses under an umbrella
o(f'<g class="fm-umb"><path d="M1190 726Q1300 640 1410 726" fill="#f6d9b2" {st()}/><path d="M1300 660v120" {st(2.4)}/><path d="M1300 640v20" {st(2.4)}/></g>')
house(1180, 724, 0.9); house(1250, 736, 0.8, '#7fa7c4'); house(1320, 722, 0.95); house(1400, 742, 0.8, '#a7c98f')
house(1470, 732, 0.9, '#7fa7c4'); tree(1560, 760, 0.8); tree(1090, 760, 0.7)
o('</g>')  # hand filter

# moving things (outside the filter so they stay crisp in motion)
for k in range(4):
    o(f'<g class="fm-coin" style="--d:{k*2.6}s;offset-path:path(\'{ROAD}\')"><circle r="9" fill="#f39200" {st(1.8)}/><path d="M0-4v8" stroke="{INK}" stroke-width="1.6"/></g>')
for k in range(3):
    o(f'<circle class="fm-spark" style="--d:{k*1.7}s;offset-path:path(\'{WIRE}\')" r="5" fill="#f39200" {st(1.4)}/>')

o('</g>')  # base
# scene 2: what the model reads, traced and named
o('<g class="fm-trace">')
for d, n in [(ROAD, 0), (WIRE, 1), ('M780 640Q880 720 960 840', 2), ('M240 470Q700 320 1300 640', 3)]:
    o(f'<path d="{d}" pathLength="1" style="--n:{n}" fill="none" stroke="#f39200" stroke-width="4" stroke-linecap="round"/>')
o('</g>')
o('<g class="fm-tags">')
for x, y, t, n in [(180, 380, 'Banks and accounts', 0), (690, 470, 'Ports and routes', 1), (1120, 380, 'Grid and weather', 2), (1250, 610, 'Policies and cover', 3), (400, 820, 'Contracts and rules', 4)]:
    o(f'<g style="--n:{n}"><rect x="{x}" y="{y-24}" width="{len(t)*13+30}" height="36" rx="18" fill="#fffdf8" {st(1.8)}/><text x="{x+14}" y="{y}" class="fm-t">{t}</text></g>')
o('</g>')

# scene 3: where the futures break
o('<g class="fm-stress">')
o(f'<circle class="fm-ring" cx="532" cy="736" r="42" fill="none" stroke="#c2410c" stroke-width="5"/>')
o(f'<g class="fm-storm"><path d="M1170 600c-20 0-22-24 0-26 0-22 30-28 42-12 8-22 46-22 52 0 18-8 40 4 34 20 18 2 18 18 2 18z" fill="#6f7f8c" {st()}/>'
  + ''.join(f'<path d="M{1190+k*22} 612l-10 30" stroke="#5d8fb0" stroke-width="3" stroke-linecap="round"/>' for k in range(6)) + '</g>')
o(f'<path class="fm-wirehot" d="{WIRE}" fill="none" stroke="#c2410c" stroke-width="4" stroke-dasharray="10 10"/>')
o('</g>')

# scene 4: what the machine found
o('<g class="fm-found">')
o(f'<path pathLength="1" style="--n:0" d="M480 800Q532 772 584 800M480 800h104" fill="none" stroke="#f39200" stroke-width="5" stroke-linecap="round"/>')
o(f'<path pathLength="1" style="--n:1" d="M1150 620h60v34h-60zM1166 620v-8h12v8" fill="#ffe2b8" stroke="#f39200" stroke-width="4"/>')
o(f'<path pathLength="1" style="--n:2" d="M1170 734Q1300 616 1430 734" fill="none" stroke="#f39200" stroke-width="5" stroke-linecap="round"/>')
o('</g>')
o('</g>')  # world

# ---------------------------------------------------------------- the machine
o('<g class="fm-machine"><g class="fm-mbody">'
  f'<path d="M80 0v26" {st(3)}/><circle cx="80" cy="-6" r="9" fill="#f39200" {st(2.4)}/>'
  f'<rect x="10" y="26" width="140" height="104" rx="22" fill="#e7c98f" {st(3)}/>'
  f'<g class="fm-eyes"><rect x="44" y="56" width="26" height="26" fill="{INK}"/><rect x="90" y="56" width="26" height="26" fill="{INK}"/></g>'
  f'<path d="M58 104q22 12 44 0" fill="none" {st(3)}/>'
  f'<rect x="34" y="130" width="92" height="34" rx="10" fill="#d8b778" {st(3)}/>'
  f'<circle cx="54" cy="172" r="11" fill="#fff" {st(3)}/><circle cx="106" cy="172" r="11" fill="#fff" {st(3)}/>'
  f'<path class="fm-arm" d="M150 80q40-6 54-40" fill="none" {st(4)}/>'
  '</g></g>')

# ---------------------------------------------------------------- scene 5: the record
o('<g class="fm-rec">'
  f'<rect x="980" y="560" width="420" height="250" rx="14" fill="#fffdf8" {st(3)}/>'
  '<text x="1012" y="612" class="fm-t fm-t--k">RECORDED BEFORE THE OUTCOME</text>'
  '<text x="1012" y="664" class="fm-t fm-t--b">The answer, with its evidence</text>'
  f'<path d="M1012 700h300M1012 730h260M1012 760h220" {st(2)} opacity=".35"/>'
  f'<g class="fm-stamp"><circle cx="1330" cy="740" r="44" fill="none" stroke="#f39200" stroke-width="5"/><path d="M1308 742l16 16 30-34" fill="none" stroke="#f39200" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>'
  '</g>')
o('</svg>')
print('\n'.join(out))
