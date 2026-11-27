#!/usr/bin/env python3
"""
How it works: writes src/partials/how.html.

Four steps, each in a different world, each a product screen drawn at 880 x 540
on a render of that world (public/how-N.webp). The charts are computed here from
one seeded simulation so every number on a screen agrees with its chart:
the fan of debt-service cover in step 02 is the same 1,000 futures whose
breach share, P50 and P90 are printed beside it.

Run: python3 scripts/how/build.py
"""
import math, random, os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = os.path.join(ROOT, 'src', 'partials', 'how.html')
random.seed(7)

def pct(xs, q):
    s = sorted(xs); k = (len(s) - 1) * q; f = math.floor(k); c = min(len(s) - 1, f + 1)
    return s[f] + (s[c] - s[f]) * (k - f)

# ---------------------------------------------------------------- step 02 data
# Debt-service cover (DSCR) by quarter after a 7-month transformer slip.
# Each future draws a further delay, a tenant ramp and a rate path.
Q = ['Q1 28', 'Q2 28', 'Q3 28', 'Q4 28', 'Q1 29', 'Q2 29', 'Q3 29', 'Q4 29', 'Q1 30', 'Q2 30', 'Q3 30', 'Q4 30', 'Q1 31', 'Q2 31']
N = 1000
SLIP = 7 / 3          # the known slip, in quarters
RESERVE = 3.0         # quarters of debt service the interest reserve covers
paths, delays = [], []
for i in range(N):
    extra = random.lognormvariate(math.log(0.35), 1.0)                       # further delay, quarters
    D = SLIP + extra
    ramp = random.uniform(1.8, 3.6)
    level = random.gauss(1.62, 0.06)
    p, e = [], 0.0
    for t in range(len(Q)):
        if t < D:
            base = 1.42 if t < RESERVE else 0.98 - 0.06 * (t - RESERVE)       # reserve pays, then runs dry
        else:
            base = 1.22 + (level - 1.22) * (1 - math.exp(-(t - D) / ramp))
        e = 0.55 * e + random.gauss(0, 0.028)
        p.append(base + e)
    paths.append(p); delays.append(extra)
COV = 1.20
breach = sum(1 for p in paths if min(p) < COV) / N
bands = {q: [pct([p[t] for p in paths], q) for t in range(len(Q))] for q in (0.1, 0.25, 0.5, 0.75, 0.9)}
minp10 = pct([min(p) for p in paths], 0.1)
# first power: plan Jan 2028 + 7 months slip + further delay (months)
first = sorted(7 + d * 3 for d in delays)
MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
def month_label(m_after_jan28):
    m = int(round(m_after_jan28)); return f'{MONTHS[m % 12]} {2028 + m // 12}'
fp50, fp90 = month_label(pct(first, 0.5)), month_label(pct(first, 0.9))

# chart geometry (step 02 main chart)
CW, CH, CX0, CY0 = 470, 210, 34, 10
def cx(t): return CX0 + t * (CW - CX0 - 8) / (len(Q) - 1)
YMIN, YMAX = 0.7, 1.9
def cy(v): return CY0 + (YMAX - v) / (YMAX - YMIN) * (CH - CY0 - 22)
def line(vals): return 'M' + ' L'.join(f'{cx(t):.1f} {cy(v):.1f}' for t, v in enumerate(vals))
def band(lo, hi): return line(hi) + ' L' + ' L'.join(f'{cx(t):.1f} {cy(v):.1f}' for t, v in reversed(list(enumerate(lo)))) + ' Z'
sample = [paths[i] for i in range(0, N, 12)][:80]
first_breach_t = next(t for t in range(len(Q)) if bands[0.1][t] < COV) if any(v < COV for v in bands[0.1]) else 0

# histogram of first-power month (cell 2a)
HB = list(range(7, 19))
hist = [sum(1 for f in first if b <= f < b + 1) for b in HB]
hmax = max(hist)

