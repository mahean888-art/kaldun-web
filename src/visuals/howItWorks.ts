/**
 * 02 · How it works — Pinned 4-Step Nominal Operating Stack (Click-to-Switch)
 *
 * All four stages (01 Model the world, 02 Simulate to failure, 03 Intervene and
 * discover, 04 Commit the record) remain permanently visible on the left rail
 * and transition smoothly on click while the right-hand workspace renders a
 * full-scale, realistic Nominal-style interactive desktop environment.
 *
 * Strictly obeys the three institutional integrity rules:
 *   1. Public rules / clearly labeled simulated worlds only (never client claims).
 *   2. Zero made-up savings figures, zero named crises, zero 2023.
 *   3. Zero dashboard clichés (no pill badges, KPI card grids, or decorative gauges).
 */

type DomainKey = 'money' | 'power' | 'trade';

interface TimelineFrame {
  ts: string;
  rows: ReadonlyArray<readonly [string, string]>;
}

interface DomainModel {
  world: string;
  doc: string;
  crumb: string;
  tree: ReadonlyArray<readonly [string, string]>;
  tracks: ReadonlyArray<readonly [string, 'bar' | 'step' | 'wave', number, number]>;
  ticks: readonly string[];
  frames: readonly TimelineFrame[];
  replay: ReadonlyArray<readonly [string, string]>;
  nodes: readonly string[];
  k1: string;
  k4: string;
  k5: string;
  v5: string;
  unit: (v: number) => string;
  v4Fn: (v: number) => string;
  breakAt: number;
  levers: Array<[string, string, string, boolean]>;
  table: ReadonlyArray<readonly [string, string, string]>;
  queryAns: (activeCount: number) => string;
}

