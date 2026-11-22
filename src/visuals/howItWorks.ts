/**
 * 02 · How it works — Pinned 4-Step Nominal Operating Stack (Click-to-Switch)
 *
 * All four stages (01 Model the world, 02 Simulate to failure, 03 Intervene and
 * discover, 04 Commit the record) remain permanently visible on the left rail
 * and switch exclusively on click, while the right-hand workspace renders an
 * alive, realistic Nominal-grade interactive desktop environment.
 *
 * Strictly obeys the three institutional integrity rules:
 *   1. Public rules / clearly labeled simulated worlds only (never client claims).
 *   2. Zero made-up savings figures, zero named crises, zero 2023.
 *   3. Zero dashboard clichés (no pill badges, KPI card grids, or decorative gauges).
 */

import { mountSealPlate } from './worldPlates';

type DomainKey = 'money' | 'power' | 'trade';

interface TimelineFrame {
  ts: string;
  rows: ReadonlyArray<readonly [string, string]>;
}

interface CounterfactualRow {
  label: string;
  base: string;
  plan: string;
  basePct: number;
  planPct: number;
}

interface DomainModel {
  world: string;
  doc: string;
  crumb: string;
  tree: ReadonlyArray<readonly [string, string, string]>;
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
  table: readonly CounterfactualRow[];
  queryAns: (activeCount: number) => string;
  commitRuleset: string;
  commitDigest: string;
  commitHorizon: string;
}