# ---------------------------------------------------------------- helpers
def esc(s): return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def chrome(app, crumb, clock, mode, side, active, main, foot_r, n):
    ON = ' class="is-on"'
    items = ''.join(f'<li{ON if i == active else ""}>{esc(x)}</li>' for i, x in enumerate(side))
    return f'''<div class="sx sx--{n}" data-sx="{n}" aria-hidden="true">
                    <div class="sx__bar"><span class="sx__dots"><i></i><i></i><i></i></span><b class="sx__app"><span class="sx__sq"><i></i><i></i></span>{app}</b><span class="sx__crumb">/ {crumb}</span><span class="sx__sp"></span><span class="sx__clock" data-clock>{clock}</span><span class="sx__mode">{mode}</span></div>
                    <div class="sx__body"><nav class="sx__side"><p class="sx__sh">{side[0] if False else "World"}</p><ul>{items}</ul></nav><div class="sx__main">{main}</div></div>
                    <div class="sx__foot"><span>Illustrative · all figures simulated</span><span>{foot_r}</span></div>
                  </div>'''

def kpi(v, k, sub, cls=''):
    return f'<div class="sx-k{(" " + cls) if cls else ""}"><b>{v}</b><span>{k}</span><em>{sub}</em></div>'

# ---------------------------------------------------------------- screen 01
asof_rows = [
    ('ledger.balances', [(0.00, 1.00)], 'continuous'),
    ('positions.tbills', [(0.00, 1.00)], 'daily 17:00'),
    ('bank_b.spread', [(0.46, 1.00)], 'Thu 13:52'),
    ('exchange.redemptions', [(0.00, 1.00)], 'streaming'),
    ('rule.redeem_t+2', [(0.10, 1.00)], 'in force'),
    ('fedwire.calendar', [(0.00, 1.00)], 'published'),
]
AX0, AX1 = 112, 392
def ax(u): return AX0 + u * (AX1 - AX0)
NOW = 0.78
asof_svg = [f'<rect class="sx-a__lock" x="{ax(NOW):.1f}" y="6" width="{AX1 - ax(NOW) + 6:.1f}" height="{len(asof_rows) * 22 + 2}"/>']
for r, (name, segs, when) in enumerate(asof_rows):
    y = 12 + r * 22
    asof_svg.append(f'<text class="sx-a__n" x="0" y="{y + 4}">{name}</text>')
    for a, b in segs:
        asof_svg.append(f'<line class="sx-a__b" data-from="{a}" x1="{ax(a):.1f}" x2="{ax(min(b, NOW)):.1f}" y1="{y}" y2="{y}"/>')
        if a > 0:
            asof_svg.append(f'<circle class="sx-a__d" data-from="{a}" cx="{ax(a):.1f}" cy="{y}" r="2.6"/>')
for i, d in enumerate(['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon']):
    asof_svg.append(f'<text class="sx-a__t" x="{ax(i / 5 * 0.98):.1f}" y="{len(asof_rows) * 22 + 22}">{d}</text>')
asof_svg.append(f'<g class="sx-a__cur" data-cur><line x1="0" x2="0" y1="2" y2="{len(asof_rows) * 22 + 8}"/><rect x="-26" y="-10" width="52" height="13" rx="2"/><text x="0" y="0" text-anchor="middle" data-cur-t>FRI 14:32</text></g>')
asof_svg.append(f'<text class="sx-a__lt" x="{ax(NOW) + 8:.1f}" y="{len(asof_rows) * 22 + 2}">not yet knowable</text>')

s1_main = f'''<div class="sx-ks">{kpi('31', 'Sources', '12 private · 19 public')}{kpi('1,240', 'Entities', 'holders · desks · banks · venues')}{kpi('418', 'Rules compiled', 'from 61 documents')}{kpi('96', 'Counterparty agents', 'fit to observed behavior')}</div>
                      <div class="sx-r2">
                        <div class="sx-p sx-in"><p class="sx-ph"><span>Inputs</span><span>synced</span></p>
                          <div class="sx-in__g"><p class="sx-in__h">Private books</p><p class="sx-in__l">Ledgers, positions, flows, limits</p><p class="sx-in__m"><span>12 feeds</span><b data-sync>14:32:08</b></p></div>
                          <div class="sx-in__g"><p class="sx-in__h">The public world</p><p class="sx-in__l">Prices, rates, filings, on-chain data</p><p class="sx-in__m"><span>19 feeds</span><b data-sync>14:32:05</b></p></div>
                          <div class="sx-in__g"><p class="sx-in__h">Rules</p><p class="sx-in__l">Contracts, regulation, settlement calendars</p><p class="sx-in__m"><span>418 rules</span><b>v 2026.11.27</b></p></div>
                        </div>
                        <div class="sx-p sx-a"><p class="sx-ph"><span>World state · as of</span><span data-asof-l>Now · nothing after it exists</span></p>
                          <svg class="sx-a__svg" viewBox="0 0 400 172">{''.join(asof_svg)}</svg>
                        </div>
                      </div>
                      <div class="sx-p sx-rule"><p class="sx-ph"><span>Rule · compiled from source</span><span>executes exactly</span></p>
                        <div class="sx-rule__b"><blockquote>“The issuer shall redeem … promptly, and in any case <mark>within two business days</mark> of a request, and hold <mark>at least five percent</mark> of reserves as cash available the same day.”<cite>Redemption terms §4.2 · OCC final rule</cite></blockquote><span class="sx-rule__ar">→</span><pre class="sx-rule__c" data-code>rule redeem.settle
  within   2 business_days
  calendar fedwire
rule reserve.cash_floor
  same_day ≥ 5% of reserves</pre></div>
                      </div>'''