function createDomainData(): Record<DomainKey, DomainModel> {
  return {
    money: {
      world: 'World · Money & Clearing',
      doc: 'Public rules · OCC reserve standards',
      crumb: 'Adversarial shock sweep · Money & Clearing',
      tree: [
        ['Public statutes', '1:1 reserve eligibility & attestation'],
        ['Settlement rails', '24/7 rails & bank cutoff windows'],
        ['Balance sheet', 'Liquid instruments & cash ladders'],
        ['Counterparties', 'Merchant payout SLAs & limits'],
      ],
      tracks: [
        ['reserve_eligibility', 'bar', 8, 84],
        ['bank_cutoff_window', 'step', 0, 0],
        ['rail_throughput_24x7', 'wave', 0, 0],
        ['par_settlement_floor', 'bar', 12, 78],
      ],
      ticks: ['T+00:00', 'T+12:00', 'T+24:00', 'T+36:00', 'T+48:00'],
      frames: [
        {
          ts: 'T + 00:00',
          rows: [
            ['reserve_rule', '1:1 liquid'],
            ['bank_window', 'Open'],
            ['rail_24x7', 'Nominal'],
            ['par_check', '1.000'],
          ],
        },
        {
          ts: 'T + 06:00',
          rows: [
            ['reserve_rule', '1:1 liquid'],
            ['bank_window', 'Closed'],
            ['rail_24x7', 'Active'],
            ['par_check', '1.000'],
          ],
        },
        {
          ts: 'T + 18:00',
          rows: [
            ['queue_depth', '0.4 h'],
            ['backup_rail', 'Standby'],
            ['rail_24x7', 'Elevated'],
            ['par_check', '1.000'],
          ],
        },
        {
          ts: 'T + 36:00',
          rows: [
            ['replay_set', 'Held-out'],
            ['settlement', 'Cleared'],
            ['obligations', 'Reconciled'],
            ['par_check', '1.000'],
          ],
        },
      ],
      replay: [
        ['Holiday weekend cutoff replay', 'MATCHED'],
        ['Multi-bank wire latency replay', 'MATCHED'],
      ],
      nodes: [
        'Demand surge',
        '24/7 settlement rail',
        'Single-bank cutoff window',
        'Par settlement floor (1.000)',
      ],
      k1: 'demand_multiple',
      k4: 'outage_window',
      k5: 'par_floor',
      v5: '1.000',
      unit: (v) => `${(1 + (v / 100) * 5).toFixed(1)}×`,
      v4Fn: (v) => `${(1 + (v / 100) * 14).toFixed(1)} h`,
      breakAt: 46,
      levers: [
        ['Secondary 24/7 settlement bank', 'Removes single-bank weekend cutoff risk', '01', true],
        ['Per-counterparty instant cap', 'Bounds peak surge while keeping normal flow instant', '02', true],
        ['Morning sweep notice window', 'Aligns large exits with fund settlement hours', '03', true],
      ],
      table: [
        ['Peak demand multiple', '2.3×', '6.0×'],
        ['Single-bank outage held', '3.5 h', '48 h+'],
        ['Par settlement rule', 'Breaks', 'Holds'],
      ],
      queryAns: (n) =>
        n === 3
          ? 'No single-bank cutoff or surge below 6.0× breaks par settlement under this arrangement.'
          : n === 2
            ? 'With one lever disabled, a combined weekend cutoff and 4.1× surge breaches the par floor.'
            : 'With fewer than two structural levers active, the draft breaks at 2.3× demand during bank closure.',
    },
    power: {
      world: 'World · Power & Compute',
      doc: 'Public rules · ISO interconnection queue',
      crumb: 'Adversarial shock sweep · Power & Compute',
      tree: [
        ['Interconnection queue', 'Substation milestones & slip rules'],
        ['Generation & storage', 'Grid feed, BESS, bridge power'],
        ['Compute schedule', 'Phased hall delivery & SLA dates'],
        ['Project covenants', 'Debt service coverage floor'],
      ],
      tracks: [
        ['iso_queue_timeline', 'bar', 16, 78],
        ['bridge_power_mw', 'step', 0, 0],
        ['campus_load_curve', 'wave', 0, 0],
        ['covenant_headroom', 'bar', 6, 86],
      ],
      ticks: ['M+00', 'M+06', 'M+12', 'M+18', 'M+24'],
      frames: [
        {
          ts: 'M + 00',
          rows: [
            ['iso_queue', 'Study phase'],
            ['bridge_power', 'Planned'],
            ['hall_load', '0 MW'],
            ['dscr_floor', 'Above'],
          ],
        },
        {
          ts: 'M + 08',
          rows: [
            ['iso_queue', '+8 mo slip'],
            ['bridge_power', 'Online'],
            ['bess_buffer', '4 hr'],
            ['dscr_floor', 'Above'],
          ],
        },
        {
          ts: 'M + 16',
          rows: [
            ['hall_tranche', 'Phase 2'],
            ['bridge_power', 'Active'],
            ['capex_draw', 'Matched'],
            ['dscr_floor', 'Above'],
          ],
        },
        {
          ts: 'M + 24',
          rows: [
            ['grid_tie', 'Energized'],
            ['delivery_sla', 'Met'],
            ['bridge_power', 'Standby'],
            ['dscr_floor', 'Above'],
          ],
        },
      ],
      replay: [
        ['ISO cluster study delay replay', 'MATCHED'],
        ['Transformer lead-time slip replay', 'MATCHED'],
      ],
      nodes: [
        'ISO queue slip',
        'Substation delivery',
        'Phased hall schedule',
        'Debt-service covenant floor',
      ],
      k1: 'queue_slip',
      k4: 'lead_delay',
      k5: 'covenant_floor',
      v5: '1.25×',
      unit: (v) => `+${Math.round((v / 100) * 24)} mo`,
      v4Fn: (v) => `+${Math.round((v / 100) * 14)} mo`,
      breakAt: 42,
      levers: [
        ['Behind-the-meter bridge + 4-hr storage', 'Covers full interconnection slip window', '01', true],
        ['Phased compute hall commissioning', 'Matches capital drawdowns to energized MW', '02', true],
        ['Fuel-collar operating rule', 'Protects debt-service coverage floor', '03', true],
      ],
      table: [
        ['Interconnection slip held', '+8 mo', '+24 mo'],
        ['Equipment lead delay', '+4 mo', '+14 mo'],
        ['Debt covenant floor', 'Breaks', 'Holds'],
      ],
      queryAns: (n) =>
        n === 3
          ? 'The project holds contracted delivery dates and debt covenants through a +24 month interconnection slip.'
          : n === 2
            ? 'With one lever disabled, a +14 month substation slip paired with equipment delay breaks the covenant floor.'
            : 'Unbuffered campus commissioning breaches debt service if the ISO queue slips past +8 months.',
    },
    trade: {
      world: 'World · Trade & Supply',
      doc: 'Public rules · Maritime transit & offtake',
      crumb: 'Adversarial shock sweep · Trade & Supply',
      tree: [
        ['Corridor transit', 'Strait openings & Cape sea-days'],
        ['Port & berth state', 'Queue depth & loading windows'],
        ['Offtake contracts', 'Purity specs & delivery dates'],
        ['Working capital', 'Float coverage & margin lines'],
      ],
      tracks: [
        ['primary_strait_state', 'bar', 6, 46],
        ['reroute_voyage_days', 'step', 0, 0],
        ['working_capital_float', 'wave', 0, 0],
        ['delivery_window_sla', 'bar', 12, 82],
      ],
      ticks: ['D+00', 'D+07', 'D+14', 'D+21', 'D+28'],
      frames: [
        {
          ts: 'D + 00',
          rows: [
            ['strait_state', 'Open'],
            ['route', 'Primary'],
            ['float_line', 'Normal'],
            ['offtake_sla', 'On time'],
          ],
        },
        {
          ts: 'D + 04',
          rows: [
            ['strait_state', 'Closed'],
            ['reroute_rule', 'Fired'],
            ['route', 'Cape'],
            ['offtake_sla', 'On time'],
          ],
        },
        {
          ts: 'D + 14',
          rows: [
            ['float_line', 'Active'],
            ['alt_port', 'Allocated'],
            ['berth_wait', '1.2 d'],
            ['offtake_sla', 'On time'],
          ],
        },
        {
          ts: 'D + 21',
          rows: [
            ['cargo_berth', 'Cleared'],
            ['settlement', 'Complete'],
            ['purity_spec', 'Met'],
            ['offtake_sla', 'Met'],
          ],
        },
      ],
      replay: [
        ['Canal transit closure replay', 'MATCHED'],
        ['Port berth queue & float replay', 'MATCHED'],
      ],
      nodes: [
        'Strait closure',
        'Cape reroute sea-days',
        'Voyage float capacity',
        'Offtake delivery window',
      ],
      k1: 'closure_days',
      k4: 'port_hold',
      k5: 'delivery_sla',
      v5: 'ON TIME',
      unit: (v) => `${Math.round((v / 100) * 30)} d`,
      v4Fn: (v) => `${Math.round((v / 100) * 21)} d`,
      breakAt: 38,
      levers: [
        ['Automatic Cape reroute trigger', 'Avoids multi-week anchorage queuing', '01', true],
        ['Secondary port split-delivery clause', 'Keeps buyer refinery supplied without halt', '02', true],
        ['Contingent voyage float facility', 'Covers extended sea-day working capital', '03', true],
      ],
      table: [
        ['Strait closure absorbed', '4 days', '30+ days'],
        ['Port hold tolerance', '6 days', '21 days'],
        ['Offtake delivery terms', 'Breaks', 'Holds'],
      ],
      queryAns: (n) =>
        n === 3
          ? 'Automatic rerouting, split delivery, and contingent float absorb a 30+ day strait closure on contracted terms.'
          : n === 2
            ? 'With one lever disabled, a 14-day closure combined with berth congestion breaks delivery terms.'
            : 'Under the unadjusted plan, a 4-day strait closure exhausts voyage float and breaches offtake delivery.',
    },
  };
}

