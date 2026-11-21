/**
 * 02 · How it works — Nominal-style 4-Step Generalized Operating Stack
 *
 * Powers four quiet, interactive software artifacts built strictly on public rules
 * and clearly labeled simulated worlds (zero client claims, zero made-up savings,
 * zero named crises, zero dashboard badges):
 *   01 · Model     — Interactive timeline scrub & floating dark state inspector
 *   02 · Simulate  — Clean stress-sweep regime switcher marking First break
 *   03 · Intervene — Live structural lever toggles flipping draft break -> hold
 *   04 · Record    — Sticky rail tracking across all four steps
 */
export function initHowItWorks(host: HTMLElement): void {
  // ---- 1. Sticky Left Rail Scroll-Spy & Smooth Navigation ------------------
  const navBtns = Array.from(host.querySelectorAll<HTMLButtonElement>('[data-nm-nav]'));
  const blocks = Array.from(host.querySelectorAll<HTMLElement>('[data-nm-block]'));

  const setActiveNav = (idx: number): void => {
    navBtns.forEach((b, i) => {
      const on = i === idx;
      b.classList.toggle('is-on', on);
      if (on) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
  };

  navBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      setActiveNav(i);
      blocks[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  if (blocks.length) {
    let queued = false;
    const syncScroll = (): void => {
      const line = window.innerHeight * 0.42;
      let active = 0;
      blocks.forEach((b, i) => {
        if (b.getBoundingClientRect().top <= line) active = i;
      });
      setActiveNav(active);
    };
    const onScroll = (): void => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        syncScroll();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    syncScroll();
  }

  // ---- 2. Step 01 (Model) — Interactive Synchronized Clock Scrub -----------
  const scrub = host.querySelector<HTMLElement>('[data-nm-scrub]');
  const cursor = host.querySelector<HTMLElement>('[data-nm-cursor]');
  const pop = host.querySelector<HTMLElement>('[data-nm-pop]');
  const popT = host.querySelector<HTMLElement>('[data-nm-pop-t]');
  const popR1 = host.querySelector<HTMLElement>('[data-nm-pop-r1]');
  const popR2 = host.querySelector<HTMLElement>('[data-nm-pop-r2]');
  const popR3 = host.querySelector<HTMLElement>('[data-nm-pop-r3]');

  const FRAMES = [
    { x: 24, t: 't + 00:00', r1: 'Public reserve rule · Active', r2: 'Primary rails · Open', r3: 'Settlement window · 15 min' },
    { x: 46, t: 't + 06:00', r1: 'Cutoff rule · Bank window closed', r2: '24/7 rail · Active', r3: 'Queue lag · 0.4 h' },
    { x: 68, t: 't + 18:00', r1: 'Interconnection rule · Queue check', r2: 'Backup path · Standby', r3: 'Constraint margin · Nominal' },
    { x: 84, t: 't + 36:00', r1: 'Covenant test · Continuous', r2: 'All obligations · Reconciled', r3: 'Replay error · Within 1.8%' },
  ] as const;

  const applyFrame = (pct: number): void => {
    const clamped = Math.max(12, Math.min(88, pct));
    const idx = clamped < 34 ? 0 : clamped < 56 ? 1 : clamped < 76 ? 2 : 3;
    const f = FRAMES[idx]!;
    if (cursor) cursor.style.left = `${clamped.toFixed(1)}%`;
    if (pop) {
      const popLeft = Math.max(8, Math.min(54, clamped - 14));
      pop.style.left = `${popLeft.toFixed(1)}%`;
    }
    if (popT) popT.textContent = f.t;
    if (popR1) popR1.textContent = f.r1;
    if (popR2) popR2.textContent = f.r2;
    if (popR3) popR3.textContent = f.r3;
  };

  if (scrub) {
    const onMove = (clientX: number): void => {
      const r = scrub.getBoundingClientRect();
      if (!r.width) return;
      applyFrame(((clientX - r.left) / r.width) * 100);
    };
    scrub.addEventListener('pointermove', (e) => onMove(e.clientX));
    scrub.addEventListener('click', (e) => onMove(e.clientX));
    applyFrame(46);
  }

  // ---- 3. Step 02 (Simulate) — Clean Stress Regime Switcher ----------------
  const regimeBtns = Array.from(host.querySelectorAll<HTMLButtonElement>('[data-nm-regime]'));
  const simPath = host.querySelector<SVGPathElement>('[data-nm-sim-path]');
  const simBreak = host.querySelector<SVGGElement>('[data-nm-sim-break]');
  const simAxis = host.querySelector<HTMLElement>('[data-nm-sim-axis]');
  const simFirst = host.querySelector<HTMLElement>('[data-nm-sim-first]');

  const REGIMES: Record<
    string,
    { path: string; bx: number; by: number; axis: string; first: string }
  > = {
    surge: {
      path: 'M 12 36 C 95 40, 165 56, 224 96 C 280 132, 355 152, 468 164',
      bx: 224,
      by: 96,
      axis: 'Synthetic demand multiple · 1.0× to 6.0×',
      first: 'First break · 2.3× demand multiple',
    },
    outage: {
      path: 'M 12 34 C 72 44, 118 68, 152 96 C 215 142, 310 158, 468 166',
      bx: 152,
      by: 96,
      axis: 'Counterparty rail outage · 0 h to 48 h',
      first: 'First break · 3.5 h without secondary rail',
    },
    slip: {
      path: 'M 12 38 C 120 42, 210 60, 276 96 C 335 128, 405 148, 468 160',
      bx: 276,
      by: 96,
      axis: 'Schedule or interconnection slip · 0 mo to +24 mo',
      first: 'First break · +8 mo without bridge capacity',
    },
  };

  const applyRegime = (key: string): void => {
    const r = REGIMES[key] ?? REGIMES['surge']!;
    regimeBtns.forEach((b) => {
      const on = b.dataset['nmRegime'] === key;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    simPath?.setAttribute('d', r.path);
    simBreak?.setAttribute('transform', `translate(${r.bx} ${r.by})`);
    if (simAxis) simAxis.textContent = r.axis;
    if (simFirst) simFirst.textContent = r.first;
  };

  regimeBtns.forEach((b) =>
    b.addEventListener('click', () => applyRegime(b.dataset['nmRegime'] ?? 'surge')),
  );
  applyRegime('surge');

  // ---- 4. Step 03 (Intervene) — Live Structural Lever Toggles --------------
  const leverBtns = Array.from(host.querySelectorAll<HTMLButtonElement>('[data-nm-lever]'));
  const verdictEl = host.querySelector<HTMLElement>('[data-nm-verdict]');
  const detailEl = host.querySelector<HTMLElement>('[data-nm-detail]');
  const fillEl = host.querySelector<HTMLElement>('[data-nm-meter]');

  const syncLevers = (): void => {
    const activeCount = leverBtns.filter((b) => b.classList.contains('is-on')).length;
    if (verdictEl) {
      if (activeCount === 3) {
        verdictEl.textContent = 'All simulated stress regimes hold';
        verdictEl.dataset['state'] = 'hold';
      } else if (activeCount === 0) {
        verdictEl.textContent = 'Draft breaks under all three regimes';
        verdictEl.dataset['state'] = 'break';
      } else {
        verdictEl.textContent = `${activeCount} of 3 regimes hold · partial coverage`;
        verdictEl.dataset['state'] = 'partial';
      }
    }
    if (detailEl) {
      if (activeCount === 3) {
        detailEl.textContent = 'Redundant path, flow cap, and sequencing active together.';
      } else if (activeCount === 0) {
        detailEl.textContent = 'Enable structural levers below to test combinations live.';
      } else {
        detailEl.textContent = 'Toggle the remaining levers to clear every stress boundary.';
      }
    }
    if (fillEl) {
      const pct = activeCount === 3 ? 100 : activeCount === 2 ? 68 : activeCount === 1 ? 36 : 14;
      fillEl.style.width = `${pct}%`;
    }
  };

  leverBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = !btn.classList.contains('is-on');
      btn.classList.toggle('is-on', next);
      btn.setAttribute('aria-pressed', String(next));
      syncLevers();
    });
  });
  syncLevers();
}