S1 = chrome('Reserve machine', 'Digital money · Treasury &amp; liquidity', 'FRI 27 NOV · 14:32:08 ET', 'Look-ahead <b>locked</b>',
            ['World state', 'Rules', 'Counterparty agents', 'Futures', 'Policies', 'Grading'], 0, s1_main, 'World state · 2,914,306 facts', 1)

# ---------------------------------------------------------------- screen 02
fan = [f'<path class="sx-f__b1" d="{band(bands[0.1], bands[0.9])}"/>', f'<path class="sx-f__b2" d="{band(bands[0.25], bands[0.75])}"/>']
fan.append('<g class="sx-f__paths" data-paths>' + ''.join(f'<path d="{line(p)}" style="--i:{i}"/>' for i, p in enumerate(sample)) + '</g>')
fan.append(f'<path class="sx-f__med" d="{line(bands[0.5])}"/>')
fan.append(f'<line class="sx-f__cov" x1="{CX0}" x2="{CW - 8}" y1="{cy(COV):.1f}" y2="{cy(COV):.1f}"/><text class="sx-f__covt" x="{CW - 10}" y="{cy(COV) - 5:.1f}" text-anchor="end">Covenant 1.20×</text>')
for v in (0.8, 1.0, 1.2, 1.4, 1.6, 1.8):
    fan.append(f'<text class="sx-f__y" x="{CX0 - 6}" y="{cy(v) + 3:.1f}" text-anchor="end">{v:.1f}</text>')
for t, q in enumerate(Q):
    if t % 2 == 0: fan.append(f'<text class="sx-f__x" x="{cx(t):.1f}" y="{CH - 4}" text-anchor="middle">{q}</text>')
bt = first_breach_t
fan.append(f'<g class="sx-f__mark" data-mark><line x1="{cx(bt):.1f}" x2="{cx(bt):.1f}" y1="{CY0}" y2="{CH - 22}"/><circle cx="{cx(bt):.1f}" cy="{cy(bands[0.1][bt]):.1f}" r="3.5"/><rect x="{cx(bt) + 6:.1f}" y="{cy(bands[0.1][bt]) + 6:.1f}" width="128" height="30" rx="2"/><text x="{cx(bt) + 12:.1f}" y="{cy(bands[0.1][bt]) + 18:.1f}">P10 breaks cover</text><text class="sx-f__ms" x="{cx(bt) + 12:.1f}" y="{cy(bands[0.1][bt]) + 30:.1f}">{Q[bt]} · {bands[0.1][bt]:.2f}×</text></g>')
drivers = [('Transformer lead time', 41), ('Interconnection date', 27), ('Tenant ramp', 19), ('Rates +100 bp', 13)]
drv = ''.join(f'<li><span>{n}</span><i style="--w:{w}%"><b></b></i><em>{w}%</em></li>' for n, w in drivers)
s2_main = f'''<p class="sx-hd"><b>Transformer delivery slips 7 months</b><span>Plan as financed · Campus 3 · 300 MW</span></p>
                      <div class="sx-ks">{kpi(fp50, 'First power · P50', 'plan Jan 2028')}{kpi(fp90, 'First power · P90', 'one future in ten later')}{kpi(f'{minp10:.2f}×', 'Lowest cover · P10', 'covenant 1.20×', 'is-bad')}{kpi(f'<span data-breach>{round(breach * 100)}</span>%', 'Futures in breach', 'of 1,000', 'is-warn')}</div>
                      <div class="sx-r2 sx-r2--f">
                        <div class="sx-p sx-f"><p class="sx-ph"><span>Debt-service cover by quarter · 1,000 futures</span><span><i class="sx-lg sx-lg--b"></i>P10–P90 <i class="sx-lg sx-lg--m"></i>Median</span></p><svg class="sx-f__svg" viewBox="0 0 {CW} {CH}">{''.join(fan)}</svg></div>
                        <div class="sx-p sx-dr"><p class="sx-ph"><span>What breaks it</span><span>share of breaches</span></p><ul class="sx-dr__l">{drv}</ul><p class="sx-dr__n">Cover breaks once the slip passes <b>9 months</b> and the interest reserve runs dry. Today’s slip is <b>7</b>.</p></div>
                      </div>'''
