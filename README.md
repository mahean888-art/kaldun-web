# Kaldun — website

Machine foresight. The future, as an input.

A static, multi-page marketing site: five real HTML documents, a token-driven CSS
system, and TypeScript that only enhances. No framework, no runtime dependencies,
no third-party requests at page load.

## Run it

```bash
npm install
npm run dev             # vite dev server on 127.0.0.1:5173
npm run build           # typecheck + static build into dist/
npm run preview         # serve the built output on :4173
npm run build:artifact  # the self-contained single-file bundle
npm run build:all       # both targets
npm run typecheck       # tsc --noEmit
```

`dist/` is plain static output — every asset path is relative (`base: './'`), so it
deploys to any static host or subdirectory without configuration.

### Deploying

`.github/workflows/pages.yml` builds and publishes `dist/` to GitHub Pages on every
push to `main`. Enable it once under **Settings → Pages → Build and deployment →
Source: GitHub Actions**; after that it is automatic.

### The single-file bundle

`npm run build:artifact` produces `dist-artifact/kaldun.html`: the whole site —
all five routes, both stylesheets' worth of CSS, the JavaScript and all five
woff2 faces — inlined into one file that makes no external requests. It exists
for sharing a live, clickable build where there is no static host to point at.

It is packaging, not a second copy of the site. `scripts/build-artifact.mjs` lifts
each page's `<main>` verbatim out of the built `dist/` documents and reuses the
same mounts (`src/mounts.ts`), so the bundle cannot drift from the real pages.
Navigation becomes hash routing — `#/home`, `#/engine`, `#/domains`, `#/record`,
`#/project`, with an optional third segment for a domain (`#/domains/risk`) or an
element to scroll to (`#/record/calibration`).

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | The full argument: problem → category → thesis → connected world → Engine → record → deployment → moat → fellowship → mission |
| `engine.html` | The Engine in seven pinned steps, plus the Console on a live question |
| `domains.html` | Five decision domains, selectable, each with a specific decision |
| `record.html` | The forecast ledger, the forecast object, commitment and calibration |
| `project-10191.html` | The fellowship |

The logo and Home both return to the hero. The Console is a surface of the Engine,
not a separate product. Project 10191 is the only research-oriented section.

## Structure

```
index.html … project-10191.html   one document per route; all prose lives here
public/fonts/                     self-hosted woff2 (Geist, Geist Mono, Cinzel)
scripts/build-artifact.mjs        assembles the single-file bundle from dist/
src/styles/                       the design system, loaded via styles/index.css
  tokens.css                      colour, type scale, space, motion, depth
  fonts.css reset.css typography.css layout.css motion.css
  chrome.css components.css hero.css sections.css record.css pages.css
src/lib/                          primitives
  ticker.ts                       ONE rAF loop for the whole page
  scrollLink.ts                   writes --p (0..1) on [data-scroll]; CSS animates
  reveal.ts                       one IntersectionObserver; masked line reveals
  dom.ts math.ts prefers.ts
src/components/                   behaviour: header, carousel, tabs, stickySequence, counters
src/mounts.ts                     per-route composition, shared by both builds
src/visuals/                      generated graphics
  probabilityField.ts             the hero canvas: NOW, and futures opening from it
  glyphs.ts                       procedural line-art glyph set
  sparkline.ts                    update-history sparkline
src/sections/                     data → DOM for the repeated modules
src/data/                         all copy that repeats, plus every external source
src/pages/                        one entry per document
```

### Motion

Two mechanisms, deliberately:

1. **Enter reveals** — an `IntersectionObserver` adds `.is-in` once; CSS owns the
   transition.
2. **Scroll-linked** — `src/lib/ticker.ts` runs a single `requestAnimationFrame`
   loop that reads scroll once per frame; `scrollLink.ts` writes a `--p` custom
   property on tracked elements. Everything animated is transform or opacity, so
   scrolling never triggers layout.

Nothing captures the wheel and nothing hijacks scrolling. The pinned sequences use
`position: sticky` inside a tall band, so the page keeps scrolling normally and a
reader can always continue. Every effect has a `prefers-reduced-motion` resting
state, and the canvas pauses when off screen or when the tab is hidden.

### Typography

- **Geist** — structural sans
- **Geist Mono** — labels, data, ledgers, Engine output
- **Cinzel** — the inscriptional voice: wordmark, numerals, the mission slab

All three are self-hosted variable woff2 subsets under `public/fonts`, preloaded,
and licensed under the SIL Open Font License.

### The symbolic layer

Kaldun's visual register is the astronomer-scribe: the stepped ziggurat (the state
beneath a forecast), the ruled clay tablet (the Record), the eclipse cycle (learning
from resolution), the gnomon (time as supervision). Every glyph is generated
geometry in `src/visuals/glyphs.ts` — deterministic, seeded, hairline-thin, and
resolution-independent — not decorative artwork.

## Data provenance

This matters more here than on most sites, because the product is calibration.

- **External figures** are declared in `src/data/sources.ts` with publisher and URL,
  and every one is rendered with a link beside it. The Engine demonstration uses
  published figures from the IEA (`Energy and AI`) and Berkeley Lab (`Queued Up`),
  against a real public forecasting question.
- **Kaldun's own numbers** — the futures and odds in the Console, the propagation
  magnitudes, the ledger entries — are worked examples of output *form*, and every
  module that shows them is labelled `Illustrative` in the interface, with an
  explicit disclosure under the Console.

The two are never blended, and no customer, logo, or track record is implied.

## Checks

`npm run build` runs `tsc --noEmit` first, so a type error fails the build.

Beyond that, the site was verified in a real browser at 320, 390, 834, 1280 and
1440 px: no horizontal overflow on any page at any of those widths, no console or
page errors, and a 28-check interaction pass covering the carousel (buttons, drag,
touch, rail, end states), the propagation levers, the decision tabs (pointer and
keyboard), the domain selector and its deep links, the record filters, the pinned
Engine sequence, the mobile drawer, and scrolling to the end of every page.
