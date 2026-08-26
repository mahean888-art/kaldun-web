# Kaldun — website

Kaldun is machine foresight: a machine that maintains what is true now, runs
what could happen next, and learns from what actually does. Run the world
forward before you decide.

One page, one scroll, cool chart-paper and ink with a single signal blue.

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

## Page order

Hero → Manifesto → The Instrument → Decisions you can run → The Record →
Project 1654 → Close.

The hero and the manifesto share the living fan: it draws once, drifts on
seeded noise, and re-weights when evidence lands — it never loops. The
Instrument is the six-primitive loop — Signals, Live state, Drivers, Futures,
the Counterfactual entering from below, Resolution returning to State — and
the counterfactual arm is the page's one operable control.

## The single action

Every "Run a decision" opens the decision moment: what decision · when must it
be made · what would change your mind · contact. Sending composes a mail to
`hello@kaldun.ai`; a booking link is offered inside as a secondary path, never
on first click. Both constants live in `src/data/site.ts`.

## Motion law

Every animation represents a state change: the fan drifts because belief is
being re-estimated, a dashed line solidifies because reality resolved, the
version number ticks because the state updated. `prefers-reduced-motion`
renders final states.
