#!/usr/bin/env python3
"""The four Worlds pictures, drawn in the film's hand-inked style.

Each is 800 x 1000, its subject kept between y 200 and 800 so a 4:3 crop on
phones keeps it. One orange route in each: what the machine would change.
Run: python3 scripts/film/worlds.py  (writes public/w-*.svg)
"""
import os, random
INK = '#1d1a17'
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'public')

def st(w=2.4):
    return f'stroke="{INK}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"'

class P:
    def __init__(self): self.o = []
    def a(self, s): self.o.append(s)
    def cloud(self, x, y, s):
        self.a(f'<path transform="translate({x} {y}) scale({s})" d="M10 40c-12 0-13-15 0-17 0-14 18-19 27-9 5-15 31-15 36 0 12-7 28 2 24 14 13 0 15 12 3 13z" fill="#fff" {st(2.2/s)}/>')
    def tree(self, x, y, s=1.0):
        self.a(f'<g transform="translate({x} {y}) scale({s})"><path d="M0 0v34" {st(2.6)}/><circle cx="0" cy="-10" r="20" fill="#a7c98f" {st()}/></g>')
    def tower(self, x, y, w, h, fill='#f5efe2'):
        self.a(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" {st()}/>')
        for yy in range(y + 16, y + h - 18, 26):
            for xx in range(x + 11, x + w - 14, 19):
                self.a(f'<rect x="{xx}" y="{yy}" width="10" height="12" fill="#a8c4da"/>')
    def house(self, x, y, s=1.0, roof='#c9553a'):
        self.a(f'<g transform="translate({x} {y}) scale({s})"><path d="M4 30 30 6l26 24v34H4z" fill="#f6efe2" {st()}/>'
               f'<path d="M0 32 30 4l30 28" fill="none" stroke="{roof}" stroke-width="7" stroke-linecap="round"/><path d="M0 32 30 4l30 28" fill="none" {st(1.6)}/>'
               f'<rect x="22" y="42" width="15" height="22" fill="#a8c4da" {st(1.6)}/></g>')
    def machine(self, x, y, s=0.62):
        self.a(f'<g transform="translate({x} {y}) scale({s})"><path d="M80 0v26" {st(3)}/><circle cx="80" cy="-6" r="9" fill="#f39200" {st(2.4)}/>'
               f'<rect x="10" y="26" width="140" height="104" rx="22" fill="#e7c98f" {st(3)}/>'
               f'<rect x="44" y="56" width="26" height="26" fill="{INK}"/><rect x="90" y="56" width="26" height="26" fill="{INK}"/>'
               f'<path d="M58 104q22 12 44 0" fill="none" {st(3)}/><rect x="34" y="130" width="92" height="34" rx="10" fill="#d8b778" {st(3)}/>'
               f'<circle cx="54" cy="172" r="11" fill="#fff" {st(3)}/><circle cx="106" cy="172" r="11" fill="#fff" {st(3)}/></g>')
    def svg(self, label):
        head = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" role="img" aria-label="{label}">'
                '<defs><filter id="h" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3"/></filter>'
                '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd9ee"/><stop offset="1" stop-color="#e8f1f5"/></linearGradient></defs>'
                '<rect width="800" height="1000" fill="url(#sky)"/>')
        return head + '<g filter="url(#h)">' + ''.join(self.o) + '</g></svg>'

def ground(p, y=640, col='#efe6cd', hill='#dfe6b8'):
    p.a(f'<path d="M0 {y-60}Q200 {y-130} 420 {y-80}T800 {y-100}V1000H0z" fill="{hill}" {st()}/>')
    p.a(f'<path d="M0 {y}Q300 {y-24} 520 {y-6}T800 {y-10}V1000H0z" fill="{col}" {st()}/>')

