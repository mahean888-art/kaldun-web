/**
 * The three questions, each with a field that shows its answer.
 *
 * The fields borrow the hero's parts in a flat, diagrammatic form: resources,
 * agreements, capacity and obligations. Charcoal is the established
 * structure; orange marks what the question changes. Every field is an
 * illustration of the kind of result, not a customer result: no figures,
 * no rankings.
 *
 *   1. Conditions change — a delay moves toward its limit; obligations come to
 *      overlap; capacity is the first constraint to bind.
 *   2. Act differently — two ways to make the same commitment, compared on
 *      cost, timing and what each requires.
 *   3. A better arrangement — commit in stages as capacity becomes available,
 *      with its condition and its trade-off.
 *
 * On wide screens the questions are tabs beside one field; on narrow ones all
 * three stand in order, each with its question, field and result together.
 */

const VB = 'viewBox="0 0 640 360"';

const label = (x: number, y: number, t: string, cls = 'q-txt', anchor = 'start'): string =>
  `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${t}</text>`;

/** An annotation: a short orange pill with a leader to what it explains. */
const note = (x: number, y: number, t: string, lx?: number, ly?: number): string => {
  const w = t.length * 6.6 + 16;
  const leader = lx !== undefined && ly !== undefined ? `<path class="q-leader" d="M${x + w / 2} ${y + 9}L${lx} ${ly}"/>` : '';
  return `${leader}<g class="q-note"><rect x="${x}" y="${y - 9}" width="${w}" height="18"/><text x="${x + 8}" y="${y + 4}">${t}</text></g>`;
};

function conditions(): string {
  return `<svg ${VB} class="q-svg q-svg--1" role="img" aria-label="A supplier delay moves toward its limit; two obligations come to overlap; capacity is the first constraint to bind.">
    ${label(40, 30, 'CONDITION · SUPPLIER DELAY')}
    <path class="q-track" d="M40 50H600"/>
    <path class="q-tick" d="M40 44v12M180 46v8M320 46v8M460 46v8M600 44v12"/>
    <path class="q-limit" d="M440 38V62"/>${label(446, 36, 'LIMIT', 'q-txt q-txt--am')}
    <g class="q1-marker" style="--dx:380px"><rect class="q-am" x="54" y="44" width="12" height="12" transform="rotate(45 60 50)"/></g>

    <rect class="q-pp" x="40" y="92" width="96" height="30"/>${label(50, 111, 'SUPPLIER')}
    <path class="q-dep" d="M136 107H160V163H282"/>
    <g class="q1-late">${note(150, 82, 'dependency exposed', 160, 120)}</g>

    <rect class="q-pp" x="262" y="96" width="160" height="26"/>${label(270, 113, 'OBLIGATION A')}
    <g class="q1-shift" style="--dx:100px"><rect class="q-pp q-pp--move" x="182" y="150" width="150" height="26"/>${label(190, 167, 'OBLIGATION B')}</g>

    ${label(40, 214, 'CAPACITY', 'q-txt')}
    <path class="q-cap" d="M110 210H600"/>
    <rect class="q-load" x="262" y="232" width="160" height="38"/>
    <g class="q1-shift" style="--dx:100px"><rect class="q-load q-load--b" x="182" y="250" width="150" height="20"/></g>
    <g class="q1-late">
      <rect class="q-hatch" x="282" y="196" width="140" height="36"/>
      <rect class="q-am" x="282" y="196" width="140" height="14"/>
      ${note(434, 200, 'first constraint to bind', 422, 203)}
    </g>
    <path class="q-axis" d="M40 270H600"/>${label(600, 290, 'TIME →', 'q-txt', 'end')}

    <g class="q-chain">${label(40, 330, 'DELAY')}<text class="q-txt" x="96" y="330">→</text>${label(118, 330, 'OBLIGATIONS OVERLAP')}<text class="q-txt" x="282" y="330">→</text>${label(304, 330, 'CAPACITY FALLS SHORT', 'q-txt q-txt--am')}</g>
  </svg>`;
}

