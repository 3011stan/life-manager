# Implementation Plan: Daily Timeline Prototype

**Branch**: `001-daily-timeline-prototype` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-daily-timeline-prototype/spec.md`

## Summary

Build the first Cloud StanOS Life Manager surface: a mobile-first daily timeline
using real local dates, local browser persistence, editable timeline items, task
bundles, useful/non-useful time visualization, simple freeform structuring, and a
basic daily close with execution and alignment scores.

The implementation will use the existing single Next.js application with React and
TypeScript. Data remains local to the browser for this prototype. The feature will
be implemented as a focused client-side experience in the App Router.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2.4, Next.js 16.2.6

**Primary Dependencies**: Next.js, React, React DOM, ESLint with Next config

**Storage**: Browser `localStorage` through a small typed persistence adapter

**Testing**: `npm run lint`, `npm run build`, focused manual validation through the
feature quickstart; automated unit tests deferred until a test runner is added

**Target Platform**: Modern mobile and desktop browsers, with primary validation at
390px-wide mobile viewport

**Project Type**: Single web application

**Performance Goals**: Timeline edits, status changes, bundle expand/collapse, and
local persistence feedback should feel immediate for prototype-scale data; the
daily screen should remain responsive with at least 30 timeline items

**Constraints**: No backend, no authentication, no cloud sync, no external calendar,
no AI service dependency, no Markdown export, no autonomous finalization of plans or
close summaries

**Scale/Scope**: Single user, same-browser persistence, one primary screen plus
supporting daily close and freeform draft interactions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Cycles Before Lists**: PASS. The feature centers on a date-specific daily cycle
  and prepares carry-forward data for future cycles.
- **Human Authorship Before Automation**: PASS. Freeform parsing produces suggested
  items only after request and requires user confirmation.
- **Time Is The Primary Planning Unit**: PASS. Timeline items and bundle segments
  carry planned/actual duration and useful/non-useful classification.
- **Mobile-First Daily Operation**: PASS. Primary interactions are planned for a
  390px viewport before desktop refinement.
- **Scores As Feedback, Not Punishment**: PASS. Execution and alignment are separate,
  explainable, and derived from visible item data.
- **Product Boundaries**: PASS. The plan uses local browser persistence only and
  avoids backend, authentication, cloud sync, billing, and native app scope.

## Project Structure

### Documentation (this feature)

```text
specs/001-daily-timeline-prototype/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AddItemSheet.tsx
│   ├── DailyClosePanel.tsx
│   ├── DateNavigator.tsx
│   ├── FreeformCapture.tsx
│   ├── ScoreSummary.tsx
│   ├── Timeline.tsx
│   ├── TimelineItemCard.tsx
│   └── UsefulTimeBar.tsx
├── lib/
│   ├── dates.ts
│   ├── demo-data.ts
│   ├── freeform.ts
│   ├── scoring.ts
│   ├── storage.ts
│   └── timeline.ts
└── types/
    └── life-manager.ts
```

**Structure Decision**: Keep all prototype logic in the single Next.js app. Use
small typed modules under `src/lib` for domain rules and reusable components under
`src/components` for the daily Life Manager surface.

## Complexity Tracking

No constitution violations or justified complexity exceptions.

## Phase 0: Research

Completed in [research.md](./research.md).

## Phase 1: Design & Contracts

Completed artifacts:

- [data-model.md](./data-model.md)
- [contracts/ui-contract.md](./contracts/ui-contract.md)
- [quickstart.md](./quickstart.md)

## Post-Design Constitution Check

- **Cycles Before Lists**: PASS. `DailyCycle` is the aggregate root and every
  timeline item belongs to a date-specific cycle.
- **Human Authorship Before Automation**: PASS. Freeform suggestions remain pending
  until accepted; daily close requires confirmation.
- **Time Is The Primary Planning Unit**: PASS. Timeline items and bundle segments
  include planned/actual minutes and useful/non-useful rollups.
- **Mobile-First Daily Operation**: PASS. Quickstart includes mobile viewport
  validation for all primary operations.
- **Scores As Feedback, Not Punishment**: PASS. Scoring formulas are documented and
  cancelled items are excluded from denominators.
- **Product Boundaries**: PASS. The UI must clearly state that MVP data is local to
  this browser.