S2 = chrome('Campus machine', 'Power, compute &amp; megainfrastructure · Project finance', 'MON 30 NOV · 16:05 ET', 'Run <b data-run>1,000 / 1,000</b>',
            ['Schedule', 'Interconnection', 'Equipment', 'Offtake', 'Debt', 'Futures'], 4, s2_main, 'Shock · transformer +7 mo', 2)

# ---------------------------------------------------------------- screen 03
agents = [('Chartering', 'Routes and timing', 'Own desk', 'own'), ('Treasury', 'Funding and hedges', 'Own desk', 'own'),
          ('Trade finance', 'Letter of credit', 'Bank · shared terms only', 'cp'), ('Underwriter', 'War-risk cover', 'Insurer · shared terms only', 'cp'),
          ('Buyer', 'Delivery window', 'Refiner · shared terms only', 'cp')]
ag = ''.join(f'<li data-ag="{i}" class="sx-ag--{k}"><i></i><b>{n}</b><span>{r}</span><em>{w}</em></li>' for i, (n, r, w, k) in enumerate(agents))
opts = [('A', 'Wait at anchor for the premium to ease', 'Holds 58%', 'Demurrage $0.9M · LC lapses in 41%', 58, ''),
        ('B', 'Load at Yanbu instead, via the East–West pipeline', 'Holds 86%', '+6 days · +$1.4M · LC names the wrong port', 86, ''),
        ('C', 'Load at Yanbu, amend the LC (port, +21 days), share war-risk 60/40', 'Holds 97%', 'Net +$0.6M · inside the buyer’s window', 97, 'is-best')]
op = ''.join(f'<li class="sx-op {c}" data-op="{i}"><span class="sx-op__k">{k}</span><p class="sx-op__t">{t}</p><p class="sx-op__m">{m}</p><span class="sx-op__h"><i style="--w:{w}%"><b></b></i><em>{h}</em></span></li>' for i, (k, t, h, m, w, c) in enumerate(opts))
msgs = [('Chartering', 'Yanbu loading adds 6 days; arrival stays inside the buyer’s window.'),
        ('Trade finance', 'The bank accepts the load-port change and 21 more days at 15 bp.'),
        ('Underwriter', 'War-risk premium shared 60/40, paid on an observable trigger.'),
        ('Buyer', 'Accepts the revised arrival on the shared terms.')]
ms = ''.join(f'<li data-m="{i}"><b>{a}</b><p>{t}</p></li>' for i, (a, t) in enumerate(msgs))
s3_main = f'''<p class="sx-hd"><b>War-risk premium through Hormuz at 10%</b><span>Crude, 2 cargoes · Gulf → Rotterdam · loading in 9 days</span></p>
                      <div class="sx-r3">
                        <div class="sx-p sx-ag"><p class="sx-ph"><span>Agents by role</span><span>5</span></p><ul>{ag}</ul></div>
                        <div class="sx-p sx-ops"><p class="sx-ph"><span>Decisions tested · 1,000 futures each</span><span>ranked by cost</span></p><ol>{op}</ol>
                          <p class="sx-ops__r" data-result><span class="sx-ops__st">Recommended</span>Option C holds in 97% of futures · awaiting head of trade</p></div>
                        <div class="sx-p sx-th"><p class="sx-ph"><span>Thread</span><span>terms</span></p><ul>{ms}</ul></div>
                      </div>'''