/** A small arrangement in elevation: resources, an agreement, capacity. */
function arrangement(x: number, y: number, late: boolean): string {
  const shift = late ? 34 : 0;
  return `<rect class="q-pp" x="${x}" y="${y + 26}" width="44" height="40"/><rect class="q-am" x="${x}" y="${y + 26}" width="44" height="9"/>
    <path class="q-deck${late ? ' q-deck--late' : ''}" d="M${x + 44} ${y + 34}H${x + 108 + shift}"/>
    <rect class="q-pp" x="${x + 108 + shift}" y="${y + 6}" width="18" height="60"/><rect class="q-pp" x="${x + 132 + shift}" y="${y + 18}" width="18" height="48"/><rect class="q-pp" x="${x + 156 + shift}" y="${y}" width="18" height="66"/>
    <path class="q-axis" d="M${x - 6} ${y + 66}H${x + 214}"/>`;
}

function rows(x: number, y: number, vals: [string, string, string], changed: boolean): string {
  const names = ['COST', 'TIMING', 'REQUIRES'];
  return names
    .map((n, i) => `${label(x, y + i * 30, n)}<text class="q-val${changed && i < 2 ? ' q-val--am' : ''}" x="${x + 76}" y="${y + i * 30}">${vals[i]}</text><path class="q-rule" d="M${x} ${y + i * 30 + 10}H${x + 250}"/>`)
    .join('');
}

function alternatives(): string {
  return `<svg ${VB} class="q-svg q-svg--2" role="img" aria-label="Two ways to make the same commitment: commit now, with cost up front and full capacity needed at the start; or commit later, with the cost shifted and the timing changed.">
    <path class="q-bracket" d="M40 34V26H600V34"/>${label(320, 18, 'SAME DECISION · SAME OBJECTIVES AND CONSTRAINTS', 'q-txt', 'middle')}
    ${label(40, 62, 'A · COMMIT NOW', 'q-txt q-txt--ink')}
    ${label(340, 62, 'B · COMMIT LATER', 'q-txt q-txt--ink')}
    <g transform="translate(0 6)">${arrangement(46, 80, false)}</g>
    <g class="q2-b" transform="translate(0 6)">${arrangement(346, 80, true)}</g>
    ${rows(40, 196, ['Up front', 'As planned', 'Full capacity at the start'], false)}
    ${rows(340, 196, ['Shifts later', 'One quarter later', 'A later delivery window'], true)}
    ${note(476, 166, 'cost shifts here', 480, 190)}
    ${note(500, 300, 'timing changed', 470, 226)}
  </svg>`;
}

function arrangementChange(): string {
  return `<svg ${VB} class="q-svg q-svg--3" role="img" aria-label="Original arrangement: one commitment made all at once. Proposed: commit in stages as capacity becomes available; requires revised terms and may extend completion.">
    ${label(40, 30, 'ORIGINAL ARRANGEMENT', 'q-txt q-txt--ink')}
    <rect class="q-pp q-pp--dim" x="40" y="70" width="52" height="56"/>
    <path class="q-deck q-deck--dim" d="M92 82H220"/>
    <rect class="q-pp q-pp--dim" x="220" y="52" width="20" height="74"/><rect class="q-pp q-pp--dim" x="246" y="64" width="20" height="62"/><rect class="q-pp q-pp--dim" x="272" y="44" width="20" height="82"/>
    <path class="q-axis" d="M34 126H300"/>
    ${label(40, 150, 'All at once')}

    ${label(340, 30, 'PROPOSED CHANGE', 'q-txt q-txt--am')}
    <rect class="q-pp" x="340" y="70" width="52" height="56"/><rect class="q-am" x="340" y="70" width="52" height="10"/>
    <path class="q-stage q3-s1" d="M392 112H468"/><path class="q-stage q3-s2" d="M392 96Q470 96 494 96H520"/><path class="q-stage q3-s3" d="M392 80Q500 80 546 80H572"/>
    <rect class="q-pp" x="468" y="88" width="20" height="38"/><rect class="q-pp" x="520" y="72" width="20" height="54"/><rect class="q-pp" x="572" y="56" width="20" height="70"/>
    <path class="q-axis" d="M334 126H600"/>
    ${label(470, 146, 'T1', 'q-txt q-txt--am')}${label(522, 146, 'T2', 'q-txt q-txt--am')}${label(574, 146, 'T3', 'q-txt q-txt--am')}
    ${note(398, 186, 'new terms required', 420, 112)}

    <path class="q-rule" d="M40 226H600"/>
    ${label(40, 254, 'PROPOSAL')}<text class="q-val" x="150" y="254">Commit in stages as capacity becomes available.</text>
    ${label(40, 284, 'CONDITION')}<text class="q-val q-val--am" x="150" y="284">Requires revised terms.</text>
    ${label(40, 314, 'TRADE-OFF')}<text class="q-val" x="150" y="314">May extend completion.</text>
  </svg>`;
}


