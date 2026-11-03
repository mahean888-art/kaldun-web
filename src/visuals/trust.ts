/**
 * Fig 02 · Record and revision. A diagram of the method, not a result: the
 * expectation recorded before events (a band), what was observed (dots), one
 * miss ringed in orange, and beside it the revised band, tested on separate
 * cases.
 */

export function initTrust(root: ParentNode = document): void {
  const host = root.querySelector<HTMLElement>('[data-trust]');
  if (!host) return;
  const W = 520;
  const H = 300;
  const mid = 260;
  const band = (x0: number, x1: number, y: (x: number) => number, h: number): string => {
    const top: string[] = [];
    const bot: string[] = [];
    for (let x = x0; x <= x1; x += 10) {
      top.push(`${x} ${(y(x) - h).toFixed(1)}`);
      bot.unshift(`${x} ${(y(x) + h).toFixed(1)}`);
    }
    return `M${top.join(' L')} L${bot.join(' L')}Z`;
  };
  const centre = (x0: number, x1: number, y: (x: number) => number): string => {
    const pts: string[] = [];
    for (let x = x0; x <= x1; x += 10) pts.push(`${x} ${y(x).toFixed(1)}`);
    return pts.join(' L');
  };
  const e1 = (x: number): number => 170 - (x - 30) * 0.18;
  const e2 = (x: number): number => 176 - (x - mid - 20) * 0.26;
  const obs1: Array<[number, number, boolean]> = [[50, 168, false], [78, 158, false], [104, 166, false], [132, 150, false], [160, 154, false], [188, 112, true], [214, 140, false]];
  const obs2: Array<[number, number]> = [[300, 172], [328, 160], [356, 166], [384, 150], [412, 148], [440, 140], [468, 128], [490, 130]];
  const dot = (x: number, y: number): string => `<circle class="t-dot" cx="${x}" cy="${y}" r="3.6"/>`;
  host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <path class="t-axis" d="M30 250H${W - 30}"/>
    <path class="t-div" d="M${mid} 40V250"/>
    <path class="t-band" d="${band(30, mid - 20, e1, 18)}"/>
    <path class="t-line" d="M${centre(30, mid - 20, e1)}"/>
    <path class="t-band t-band--rev" d="${band(mid + 20, W - 30, e2, 22)}"/>
    <path class="t-line t-line--rev" d="M${centre(mid + 20, W - 30, e2)}"/>
    ${obs1.map(([x, y]) => dot(x, y)).join('')}
    ${obs2.map(([x, y]) => dot(x, y)).join('')}
    <circle class="t-miss" cx="188" cy="112" r="11"/>
    <text class="t-lab" x="30" y="275">RECORDED EXPECTATION</text>
    <text class="t-lab" x="${mid + 20}" y="275">REVISED · RETESTED</text>
    <text class="t-lab t-lab--am" x="204" y="96">MISS</text>
  </svg>`;
}