S3 = chrome('Voyage machine', 'Global trade · Commodity house', 'TUE 01 DEC · 19:40 GST', 'Mode <b>co-pilot</b>',
            ['Voyages', 'Cargoes', 'Letters of credit', 'Cover', 'Policies', 'Futures'], 4, s3_main, 'Policy queue · 3 tested', 3)

# ---------------------------------------------------------------- screen 04
calls = [('Thu 09:00', 'Net redemptions, Thursday', '$412M', '$398M', '−3.4%', 'Scored', 'done'),
         ('Fri 09:00', 'Exchange redemptions, 24 h', '$180M', '$191M', '+6.1%', 'Scored', 'done'),
         ('Fri 12:00', 'Weekend cover at P99', '2.3×', 'Mon 08:30', '', 'Recorded', 'open'),
         ('Fri 14:32', 'Bank B outflows, 3 days', '+6.1%', 'Mon 17:00', '', 'Recorded', 'open'),
         ('Fri 14:32', 'Peg, worst of 1,000 futures', '$0.9994', 'Mon 09:30', '', 'Recorded', 'open')]
rows = ''.join(f'<tr class="sx-c--{k}" data-c="{i}"><td class="mono">{a}</td><td>{b}</td><td class="mono">{c}</td><td class="mono" data-act>{d}</td><td class="mono">{e}</td><td><span class="sx-st">{f}</span></td></tr>' for i, (a, b, c, d, e, f, k) in enumerate(calls))
errs = [7.8, 7.4, 7.0, 6.3, 6.1, 5.4, 5.0, 4.6, 4.1, 3.9, 3.5, 3.1]
EB = ''.join(f'<rect x="{8 + i * 26}" y="{112 - e * 12:.1f}" width="16" height="{e * 12:.1f}" class="{"is-now" if i == len(errs) - 1 else ""}" style="--i:{i}"/>' for i, e in enumerate(errs))
EB += ''.join(f'<text x="{16 + i * 26}" y="126" text-anchor="middle">{w}</text>' for i, w in enumerate(['W1', '', '', 'W4', '', '', 'W7', '', '', 'W10', '', 'W12']))
EB += f'<text class="sx-e__v" x="{16 + 11 * 26}" y="{106 - 3.1 * 12:.1f}" text-anchor="middle">3.1%</text>'
loop = ''.join(f'<li data-l="{i}"><span>{i + 1}</span><b>{n}</b><em>{d}</em></li>' for i, (n, d) in enumerate([('Commit', 'recorded before the outcome'), ('Reality settles', 'a redemption clears'), ('Score', 'against what happened'), ('Retrain', 'the score is the reward')]))
s4_main = f'''<div class="sx-ks">{kpi('1,412', 'Calls recorded', 'this week')}{kpi('1,180', 'Scored', 'the rest settle Monday')}{kpi('3.1%', 'Mean error', '−0.4 pt on last week', 'is-good')}{kpi('Locked', 'Look-ahead', 'replays see only the past')}</div>
                      <div class="sx-r2 sx-r2--g">
                        <div class="sx-p sx-cl"><p class="sx-ph"><span>Calls · recorded before the outcome</span><span>nothing revised</span></p>
                          <table><thead><tr><th>Recorded</th><th>Call</th><th>Said</th><th>Actual</th><th>Error</th><th></th></tr></thead><tbody>{rows}</tbody></table></div>
                        <div class="sx-p sx-e"><p class="sx-ph"><span>Mean error by week</span><span>less wrong every week</span></p><svg class="sx-e__svg" viewBox="0 0 320 132">{EB}</svg></div>
                      </div>'''
S4 = chrome('Reserve machine', 'Digital money · Grading', 'FRI 27 NOV · 23:10 ET', 'Mode <b>shadow</b>',
            ['World state', 'Rules', 'Counterparty agents', 'Futures', 'Policies', 'Grading'], 5, s4_main, 'Grading loop · runs continuously', 4)
S4 = S4.replace('<nav class="sx__side"><p class="sx__sh">World</p>', '<nav class="sx__side"><p class="sx__sh">World</p>', 1)
S4 = S4.replace('</ul></nav>', f'</ul><p class="sx__sh sx__sh--2">Grading loop</p><ol class="sx-loop" data-loop>{loop}</ol></nav>', 1)