// --- narrow: the same three answers, composed to stand on a phone -------------------

const VBN = 'viewBox="0 0 360 470"';
const nlabel = (x: number, y: number, t: string, cls = 'q-txt q-txt--n', anchor = 'start'): string => label(x, y, t, cls, anchor);
const nnote = (x: number, y: number, t: string, lx?: number, ly?: number): string => {
  const w = t.length * 7.6 + 16;
  const leader = lx !== undefined && ly !== undefined ? `<path class="q-leader" d="M${x + w / 2} ${y + 10}L${lx} ${ly}"/>` : '';
  return `${leader}<g class="q-note q-note--n"><rect x="${x}" y="${y - 10}" width="${w}" height="20"/><text x="${x + 8}" y="${y + 5}">${t}</text></g>`;
};

function conditionsNarrow(): string {
  return `<svg ${VBN} class="q-svg q-svg--1 q-svg--n" role="img" aria-label="A supplier delay moves toward its limit; two obligations come to overlap; capacity is the first constraint to bind.">
    ${nlabel(16, 24, 'CONDITION · SUPPLIER DELAY')}
    <path class="q-track" d="M16 44H344"/><path class="q-tick" d="M16 38v12M344 38v12"/>
    <path class="q-limit" d="M262 32V56"/>${nlabel(268, 30, 'LIMIT', 'q-txt q-txt--n q-txt--am')}
    <g class="q1-marker" style="--dx:228px"><rect class="q-am" x="22" y="38" width="12" height="12" transform="rotate(45 28 44)"/></g>

    <rect class="q-pp" x="16" y="86" width="104" height="32"/>${nlabel(26, 107, 'SUPPLIER')}
    <path class="q-dep" d="M120 102H134V188H150"/>
    <g class="q1-late">${nnote(150, 84, 'dependency exposed', 160, 108)}</g>

    <rect class="q-pp" x="150" y="128" width="178" height="30"/>${nlabel(160, 148, 'OBLIGATION A')}
    <g class="q1-shift" style="--dx:96px"><rect class="q-pp q-pp--move" x="54" y="174" width="178" height="30"/>${nlabel(64, 194, 'OBLIGATION B')}</g>

    ${nlabel(16, 252, 'CAPACITY')}
    <path class="q-cap" d="M110 248H344"/>
    <rect class="q-load" x="150" y="272" width="178" height="40"/>
    <g class="q1-shift" style="--dx:96px"><rect class="q-load q-load--b" x="54" y="290" width="178" height="22"/></g>
    <g class="q1-late">
      <rect class="q-hatch" x="150" y="232" width="178" height="40"/>
      <rect class="q-am" x="150" y="232" width="178" height="16"/>
      ${nnote(120, 214, 'first constraint to bind', 200, 232)}
    </g>
    <path class="q-axis" d="M16 312H344"/>${nlabel(344, 334, 'TIME →', 'q-txt q-txt--n', 'end')}

    ${nlabel(16, 382, 'DELAY →')}
    ${nlabel(16, 408, 'OBLIGATIONS OVERLAP →')}
    ${nlabel(16, 434, 'CAPACITY FALLS SHORT', 'q-txt q-txt--n q-txt--am')}
  </svg>`;
}