function createDomainData(): Record<DomainKey, DomainModel> {
  return {
    money: {
      world: 'World · Money & Clearing',
      doc: 'Public rules · OCC reserve standards',
      crumb: 'Adversarial shock sweep · Money & Clearing',
      tree: [
        ['Public statutes', '1:1 reserve eligibility & attestation', '4 rules'],
        ['Settlement rails', '24/7 rails & bank cutoff windows', '6 rules'],
        ['Balance sheet', 'Liquid instruments & cash ladders', '5 rules'],
        ['Counterparties', 'Merchant payout SLAs & limits', '3 rules'],
      ],
      tracks: [
        ['reserve_eligibility', 'bar', 6, 86],
        ['bank_cutoff_window', 'step', 0, 0],
        ['rail_throughput_24x7', 'wave', 0, 0],
        ['par_settlement_floor', 'bar', 10, 80],
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
        { label: 'Peak demand multiple', base: '2.3×', plan: '6.0×', basePct: 38, planPct: 96 },
        { label: 'Single-bank outage held', base: '3.5 h', plan: '48 h+', basePct: 18, planPct: 94 },
        { label: 'Par settlement rule', base: 'Breaks', plan: 'Holds', basePct: 24, planPct: 100 },
      ],
      queryAns: (n) =>
        n === 3
          ? 'No single-bank cutoff or surge below 6.0× breaks par settlement under this arrangement.'
          : n === 2
            ? 'With one lever disabled, a combined weekend cutoff and 4.1× surge breaches the par floor.'
            : 'With fewer than two structural levers active, the draft breaks at 2.3× demand during bank closure.',
      commitRuleset: 'OCC reserve standards · Public ruleset',
      commitDigest: 'sha256: 7c41…a9e0',
      commitHorizon: '48 h settlement window',
    },
    power: {
      world: 'World · Power & Compute',
      doc: 'Public rules · ISO interconnection queue',
      crumb: 'Adversarial shock sweep · Power & Compute',
      tree: [
        ['Interconnection queue', 'Substation milestones & slip rules', '5 rules'],
        ['Generation & storage', 'Grid feed, BESS, bridge power', '4 rules'],
        ['Compute schedule', 'Phased hall delivery & SLA dates', '4 rules'],
        ['Project covenants', 'Debt service coverage floor', '3 rules'],
      ],
      tracks: [
        ['iso_queue_timeline', 'bar', 14, 80],
        ['bridge_power_mw', 'step', 0, 0],
        ['campus_load_curve', 'wave', 0, 0],
        ['covenant_headroom', 'bar', 8, 84],
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
        { label: 'Interconnection slip held', base: '+8 mo', plan: '+24 mo', basePct: 33, planPct: 96 },
        { label: 'Equipment lead delay', base: '+4 mo', plan: '+14 mo', basePct: 28, planPct: 92 },
        { label: 'Debt covenant floor', base: 'Breaks', plan: 'Holds', basePct: 22, planPct: 100 },
      ],
      queryAns: (n) =>
        n === 3
          ? 'The project holds contracted delivery dates and debt covenants through a +24 month interconnection slip.'
          : n === 2
            ? 'With one lever disabled, a +14 month substation slip paired with equipment delay breaks the covenant floor.'
            : 'Unbuffered campus commissioning breaches debt service if the ISO queue slips past +8 months.',
      commitRuleset: 'ISO interconnection queue · Public ruleset',
      commitDigest: 'sha256: 4b9e…2d18',
      commitHorizon: '24 mo energization schedule',
    },
    trade: {
      world: 'World · Trade & Supply',
      doc: 'Public rules · Maritime transit & offtake',
      crumb: 'Adversarial shock sweep · Trade & Supply',
      tree: [
        ['Corridor transit', 'Strait openings & Cape sea-days', '4 rules'],
        ['Port & berth state', 'Queue depth & loading windows', '4 rules'],
        ['Offtake contracts', 'Purity specs & delivery dates', '5 rules'],
        ['Working capital', 'Float coverage & margin lines', '3 rules'],
      ],
      tracks: [
        ['primary_strait_state', 'bar', 6, 48],
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
        { label: 'Strait closure absorbed', base: '4 days', plan: '30+ days', basePct: 16, planPct: 96 },
        { label: 'Port hold tolerance', base: '6 days', plan: '21 days', basePct: 28, planPct: 92 },
        { label: 'Offtake delivery terms', base: 'Breaks', plan: 'Holds', basePct: 20, planPct: 100 },
      ],
      queryAns: (n) =>
        n === 3
          ? 'Automatic rerouting, split delivery, and contingent float absorb a 30+ day strait closure on contracted terms.'
          : n === 2
            ? 'With one lever disabled, a 14-day closure combined with berth congestion breaks delivery terms.'
            : 'Under the unadjusted plan, a 4-day strait closure exhausts voyage float and breaches offtake delivery.',
      commitRuleset: 'Maritime transit & offtake · Public ruleset',
      commitDigest: 'sha256: 9f12…e604',
      commitHorizon: '28 d voyage & berth window',
    },
  };
}

function headroomY(val: number, breakAt: number): number {
  const s = 1 / (1 + Math.exp(-0.095 * (val - breakAt)));
  return 24 + s * 116;
}

function loadY(val: number, breakAt: number): number {
  const s = 1 / (1 + Math.exp(-0.085 * (val - breakAt)));
  return 128 - s * 106;
}