# ---------------------------------------------------------------- cells (small, exact)
hist_svg = ''.join(f'<rect x="{4 + i * 17}" y="{70 - h / hmax * 58:.1f}" width="13" height="{h / hmax * 58:.1f}" class="{"is-p50" if abs(b - pct(first, 0.5)) < 1 else ("is-p90" if abs(b - pct(first, 0.9)) < 1 else "")}"/>' for i, (b, h) in enumerate(zip(HB, hist)))
hist_svg += f'<text x="4" y="86">{month_label(HB[0])}</text><text x="{4 + (len(HB) - 1) * 17 + 13}" y="86" text-anchor="end">{month_label(HB[-1])}</text>'

CELLS = {
    1: [('Time-locked', 'Every fact keeps the moment it became known. The machine rebuilds the world exactly as it stood at any time, so a replay can never see the future.',
         '<dl class="hc-spec"><div><dt>as_of</dt><dd>Thu 12 Mar 2026 · 09:00 ET</dd></div><div><dt>facts known</dt><dd>2,872,424</dd></div><div><dt>facts withheld</dt><dd>41,882 <em>known later</em></dd></div><div><dt>look-ahead</dt><dd class="is-or">locked</dd></div></dl>'),
        ('Rules as code', 'Contracts, redemption terms, margin and regulation compile to rules that execute exactly, each traced to the clause it came from.',
         '<pre class="hc-code"><span class="k">rule</span> margin.call\n  <span class="k">when</span>  collateral &lt; 102% of exposure\n  <span class="k">by</span>    T+1 09:00\n  <span class="c"># Master agreement §7.2</span></pre>')],
    2: [('Risk as a distribution', 'Every outcome, not one guess: where the median lands, how far the tail runs, and the shape between them.',
         f'<svg class="hc-hist" viewBox="0 0 280 92">{hist_svg}</svg><p class="hc-key"><i class="is-p50"></i>P50 {fp50}<i class="is-p90"></i>P90 {fp90}<span>first power</span></p>'),
        ('The breaking point', 'The smallest shock that breaks the plan, and how far today’s plan sits from it, measured in the units of the world.',
         '<div class="hc-scale"><div class="hc-scale__bar"><i class="hc-scale__ok"></i><i class="hc-scale__bad"></i><b class="hc-scale__brk"></b><b class="hc-scale__now"></b></div><p><span>0</span><span class="hc-scale__l1">breaks at +9 mo</span><span class="hc-scale__l2">today +7 mo</span><span>12 mo</span></p><p class="hc-scale__u">Transformer slip, months</p></div>')],
    3: [('An agent for every role', 'Each agent works for one role, within that role’s limits. A counterparty’s agent sees only the terms both sides share.',
         '<table class="hc-perm"><thead><tr><th></th><th>Sees books</th><th>Proposes</th><th>Commits</th></tr></thead><tbody><tr><td>Chartering</td><td>●</td><td>●</td><td>○</td></tr><tr><td>Treasury</td><td>●</td><td>●</td><td>○</td></tr><tr><td>Trade finance</td><td>shared</td><td>●</td><td>○</td></tr><tr><td>Head of trade</td><td>●</td><td>●</td><td class="is-or">●</td></tr></tbody></table>'),
        ('Terms both sides can sign', 'Institutions test an agreement in one shared world before signing it, so each side is looking at the same futures.',
         '<ul class="hc-terms"><li><span>Load port</span><b>Yanbu</b><em>agreed</em></li><li><span>LC expiry</span><b>+21 days</b><em>agreed</em></li><li><span>War-risk premium</span><b>60 / 40</b><em>agreed</em></li><li><span>Arrival window</span><b>Jan 4–9</b><em>agreed</em></li></ul>')],
    4: [('Earned autonomy', 'Trust is earned on the record, not promised in a demo. The machine moves up only as its scores allow.',
         '<ol class="hc-auto"><li class="is-on"><b>Shadow</b><span>Runs beside the team on live data. Every call is scored.</span></li><li><b>Co-pilot</b><span>Recommends tested decisions. People decide.</span></li><li><b>Bounded execution</b><span>Acts within limits the institution sets.</span></li></ol>'),
        ('A record no one can backfill', 'Each call is time-stamped when it is made and never revised, so the record shows what the machine knew then, not what it learned later.',
         '<pre class="hc-log"><span class="t">Fri 14:32:08</span> recorded  bank_b.outflows_3d  +6.1%\n<span class="t">Fri 14:32:08</span> recorded  peg.worst_of_1000    $0.9994\n<span class="t">Mon 17:00:00</span> settles   bank_b.outflows_3d\n<span class="t">Mon 17:00:02</span> <span class="o">scored</span>    error recorded, never edited</pre>')],
}