function alternativesNarrow(): string {
  const block = (y: number, title: string, late: boolean, vals: [string, string, string]): string => `
    ${nlabel(16, y, title, late ? 'q-txt q-txt--n q-txt--am' : 'q-txt q-txt--n q-txt--ink')}
    <g transform="translate(0 ${y + 4})"${late ? ' class="q2-b"' : ''}>${arrangement(22, 0, late)}</g>
    ${['COST', 'TIMING', 'REQUIRES'].map((n, i) => `${nlabel(16, y + 104 + i * 26, n)}<text class="q-val q-val--n${late && i < 2 ? ' q-val--am' : ''}" x="116" y="${y + 104 + i * 26}">${vals[i]}</text>`).join('')}`;
  return `<svg ${VBN} class="q-svg q-svg--2 q-svg--n" role="img" aria-label="Two ways to make the same commitment: commit now, with cost up front and full capacity needed at the start; or commit later, with the cost shifted and the timing changed.">
    ${nlabel(16, 20, 'SAME DECISION · SAME CONSTRAINTS')}
    ${block(52, 'A · COMMIT NOW', false, ['Up front', 'As planned', 'Full capacity at once'])}
    <path class="q-rule" d="M16 252H344"/>
    ${block(282, 'B · COMMIT LATER', true, ['Shifts later', 'One quarter later', 'A later window'])}
    ${nnote(244, 272, 'timing changed')}
  </svg>`;
}

function arrangementChangeNarrow(): string {
  return `<svg ${VBN} class="q-svg q-svg--3 q-svg--n" role="img" aria-label="Original arrangement: one commitment made all at once. Proposed: commit in stages as capacity becomes available; requires revised terms and may extend completion.">
    ${nlabel(16, 22, 'ORIGINAL ARRANGEMENT', 'q-txt q-txt--n q-txt--ink')}
    <rect class="q-pp q-pp--dim" x="16" y="52" width="56" height="58"/>
    <path class="q-deck q-deck--dim" d="M72 64H220"/>
    <rect class="q-pp q-pp--dim" x="220" y="34" width="24" height="76"/><rect class="q-pp q-pp--dim" x="252" y="46" width="24" height="64"/><rect class="q-pp q-pp--dim" x="284" y="26" width="24" height="84"/>
    <path class="q-axis" d="M12 110H340"/>${nlabel(16, 132, 'All at once')}

    ${nlabel(16, 176, 'PROPOSED CHANGE', 'q-txt q-txt--n q-txt--am')}
    <rect class="q-pp" x="16" y="206" width="56" height="58"/><rect class="q-am" x="16" y="206" width="56" height="10"/>
    <path class="q-stage q3-s1" d="M72 250H200"/><path class="q-stage q3-s2" d="M72 234H252"/><path class="q-stage q3-s3" d="M72 218H304"/>
    <rect class="q-pp" x="200" y="226" width="24" height="38"/><rect class="q-pp" x="252" y="210" width="24" height="54"/><rect class="q-pp" x="304" y="194" width="24" height="70"/>
    <path class="q-axis" d="M12 264H340"/>
    ${nlabel(202, 286, 'T1', 'q-txt q-txt--n q-txt--am')}${nlabel(254, 286, 'T2', 'q-txt q-txt--n q-txt--am')}${nlabel(306, 286, 'T3', 'q-txt q-txt--n q-txt--am')}
    ${nnote(16, 300, 'new terms required', 110, 250)}

    <path class="q-rule" d="M16 334H344"/>
    ${nlabel(16, 360, 'PROPOSAL')}<text class="q-val q-val--n" x="16" y="380">Commit in stages as capacity arrives.</text>
    ${nlabel(16, 410, 'CONDITION')}<text class="q-val q-val--n q-val--am" x="116" y="410">Requires revised terms.</text>
    ${nlabel(16, 440, 'TRADE-OFF')}<text class="q-val q-val--n" x="116" y="440">May extend completion.</text>
  </svg>`;
}