export function initHowItWorks(host: HTMLElement): void {
  const DATA = createDomainData();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let curDom: DomainKey = 'money';
  let curStep = 0;

  const navBtns = Array.from(host.querySelectorAll<HTMLButtonElement>('[data-nm-nav]'));
  const panels = Array.from(host.querySelectorAll<HTMLElement>('[data-nm-panel]'));
  const domBtns = Array.from(host.querySelectorAll<HTMLButtonElement>('[data-nm-dom]'));
  const prevBtn = host.querySelector<HTMLButtonElement>('[data-nm-prev]');
  const nextBtn = host.querySelector<HTMLButtonElement>('[data-nm-next]');
  const stepReadout = host.querySelector<HTMLElement>('[data-nm-step-count]');

  // ---- Step 01 · Model state clock ----------------------------------------
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
  const m1PlayBtn = host.querySelector<HTMLButtonElement>('[data-m1-play]');

  let selectedEntity = 1;
  let m1Pct = 44;
  let m1Playing = false;
  let m1Raf = 0;
  let m1Last = 0;

  const updateTimeline = (pct: number): void => {
    const c = Math.max(8, Math.min(92, pct));
    m1Pct = c;
    const d = DATA[curDom];
    const idx = c < 26 ? 0 : c < 52 ? 1 : c < 76 ? 2 : 3;
    const frame = d.frames[idx] ?? d.frames[0]!;
    if (m1Cross) m1Cross.style.left = `${c.toFixed(2)}%`;
    if (m1Pop) m1Pop.style.left = `${Math.max(4, Math.min(54, c - 14)).toFixed(2)}%`;
    if (m1PopT) m1PopT.textContent = frame.ts;
    if (m1PopRows) {
      m1PopRows.innerHTML = frame.rows
        .map(([k, v]) => `<div class="nm-pop__r"><span>${k}</span><span>${v}</span></div>`)
        .join('');
    }
  };

  const setM1Playing = (on: boolean): void => {
    m1Playing = on && !reducedMotion;
    if (m1PlayBtn) {
      m1PlayBtn.setAttribute('aria-pressed', String(m1Playing));
      m1PlayBtn.textContent = m1Playing ? '❚❚' : '▶';
    }
    cancelAnimationFrame(m1Raf);
    if (m1Playing) {
      m1Last = performance.now();
      const tick = (now: number): void => {
        if (!m1Playing || curStep !== 0) return;
        const dt = Math.min(0.06, (now - m1Last) / 1000);
        m1Last = now;
        let next = m1Pct + dt * 5.2;
        if (next > 88) next = 14;
        updateTimeline(next);
        m1Raf = requestAnimationFrame(tick);
      };
      m1Raf = requestAnimationFrame(tick);
    }
  };

  m1PlayBtn?.addEventListener('click', () => setM1Playing(!m1Playing));

  if (m1Tl) {
    const scrubAt = (clientX: number): void => {
      if (m1Playing) setM1Playing(false);
      const r = m1Tl.getBoundingClientRect();
      if (!r.width) return;
      updateTimeline(((clientX - r.left) / r.width) * 100);
    };
    m1Tl.addEventListener('pointermove', (e) => scrubAt(e.clientX));
    m1Tl.addEventListener('click', (e) => scrubAt(e.clientX));
  }

  // ---- Step 02 · Simulate live sweep console ------------------------------
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
  const m2BreachArea = host.querySelector<SVGPathElement>('[data-m2-breach-area]');
  const m2BreakMark = host.querySelector<SVGLineElement>('[data-m2-break-mark]');
  const m2Playhead = host.querySelector<SVGGElement>('[data-m2-playhead]');
  const m2Dot = host.querySelector<SVGCircleElement>('[data-m2-dot]');
  const m2Slider = host.querySelector<HTMLInputElement>('[data-m2-slider]');
  const m2Readout = host.querySelector<HTMLElement>('[data-m2-readout]');
  const m2PlayBtn = host.querySelector<HTMLButtonElement>('[data-m2-play]');

  let m2Playing = false;
  let m2Raf = 0;
  let m2Last = 0;
  let m2Val = 46;

  const drawStressCurves = (breakAt: number): void => {
    const ptsH: string[] = [];
    const ptsL: string[] = [];
    const breachPts: string[] = [];
    const floorY = 82;
    const breakX = 10 + (breakAt / 100) * 740;

    for (let v = 0; v <= 100; v += 2) {
      const x = 10 + (v / 100) * 740;
      const yh = headroomY(v, breakAt);
      const yl = loadY(v, breakAt);
      ptsH.push(`${v === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yh.toFixed(1)}`);
      ptsL.push(`${v === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yl.toFixed(1)}`);
      if (v >= breakAt) {
        breachPts.push(`L ${x.toFixed(1)} ${yh.toFixed(1)}`);
      }
    }
    m2CurveH?.setAttribute('d', ptsH.join(' '));
    m2CurveL?.setAttribute('d', ptsL.join(' '));
    if (m2BreachArea) {
      const dStr = `M ${breakX.toFixed(1)} ${floorY} ${breachPts.join(' ')} L 750 ${floorY} Z`;
      m2BreachArea.setAttribute('d', dStr);
    }
    if (m2BreakMark) {
      m2BreakMark.setAttribute('x1', breakX.toFixed(1));
      m2BreakMark.setAttribute('x2', breakX.toFixed(1));
    }
  };

  const updateScrub = (val: number): void => {
    m2Val = val;
    const d = DATA[curDom];
    drawStressCurves(d.breakAt);
    const x = 10 + (val / 100) * 740;
    const y = headroomY(val, d.breakAt);
    m2Playhead?.setAttribute('transform', `translate(${x.toFixed(1)} 0)`);
    m2Dot?.setAttribute('cy', y.toFixed(1));
    if (m2Slider) m2Slider.value = String(Math.round(val));
    if (m2V1) m2V1.textContent = d.unit(val);
    if (m2V4) m2V4.textContent = d.v4Fn(val);

    const floorY = 82;
    const headroom = (floorY - y) / 58;
    const hFixed =
      Math.abs(headroom) < 0.015
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

    if (m2Readout) m2Readout.textContent = `${Math.round(val)}% stress · ${d.unit(val)}`;

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

  const setM2Playing = (on: boolean): void => {
    m2Playing = on && !reducedMotion;
    if (m2PlayBtn) {
      m2PlayBtn.setAttribute('aria-pressed', String(m2Playing));
      m2PlayBtn.textContent = m2Playing ? '❚❚ PAUSE' : '▶ SWEEP';
    }
    cancelAnimationFrame(m2Raf);
    if (m2Playing) {
      if (m2Val >= 86) m2Val = 12;
      m2Last = performance.now();
      let holdUntil = 0;
      const tick = (now: number): void => {
        if (!m2Playing || curStep !== 1) return;
        const dt = Math.min(0.06, (now - m2Last) / 1000);
        m2Last = now;
        const brk = DATA[curDom].breakAt;
        if (now < holdUntil) {
          m2Raf = requestAnimationFrame(tick);
          return;
        }
        const prev = m2Val;
        let next = prev + dt * 16;
        if (prev < brk && next >= brk) {
          next = brk;
          holdUntil = now + 1400;
        } else if (next > 86) {
          next = 12;
        }
        updateScrub(next);
        m2Raf = requestAnimationFrame(tick);
      };
      m2Raf = requestAnimationFrame(tick);
    }
  };

  m2PlayBtn?.addEventListener('click', () => setM2Playing(!m2Playing));
  m2Slider?.addEventListener('input', () => {
    if (m2Playing) setM2Playing(false);
    updateScrub(Number(m2Slider.value));
  });

  // ---- Step 03 · Intervene (Procedure + Counterfactual Bars + Query) ------
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
        .map((row, idx) => {
          const held = d.levers[idx]?.[3] ?? false;
          const pct = held ? row.planPct : row.basePct;
          return `
            <div class="nm-diff__row">
              <div class="nm-diff__top">
                <span class="nm-diff__k">${row.label}</span>
                <span class="nm-diff__vals">
                  <span class="nm-diff__base">${row.base}</span>
                  <span class="nm-diff__plan ${held ? '' : 'is-fail'}">→ ${held ? row.plan : row.base}</span>
                </span>
              </div>
              <div class="nm-diff__track" aria-hidden="true">
                <i class="nm-diff__bbar" style="width:${row.basePct}%"></i>
                <i class="nm-diff__pbar ${held ? '' : 'is-fail'}" style="width:${pct}%"></i>
              </div>
            </div>`;
        })
        .join('');
    }

    if (m3Answer) m3Answer.textContent = d.queryAns(active);
  };

  // ---- Step 04 · Commit dynamic ledger fields -----------------------------
  const m4Ruleset = host.querySelector<HTMLElement>('[data-m4-ruleset]');
  const m4Digest = host.querySelector<HTMLElement>('[data-m4-digest]');
  const m4DigestFoot = host.querySelector<HTMLElement>('[data-m4-digest-foot]');
  const m4Horizon = host.querySelector<HTMLElement>('[data-m4-horizon]');
  const sealHost = host.querySelector<HTMLElement>('[data-seal-plate]');

  // ---- 1. Click-to-Switch 4-Stage Controller (All 4 always visible!) -------
  const setStep = (idx: number, focus = false): void => {
    const total = panels.length;
    if (!total) return;
    curStep = ((idx % total) + total) % total;

    // Pause inactive transport loops
    if (curStep !== 0 && m1Playing) setM1Playing(false);
    if (curStep !== 1 && m2Playing) setM2Playing(false);

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
        void p.offsetWidth;
        p.classList.add('is-entering');
      } else {
        p.classList.remove('is-entering');
      }
    });

    if (stepReadout) {
      stepReadout.textContent = `${String(curStep + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    }

    // Ensure Step 04 stratified Transcription-Device plan seal renders crisply once unhidden
    if (curStep === 3 && sealHost) {
      requestAnimationFrame(() => mountSealPlate(sealHost));
    }

    if (focus) navBtns[curStep]?.focus();
  };

  navBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => setStep(i));
  });
  prevBtn?.addEventListener('click', () => setStep(curStep - 1));
  nextBtn?.addEventListener('click', () => setStep(curStep + 1));

  // ---- 5. Master Domain Renderer -------------------------------------------
  const renderDomain = (): void => {
    const d = DATA[curDom];
    if (m1World) m1World.textContent = d.world;
    if (m1Doc) m1Doc.textContent = d.doc;
    if (m2Crumb) m2Crumb.textContent = d.crumb;

    if (m1Tree) {
      m1Tree.innerHTML = d.tree
        .map(
          ([k, v, ct], i) => `
          <li>
            <button type="button" class="nm-tree__btn ${i === selectedEntity ? 'is-hi' : ''}" data-m1-ent="${i}">
              <span class="nm-tree__top"><b>${k}</b><i>${ct}</i></span>
              <span class="nm-tree__sub">${v}</span>
            </button>
          </li>`,
        )
        .join('');

      m1Tree.querySelectorAll<HTMLButtonElement>('[data-m1-ent]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (m1Playing) setM1Playing(false);
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
            vis = `<div class="nm-bar">
              <span class="nm-bar__base" style="left:${l}%;width:${w}%"></span>
              <span class="nm-bar__sig" style="left:${Math.min(l + 26, 54)}%;width:24%"></span>
            </div>`;
          } else if (kind === 'step') {
            vis = `<svg viewBox="0 0 440 24" class="nm-svgline" aria-hidden="true">
              <path d="M0 19 H84 V5 H204 V19 H318 V7 H440 V24 H0 Z" fill="rgba(26,23,20,0.045)"/>
              <path d="M0 19 H84 V5 H204 V19 H318 V7 H440" fill="none" stroke="#1a1714" stroke-width="1.3" opacity="0.82"/>
            </svg>`;
          } else {
            vis = `<svg viewBox="0 0 440 24" class="nm-svgline" aria-hidden="true">
              <path d="M0 15 Q55 5 110 13 T220 11 T330 14 T440 8 L440 24 L0 24 Z" fill="rgba(196,122,24,0.10)"/>
              <path d="M0 15 Q55 5 110 13 T220 11 T330 14 T440 8" fill="none" stroke="#c47a18" stroke-width="1.45"/>
            </svg>`;
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
    updateScrub(d.breakAt);

    if (m4Ruleset) m4Ruleset.textContent = d.commitRuleset;
    if (m4Digest) m4Digest.textContent = d.commitDigest;
    if (m4DigestFoot) m4DigestFoot.textContent = `DIGEST · ${d.commitDigest.replace('sha256: ', '')}`;
    if (m4Horizon) m4Horizon.textContent = d.commitHorizon;

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