function headroomY(val: number, breakAt: number): number {
  const s = 1 / (1 + Math.exp(-0.095 * (val - breakAt)));
  return 28 + s * 124;
}

function loadY(val: number, breakAt: number): number {
  const s = 1 / (1 + Math.exp(-0.085 * (val - breakAt)));
  return 140 - s * 118;
}

export function initHowItWorks(host: HTMLElement): void {
  const DATA = createDomainData();
  let curDom: DomainKey = 'money';
  let curStep = 0;

  const navBtns = Array.from(host.querySelectorAll<HTMLButtonElement>('[data-nm-nav]'));
  const panels = Array.from(host.querySelectorAll<HTMLElement>('[data-nm-panel]'));
  const domBtns = Array.from(host.querySelectorAll<HTMLButtonElement>('[data-nm-dom]'));
  const prevBtn = host.querySelector<HTMLButtonElement>('[data-nm-prev]');
  const nextBtn = host.querySelector<HTMLButtonElement>('[data-nm-next]');
  const stepReadout = host.querySelector<HTMLElement>('[data-nm-step-count]');

  // ---- 1. Click-to-Switch 4-Stage Controller (All 4 always visible!) -------
  const setStep = (idx: number, focus = false): void => {
    const total = panels.length;
    if (!total) return;
    curStep = ((idx % total) + total) % total;

    navBtns.forEach((b, i) => {
      const on = i === curStep;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', String(on));
      if (on) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });

    panels.forEach((p, i) => {
      const on = i === curStep;
      p.hidden = !on;
      if (on) {
        p.classList.remove('is-entering');
        // Force reflow for crisp Nominal stage choreography on click
        void p.offsetWidth;
        p.classList.add('is-entering');
      } else {
        p.classList.remove('is-entering');
      }
    });

    if (stepReadout) {
      stepReadout.textContent = `${String(curStep + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    }

    if (focus) navBtns[curStep]?.focus();
  };

  navBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => setStep(i));
  });
  prevBtn?.addEventListener('click', () => setStep(curStep - 1));
  nextBtn?.addEventListener('click', () => setStep(curStep + 1));

  // ---- 2. Step 01 · Model (Entity Tree + Synchronized State Timeline) ------
  const m1World = host.querySelector<HTMLElement>('[data-m1-world]');
  const m1Doc = host.querySelector<HTMLElement>('[data-m1-doc]');
  const m1Tree = host.querySelector<HTMLElement>('[data-m1-tree]');
  const m1Tracks = host.querySelector<HTMLElement>('[data-m1-tracks]');
  const m1Ticks = host.querySelector<HTMLElement>('[data-m1-ticks]');
  const m1Replay = host.querySelector<HTMLElement>('[data-m1-replay]');
  const m1Tl = host.querySelector<HTMLElement>('[data-m1-timeline]');
  const m1Cross = host.querySelector<HTMLElement>('[data-m1-cross]');
  const m1Pop = host.querySelector<HTMLElement>('[data-m1-pop]');
  const m1PopT = host.querySelector<HTMLElement>('[data-m1-pop-t]');
  const m1PopRows = host.querySelector<HTMLElement>('[data-m1-pop-rows]');

  let selectedEntity = 1;

  const updateTimeline = (pct: number): void => {
    const c = Math.max(8, Math.min(92, pct));
    const d = DATA[curDom];
    const idx = c < 26 ? 0 : c < 52 ? 1 : c < 76 ? 2 : 3;
    const frame = d.frames[idx] ?? d.frames[0]!;
    if (m1Cross) m1Cross.style.left = `${c.toFixed(1)}%`;
    if (m1Pop) m1Pop.style.left = `${Math.max(4, Math.min(54, c - 14)).toFixed(1)}%`;
    if (m1PopT) m1PopT.textContent = frame.ts;
    if (m1PopRows) {
      m1PopRows.innerHTML = frame.rows
        .map(([k, v]) => `<div class="nm-pop__r"><span>${k}</span><span>${v}</span></div>`)
        .join('');
    }
  };

  if (m1Tl) {
    const scrubAt = (clientX: number): void => {
      const r = m1Tl.getBoundingClientRect();
      if (!r.width) return;
      updateTimeline(((clientX - r.left) / r.width) * 100);
    };
    m1Tl.addEventListener('pointermove', (e) => scrubAt(e.clientX));
    m1Tl.addEventListener('click', (e) => scrubAt(e.clientX));
  }

  // ---- 3. Step 02 · Simulate (Live Stress Console + Exact Curve Math) ------
  const m2Crumb = host.querySelector<HTMLElement>('[data-m2-crumb]');
  const m2Nodes = host.querySelector<HTMLElement>('[data-m2-nodes]');
  const m2K1 = host.querySelector<HTMLElement>('[data-m2-k1]');
  const m2V1 = host.querySelector<HTMLElement>('[data-m2-v1]');
  const m2V2 = host.querySelector<HTMLElement>('[data-m2-v2]');
  const m2V3 = host.querySelector<HTMLElement>('[data-m2-v3]');
  const m2K4 = host.querySelector<HTMLElement>('[data-m2-k4]');
  const m2V4 = host.querySelector<HTMLElement>('[data-m2-v4]');
  const m2K5 = host.querySelector<HTMLElement>('[data-m2-k5]');
  const m2V5 = host.querySelector<HTMLElement>('[data-m2-v5]');
  const m2CurveH = host.querySelector<SVGPathElement>('[data-m2-curve-h]');
  const m2CurveL = host.querySelector<SVGPathElement>('[data-m2-curve-l]');
  const m2Playhead = host.querySelector<SVGGElement>('[data-m2-playhead]');
  const m2Dot = host.querySelector<SVGCircleElement>('[data-m2-dot]');
  const m2Slider = host.querySelector<HTMLInputElement>('[data-m2-slider]');
  const m2Readout = host.querySelector<HTMLElement>('[data-m2-readout]');

  const drawStressCurves = (breakAt: number): void => {
    const ptsH: string[] = [];
    const ptsL: string[] = [];
    for (let v = 0; v <= 100; v += 2) {
      const x = (10 + (v / 100) * 740).toFixed(1);
      ptsH.push(`${v === 0 ? 'M' : 'L'} ${x} ${headroomY(v, breakAt).toFixed(1)}`);
      ptsL.push(`${v === 0 ? 'M' : 'L'} ${x} ${loadY(v, breakAt).toFixed(1)}`);
    }
    m2CurveH?.setAttribute('d', ptsH.join(' '));
    m2CurveL?.setAttribute('d', ptsL.join(' '));
  };

  const updateScrub = (val: number): void => {
    const d = DATA[curDom];
    drawStressCurves(d.breakAt);
    const x = 10 + (val / 100) * 740;
    const y = headroomY(val, d.breakAt);
    m2Playhead?.setAttribute('transform', `translate(${x.toFixed(1)} 0)`);
    m2Dot?.setAttribute('cy', y.toFixed(1));
    if (m2V1) m2V1.textContent = d.unit(val);
    if (m2V4) m2V4.textContent = d.v4Fn(val);

    const headroom = (90 - y) / 62;
    const hFixed =
      Math.abs(headroom) < 0.005
        ? '0.00'
        : `${headroom > 0 ? '+' : ''}${headroom.toFixed(2)}`;
    if (m2V2) m2V2.textContent = hFixed;

    let state: 'holds' | 'hit' | 'breach' = 'holds';
    if (val < d.breakAt - 3) {
      state = 'holds';
      if (m2V3) {
        m2V3.textContent = 'HOLDS';
        m2V3.dataset['state'] = 'holds';
      }
    } else if (val <= d.breakAt + 3) {
      state = 'hit';
      if (m2V3) {
        m2V3.textContent = 'FIRST BREAK';
        m2V3.dataset['state'] = 'hit';
      }
    } else {
      state = 'breach';
      if (m2V3) {
        m2V3.textContent = 'BREACHED';
        m2V3.dataset['state'] = 'breach';
      }
    }

    if (m2Readout) m2Readout.textContent = `${val}% stress · ${d.unit(val)}`;

    if (m2Nodes) {
      m2Nodes.innerHTML = d.nodes
        .map((n, i) => {
          const cls =
            state === 'hit' && i === 2
              ? 'is-hit'
              : state === 'breach' && i >= 2
                ? 'is-breach'
                : '';
          const tag =
            state === 'hit' && i === 2
              ? 'BINDING'
              : state === 'breach' && i === 3
                ? 'BREACHED'
                : state === 'breach' && i === 2
                  ? 'EXCEEDED'
                  : 'OK';
          return `<div class="nm-node ${cls}"><span>${n}</span><span class="nm-node__s">${tag}</span></div>`;
        })
        .join('');
    }
  };

  m2Slider?.addEventListener('input', () => updateScrub(Number(m2Slider.value)));

  // ---- 4. Step 03 · Intervene (Procedure + Counterfactual + Query) ---------
  const m3Status = host.querySelector<HTMLElement>('[data-m3-status]');
  const m3Steps = host.querySelector<HTMLElement>('[data-m3-steps]');
  const m3Table = host.querySelector<HTMLElement>('[data-m3-table]');
  const m3Answer = host.querySelector<HTMLElement>('[data-m3-answer]');

  const renderLevers = (): void => {
    const d = DATA[curDom];
    const active = d.levers.filter((l) => l[3]).length;
    if (m3Status) {
      m3Status.textContent =
        active === 3 ? '3 / 3 ACTIVE · HOLDS' : `${active} / 3 ACTIVE · PARTIAL`;
    }
    if (m3Steps) {
      m3Steps.innerHTML = d.levers
        .map(
          (l, i) => `
          <button type="button" class="nm-proc__row ${l[3] ? 'is-on' : ''}" aria-pressed="${String(l[3])}" data-m3-lv="${i}">
            <span class="nm-proc__chk" aria-hidden="true">${l[3] ? '✓' : ''}</span>
            <span class="nm-proc__body">
              <b>${l[0]}</b>
              <em>${l[1]}</em>
            </span>
            <span class="nm-proc__idx">${l[2]}</span>
          </button>`,
        )
        .join('');

      m3Steps.querySelectorAll<HTMLButtonElement>('[data-m3-lv]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset['m3Lv']);
          const item = DATA[curDom].levers[idx];
          if (item) {
            item[3] = !item[3];
            renderLevers();
          }
        });
      });
    }

    if (m3Table) {
      m3Table.innerHTML = d.table
        .map(([k, base, plan], idx) => {
          const held = d.levers[idx]?.[3] ?? false;
          return `
            <div class="nm-diff__row">
              <div class="nm-diff__k">${k}</div>
              <div class="nm-diff__vals">
                <span class="nm-diff__base">${base}</span>
                <span class="nm-diff__plan ${held ? '' : 'is-fail'}">→ ${held ? plan : base}</span>
              </div>
            </div>`;
        })
        .join('');
    }

    if (m3Answer) m3Answer.textContent = d.queryAns(active);
  };

  // ---- 5. Master Domain Renderer -------------------------------------------
  const renderDomain = (): void => {
    const d = DATA[curDom];
    if (m1World) m1World.textContent = d.world;
    if (m1Doc) m1Doc.textContent = d.doc;
    if (m2Crumb) m2Crumb.textContent = d.crumb;

    if (m1Tree) {
      m1Tree.innerHTML = d.tree
        .map(
          ([k, v], i) => `
          <li>
            <button type="button" class="nm-tree__btn ${i === selectedEntity ? 'is-hi' : ''}" data-m1-ent="${i}">
              <span class="nm-tree__top"><b>${k}</b><i>0${i + 1}</i></span>
              <span class="nm-tree__sub">${v}</span>
            </button>
          </li>`,
        )
        .join('');

      m1Tree.querySelectorAll<HTMLButtonElement>('[data-m1-ent]').forEach((btn) => {
        btn.addEventListener('click', () => {
          selectedEntity = Number(btn.dataset['m1Ent']);
          renderDomain();
          updateTimeline(18 + selectedEntity * 22);
        });
      });
    }

    if (m1Tracks) {
      m1Tracks.innerHTML = d.tracks
        .map(([lbl, kind, l, w], i) => {
          let vis = '';
          if (kind === 'bar') {
            vis = `<div class="nm-bar"><span style="left:${l}%;width:${w}%;background:rgba(18,17,15,0.13)"></span><span style="left:${Math.min(l + 28, 56)}%;width:22%;background:rgba(229,134,0,0.72)"></span></div>`;
          } else if (kind === 'step') {
            vis = `<svg viewBox="0 0 440 22" class="nm-svgline" aria-hidden="true"><path d="M0 17 H86 V5 H206 V17 H318 V7 H440" fill="none" stroke="#141210" stroke-width="1.35" opacity="0.78"/></svg>`;
          } else {
            vis = `<svg viewBox="0 0 440 22" class="nm-svgline" aria-hidden="true"><path d="M0 14 Q68 4 136 13 T272 12 T440 8" fill="none" stroke="#e58600" stroke-width="1.5"/></svg>`;
          }
          return `<div class="nm-trk ${i === selectedEntity ? 'is-hi' : ''}"><div class="nm-trk__lbl"><span>${lbl}</span><span>SYNC</span></div>${vis}</div>`;
        })
        .join('');
    }

    if (m1Ticks) m1Ticks.innerHTML = d.ticks.map((t) => `<span>${t}</span>`).join('');
    if (m1Replay) {
      m1Replay.innerHTML = d.replay
        .map(([k, v]) => `<li><span>${k}</span><strong>${v}</strong></li>`)
        .join('');
    }

    updateTimeline(46);

    if (m2K1) m2K1.textContent = d.k1;
    if (m2K4) m2K4.textContent = d.k4;
    if (m2K5) m2K5.textContent = d.k5;
    if (m2V5) m2V5.textContent = d.v5;
    if (m2Slider) {
      m2Slider.value = String(d.breakAt);
      updateScrub(d.breakAt);
    } else {
      updateScrub(d.breakAt);
    }

    renderLevers();
  };

  domBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.dataset['nmDom'] as DomainKey | undefined;
      if (!k || !DATA[k]) return;
      curDom = k;
      domBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-selected', String(on));
      });
      renderDomain();
    });
  });

  renderDomain();
  setStep(0);
}