def coin(p, x, y, r=12):
    p.a(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#f39200" {st(2)}/><path d="M{x} {y-5}v10" stroke="{INK}" stroke-width="2"/>')

# ---------------------------------------------------------------- money and credit
p = P()
p.cloud(70, 130, 1.4); p.cloud(520, 90, 1.1); p.cloud(600, 300, 0.8)
ground(p, 660)
p.tower(70, 300, 110, 360); p.tower(190, 240, 120, 420); p.tower(600, 330, 110, 330)
p.a(f'<g transform="translate(330 420)"><path d="M0 70 125 6l125 64z" fill="#efe5d1" {st()}/><rect x="10" y="70" width="230" height="16" fill="#efe5d1" {st()}/>'
    + ''.join(f'<rect x="{26+k*52}" y="86" width="24" height="128" fill="#fffaf0" {st(2)}/>' for k in range(4)) +
    f'<rect x="0" y="214" width="250" height="22" fill="#efe5d1" {st()}/><circle cx="125" cy="44" r="12" fill="#f39200" {st(2)}/></g>')
p.a(f'<path d="M0 760Q250 730 400 748T800 740" fill="none" stroke="#d9cba8" stroke-width="40" stroke-linecap="round"/><path d="M0 760Q250 730 400 748T800 740" fill="none" {st(2)} stroke-dasharray="16 14"/>')
for k, x in enumerate([120, 300, 520, 690]):
    coin(p, x, 742 + (4 if k % 2 else -6))
p.a(f'<g transform="translate(560 800)"><rect width="150" height="110" fill="#f6efe2" {st()}/><path d="M-8 0h166l-14-26H6z" fill="#f39200" {st(2)}/><rect x="56" y="48" width="38" height="62" fill="#a8c4da" {st(2)}/></g>')
p.a(f'<path d="M455 656Q520 700 560 820" fill="none" stroke="#f39200" stroke-width="7" stroke-linecap="round"/>')
p.tree(470, 860, 1.1); p.tree(60, 880, 1.2)
p.machine(80, 790)
open(os.path.join(OUT, 'w-money.svg'), 'w').write(p.svg('A city of banks and towers, coins moving along the road to shops; one route from the bank to the shops drawn in orange.'))

# ---------------------------------------------------------------- trade and commodities
p = P()
p.cloud(80, 110, 1.2); p.cloud(480, 160, 1.4)
p.a(f'<path d="M0 560Q200 520 400 550T800 530V1000H0z" fill="#efe6cd" {st()}/>')
p.a(f'<path d="M0 820Q260 790 520 812T800 800V1000H0z" fill="#a9cfe6" {st()}/>')
for x in (70, 150):
    p.a(f'<path d="M{x} 560V380q35-24 70 0v180" fill="#f2ead8" {st()}/><path d="M{x} 420h70M{x} 460h70M{x} 500h70" {st(1.6)}/>')
p.a(f'<path d="M300 560V300h20v260M310 300h260M550 300v80" fill="none" {st(4)}/><path d="M300 320l50-20M320 380l-20-20" {st(2)}/>')
p.a(f'<rect x="520" y="380" width="60" height="26" fill="#e9d9b8" {st(2)}/>')
cols = ['#f39200', '#7fa7c4', '#efe5d1', '#c9553a', '#a7c98f']
for r in range(4):
    for c in range(4):
        p.a(f'<rect x="{380 + c*70}" y="{690 - r*38}" width="66" height="34" fill="{cols[(r*4+c) % 5]}" {st(1.8)}/>')
for k in range(3):
    p.a(f'<path d="M{620+k*60} 560v-70q25-16 50 0v70" fill="#e8e2d4" {st(2)}/>')
p.a(f'<path d="M0 740h800" {st(2)}/>')
p.a(f'<g transform="translate(140 820)"><path d="M0 40h460l-50 70H50z" fill="#e9e1cf" {st()}/>'
    + ''.join(f'<rect x="{50+k*72}" y="0" width="68" height="40" fill="{cols[(k+1)%5]}" {st(1.8)}/>' for k in range(5)) +
    f'<path d="M404 0v-60h42v60" fill="#f6efe2" {st(2)}/></g>')
p.a(f'<path d="M30 960Q300 900 560 940T800 930" fill="none" stroke="#f39200" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 18"/>')
p.machine(60, 600, 0.55)
open(os.path.join(OUT, 'w-trade.svg'), 'w').write(p.svg('A port: silos, a crane over stacked containers, a tank farm and a container ship; one shipping lane drawn in orange.'))

# ---------------------------------------------------------------- insurance and risk transfer
p = P()
p.a(f'<g><path d="M120 250c-30 0-34-36 0-40 0-34 46-42 64-18 12-34 70-34 80 0 28-12 62 6 52 32 28 2 28 28 2 28z" fill="#7f8e9a" {st()}/>'
    + ''.join(f'<path d="M{150+k*32} 276l-14 44" stroke="#5d8fb0" stroke-width="4" stroke-linecap="round"/>' for k in range(6)) + '</g>')
p.cloud(520, 120, 1.2)
ground(p, 700)
p.a(f'<path d="M110 640Q400 330 690 640" fill="#f6d9b2" {st(3)}/><path d="M110 640q48-26 96 0q48-26 96 0q48-26 96 0q48-26 96 0q48-26 96 0q48-26 96 0" fill="#f6d9b2" {st(2.4)}/>')
p.a(f'<path d="M400 420v380" {st(4)}/><path d="M400 800q0 30-26 30" fill="none" {st(4)}/><path d="M400 400v20" {st(4)}/>')
p.a(f'<path d="M100 640Q400 300 700 640" fill="none" stroke="#f39200" stroke-width="7" stroke-linecap="round"/>')
for x, s, r in [(130, 1.3, '#c9553a'), (230, 1.1, '#7fa7c4'), (480, 1.25, '#c9553a'), (590, 1.05, '#a7c98f')]:
    p.house(x, 660, s, r)
p.a(f'<g transform="translate(300 690)"><rect width="90" height="80" fill="#eceae4" {st()}/>'
    + ''.join(f'<path d="M14 {18+k*18}h62" {st(2)}/><circle cx="66" cy="{18+k*18}" r="3" fill="#f39200"/>' for k in range(3)) + '</g>')
p.tree(60, 860, 1.2); p.tree(730, 880, 1.1)
p.machine(560, 830, 0.55)
open(os.path.join(OUT, 'w-risk.svg'), 'w').write(p.svg('Houses, shops and a small data center under one large umbrella while a storm passes; the umbrella\'s edge drawn in orange.'))

# ---------------------------------------------------------------- energy and infrastructure
p = P()
p.a(f'<circle cx="640" cy="170" r="70" fill="#fbe2a2" {st()}/>')
p.cloud(70, 120, 1.3)
ground(p, 660)
for x, y in [(150, 330), (300, 280), (450, 340)]:
    p.a(f'<path d="M{x} {y}l-8 250h16z" fill="#fbfaf6" {st(2)}/><path d="M{x} {y}l6-100-12 0zM{x} {y}l-88 50 6 10zM{x} {y}l82 56 6-10z" fill="#fbfaf6" {st(2)}/><circle cx="{x}" cy="{y}" r="8" fill="{INK}"/>')
for r in range(3):
    for c in range(5):
        p.a(f'<path d="M{80+c*96+r*26} {720+r*52}h82l-20 40h-82z" fill="#5f84a8" {st(1.8)}/>')
for x in (590, 700):
    p.a(f'<path d="M{x-24} 650L{x} 420L{x+24} 650M{x-16} 500h32M{x-20} 580h40" fill="none" {st(2.4)}/>')
p.a(f'<path d="M590 430Q645 470 700 430Q760 460 800 440" fill="none" {st(2)}/>')
p.a(f'<g transform="translate(560 690)"><rect width="190" height="90" fill="#eceae4" {st()}/>'
    + ''.join(f'<rect x="{16+k*44}" y="18" width="34" height="54" fill="#fff" {st(1.8)}/>' for k in range(4)) + '</g>')
p.a(f'<path d="M460 770Q520 730 560 735" fill="none" stroke="#f39200" stroke-width="7" stroke-linecap="round"/>')
p.a(f'<rect x="430" y="740" width="44" height="60" rx="6" fill="#ffe2b8" stroke="#f39200" stroke-width="5"/>')
p.machine(600, 850, 0.5)
open(os.path.join(OUT, 'w-energy.svg'), 'w').write(p.svg('Wind turbines on a hill, a solar field, power lines and a data center; a battery and its link to the data center drawn in orange.'))
print('ok')
