# Cloud StanOS

Local prototype for the Cloud StanOS Life Manager MVP.

## Current Goal

Build a mobile-first Daily Timeline Prototype backed by `localStorage`.

## Planned Stack

- Next.js
- React
- TypeScript
- Local persistence through `localStorage`
- No backend in the first prototype

## Setup

```bash
cd /Users/stan/Projects/cloud-stanos
npm install
```

## Run

```bash
npm run dev
```

Open the local URL printed by Next.js.

## MVP Focus

- Daily timeline with real local dates
- Drag and drop ordering
- Task bundles with expand/collapse
- Useful vs non-useful time visualization
- Basic daily close
- Simple freeform capture
- `localStorage` persistence

## Current Prototype Behavior

- The app opens today's local date by default.
- Each date has a separate daily cycle.
- Data is stored only in the current browser.
- The seeded day includes prayer, reading, deep work, standup, a gym bundle, and daily close.
- Timeline items can be added, edited, reordered, and marked as planned, completed, partial, skipped, or cancelled.
- Bundles show total time plus useful/support split and can be expanded.
- Freeform capture creates suggestions that must be accepted before entering the timeline.
- Daily close generates execution score, alignment score, useful/support totals, deep work minutes, and carry candidates.

## Validation

```bash
npm run lint
npm run build
```

Manual validation scenarios live in:

```text
specs/001-daily-timeline-prototype/quickstart.md
```