function trust(): string {
  return `<svg viewBox="0 0 560 230" class="q-svg t-svg" aria-hidden="true">
    <path class="q-axis" d="M30 190H540"/>${label(540, 212, 'TIME →', 'q-txt', 'end')}
    <path class="q-limit" d="M200 30V190"/>${label(206, 40, 'DECISION', 'q-txt')}
    <path class="t-exp" d="M200 120C260 113 330 102 420 88"/>${label(426, 86, 'EXPECTED', 'q-txt q-txt--ink')}
    <path class="t-obs" d="M200 120C255 128 330 148 420 158"/>${label(426, 166, 'OBSERVED', 'q-txt q-txt--ink')}
    <path class="t-gap" d="M200 120C260 113 330 102 420 88V158C330 148 255 128 200 120Z"/>
    ${note(240, 152, 'difference', 300, 128)}
    <path class="t-rev" d="M200 120C260 124 330 134 420 144"/>${label(426, 128, 'REVISED, TESTED', 'q-txt q-txt--am')}
    <path class="q-tick" d="M30 120H200"/>${label(30, 110, 'RECORD', 'q-txt')}
  </svg>`;
}

export function initQuestions(root: ParentNode = document): void {
  // Each field is drawn twice: wide beside the questions, and standing for a phone.
  const make: Record<string, [() => string, () => string]> = {
    '1': [conditions, conditionsNarrow],
    '2': [alternatives, alternativesNarrow],
    '3': [arrangementChange, arrangementChangeNarrow],
  };
  for (const host of root.querySelectorAll<HTMLElement>('[data-field]')) {
    const pair = make[host.dataset['field'] ?? ''];
    if (pair) host.innerHTML = pair[0]() + pair[1]();
  }
  const t = root.querySelector<HTMLElement>('[data-trust]');
  if (t) t.innerHTML = trust();

  // Tabs on wide screens; on narrow ones every panel stands.
  const box = root.querySelector<HTMLElement>('[data-questions]');
  if (!box) return;
  const tabs = Array.from(box.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = Array.from(box.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
  const wide = window.matchMedia('(min-width: 900px)');
  let current = 0;
  const show = (i: number, focus = false): void => {
    current = i;
    tabs.forEach((tab, k) => {
      tab.setAttribute('aria-selected', String(k === i));
      tab.tabIndex = k === i ? 0 : -1;
    });
    panels.forEach((p, k) => {
      p.hidden = wide.matches && k !== i;
      // Restart the panel's motion when it is chosen.
      if (k !== i) return;
      for (const svg of p.querySelectorAll<SVGElement>('svg')) {
        svg.classList.remove('is-run');
        void svg.getBoundingClientRect();
        svg.classList.add('is-run');
      }
    });
    if (focus) tabs[i]?.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => show(i));
    tab.addEventListener('keydown', (e) => {
      const n = tabs.length;
      const go = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
      if (go < 0) return;
      e.preventDefault();
      show(go, true);
    });
  });
  box.classList.add('is-tabs');
  wide.addEventListener('change', () => show(current));
  show(0);

  // Figure 01: highlight one loop at a time.
  const f1 = root.querySelector<HTMLElement>('[data-f1]');
  f1?.querySelectorAll<HTMLButtonElement>('[data-loop]').forEach((b) =>
    b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      f1.querySelectorAll<HTMLButtonElement>('[data-loop]').forEach((o) => o.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', String(on));
      f1.dataset['loop'] = on ? (b.dataset['loop'] ?? '') : '';
    }),
  );
}