STEPS = [
    (1, 'Model the world', 'Digital money', 'An institution’s world, compiled into something you can run.',
     'Its ledgers, positions and limits, the public world around it and the rules it lives by become one model on one clock. Replays rebuild the world as it stood, and nothing later leaks in.',
     ['Private books', 'Public world', 'Rules engine', 'Time-locked'], S1, 'how-1'),
    (2, 'Run a thousand futures', 'Power, compute & megainfrastructure', 'Every outcome, before anything is committed.',
     'The simulator runs the world forward a thousand times with the decision inside it and returns the whole distribution: where the plan holds, where it breaks, and what breaks it.',
     ['Simulator', 'Distribution', 'Stress', 'Breaking point'], S2, 'how-2'),
    (3, 'Change the terms', 'Global trade', 'Agents for every role search for the plan that holds.',
     'Each role’s agent proposes the moves open to it, within its own limits. Every candidate runs through the same thousand futures, the ones that hold are ranked by cost, and people decide.',
     ['Agents by role', 'Policies', 'Tested decisions', 'Agreed terms'], S3, 'how-3'),
    (4, 'Learn from what happens', 'Digital money', 'Graded by reality, not by opinion.',
     'Every call is recorded before the outcome, with what the machine knew at the time. When reality settles, the call is scored, and the score is how the agents learn.',
     ['Commit', 'Reality settles', 'Score', 'Retrain'], S4, 'how-4'),
]

ON = ' class="is-on"'
nav = ''.join(f'<li><a href="#hw-{n}" data-hw-go="{n}"{ON if n == 1 else ""}><span class="hw__n">0{n}</span><span class="hw__nt">{t}<em>{w}</em></span></a></li>' for n, t, w, *_ in STEPS)
steps = ''
for n, t, w, h, p, tags, screen, img in STEPS:
    cells = ''.join(f'<div class="hw__cell"><h4 class="hw__ch">{ct}</h4><p class="hw__cp">{cp}</p><div class="hw__mini">{cm}</div></div>' for ct, cp, cm in CELLS[n])
    steps += f'''
              <article class="hw__step" id="hw-{n}" data-hw-step="{n}">
                <div class="hw__intro">
                  <p class="hw__k"><span>0{n}</span>{t}<em>{w}</em></p>
                  <h3 class="hw__t">{h}</h3>
                  <p class="hw__p">{p}</p>
                  <p class="hw__tags">{''.join(f'<span>{x}</span>' for x in tags)}</p>
                </div>
                <figure class="hw__fig">
                  <div class="hw__stage" data-hw-stage>
                    <img class="hw__bd" src="/{img}.webp" width="1600" height="1000" alt="" loading="lazy" decoding="async" />
                    {screen}
                    <button type="button" class="hw__pause" data-pause aria-label="Pause the screens"><i></i></button>
                  </div>
                </figure>
                <div class="hw__cells">{cells}</div>
              </article>'''

HTML = f'''<section class="band band--paper hw-band" id="film" data-screen>
        <div class="wrap">
          <header class="hw__head">
            <div class="hw__h1"><p class="chip">How it works</p><h2 class="h2">How a Foresight Machine reaches an answer.</h2></div>
            <p class="hw__h3">One model of an institution and its world, run through a thousand futures, changed until the plan holds, and graded by what actually happens. Shown here across all three worlds.</p>
          </header>
          <div class="hw" data-hw>
            <aside class="hw__nav">
              <div class="hw__navin">
                <div class="hw__rail" aria-hidden="true"><i data-hw-fill></i></div>
                <ol class="hw__list">{nav}</ol>
                <a class="btn hw__cta" href="/discuss/">Discuss a decision</a>
              </div>
            </aside>
            <div class="hw__steps">{steps}
            </div>
          </div>
        </div>
      </section>
'''
open(OUT, 'w').write(HTML)
print('ok', f'breach={breach:.3f}', f'minp10={minp10:.2f}', fp50, fp90, 'first_breach', Q[first_breach_t])
