# Kaldun — website

Kaldun is a machine foresight system for institutions making consequential
decisions. It turns the present into calibrated possible futures, so teams can
test a move before reality does.

One page, one scroll, dark throughout.

## Run it

```bash
npm install
npm run dev             # vite dev server on 127.0.0.1:5173
npm run build           # typecheck + static build into dist/
npm run preview         # serve the built output on :4173
npm run build:artifact  # the self-contained single-file bundle
npm run build:all       # both targets
```

`dist/` is a single static document with relative asset paths, so it deploys to
any host or subdirectory without configuration. The GitHub Pages workflow in
`.github/workflows/pages.yml` builds and publishes it on every push to `main`
once Pages is switched to "GitHub Actions" in repository settings.

## The page, in order

| # | Section | Job |
| --- | --- | --- |
| — | Hero | The category, the one-sentence definition, and the two actions |
| 01 | Problem | Models learned to answer before they learned to anticipate |
| 02 | Thesis | The calibrated future is the output |
| 03 | Engine | Know the state · Run it forward · Make futures explicit · Learn from reality |
| 04 | Domains | Five decision classes, each naming the institutions that own it |
| 05 | Record | Why a self-authored foresight report cannot be audited, and what a committed forecast carries instead |
| 06 | Project 1377 | The fellowship |
| — | Closing | Bring us a decision |

Every "run a decision" and every fellowship action opens the same scheduling
link; everything else goes to `hello@kaldun.ai`. Both live in `src/data/site.ts`
as single constants.

## Structure

```
index.html                  the whole page; all copy lives here
public/fonts/               self-hosted woff2 (Geist, Geist Mono)
public/favicon.svg          the mark
scripts/build-artifact.mjs  assembles the single-file bundle from dist/
src/styles/                 the design system, loaded via styles/index.css
  tokens.css                colour, type scale, space, motion
  fonts.css reset.css typography.css layout.css motion.css
  chrome.css components.css hero.css sections.css
src/lib/
  ticker.ts                 ONE rAF loop for the whole page
  scrollLink.ts             writes --p (0..1) on [data-scroll]; CSS animates
  reveal.ts                 one IntersectionObserver; masked line reveals
  dom.ts math.ts prefers.ts
src/components/             header, clock, fitText
src/visuals/
  ringField.ts              the hero dial
  mark.ts                   the mark, drawn from coordinates
  forms.ts                  the nine living panel forms
src/sections/stack.ts       the rail-and-panel section, used by Engine and Domains
src/data/                   domains, engine, fellowship, site constants
src/mounts.ts               page composition
src/pages/home.ts           entry
```

## Design

**Palette** is the mark's own three colours and nothing else: deep red
`#b91f2e`, saturated yellow `#d9a626`, near-black `#0a0a0a`, with a warm cream
`#ede8de` for type. Red points; yellow rules, graduates and measures.

**The mark** is a red vessel with three risers standing out of it inside a dark
disc, built from coordinates in `src/visuals/mark.ts` and reused for the favicon.

**Forms** — `src/visuals/forms.ts`. One mechanic, nine bodies. Every panel runs
the same law: a present sweeps through the form left to right. Ahead of it the
marks drift and spread, further out the wider they wander. Behind it they are
fixed and quiet — resolved, no longer free to move. Then the sweep loops and the
future reopens. It is the site's argument rendered as motion rather than
decoration hung beside the copy.

Each body is declared as a density field — `field(x, y)` returns 0..1 — so a form
says what it *is* and the renderer decides where marks belong. The nine: a mass
with a stem, a light cone, a distribution of lobes, a returning torus, layered
strata, a wavefront, an aperture with a gap, a dissolving mass, a descent through
orders. Seeded, so the marks are identical on every load; only the visible
panel's canvas animates, and reduced-motion renders the settled state.

**Type** is Geist for display and structure, Geist Mono for labels, data and the
wordmark — both self-hosted variable subsets, preloaded, OFL.

**The hero** is a measuring dial: concentric rings ruled with graduated ticks,
hatched bands and radial sightlines, with the present marked at the centre. It is
positioned and masked so that no line ever crosses the display type — there is a
test for this. A live New York clock sits above the headline, because the whole
claim is that time is the input.

**Motion** is two mechanisms. An IntersectionObserver adds `.is-in` once and CSS
owns the transition; and a single `requestAnimationFrame` loop reads scroll once
per frame and writes a `--p` custom property. Everything animated is transform or
opacity, nothing captures the wheel, and every effect has a
`prefers-reduced-motion` resting state.

## What is not on this page

No console mock-up, no invented forecast ledger, no numbers presented as a track
record. The Record section describes the fields a committed forecast carries and
why the commitment exists — the structure is the claim. A track record is earned
by resolution, so it will appear when there is one to show.

## Checks

`npm run build` typechecks before it builds. Beyond that the page is verified in
a real browser: the page cannot be scrolled sideways at 320, 390, 834, 1280 or
1920px, and nothing but the hero's deliberate bleed crosses the viewport; no
console or page errors; the hero's actions visible at scroll zero; the dial
provably clear of the headline; both rail-and-panel sections switching by pointer
and by keyboard; every action pointing at the scheduler or the single address;
the drawer opening, navigating and closing; and the page scrolling to its last
pixel.
