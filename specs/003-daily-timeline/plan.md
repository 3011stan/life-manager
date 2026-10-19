# Implementation Plan: Daily Timeline, Activities, And Objectives

**Branch**: `003-daily-timeline` (both repositories) | **Date**: 2026-10-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-daily-timeline/spec.md`

**Status**: Phase 0 and Phase 1 complete; ADR 0008 accepted under the owner's
delegation (2026-10-18). Next: tasks.

## Summary

Build the daily product on the 002 foundation: a day timeline with entries,
segments, time blocks, unplanned logs, copy from another day, and capacity; a
user-owned catalog (pillar → area, tags, activities); objectives at seven
horizons with six target types, credit flowing up the parent chain; day, week,
month, and year closes with carries, check-in, and long-horizon checkpoints;
weekly templates; capture suggestions in Portuguese and English; a bilingual,
essentialist interface. The API owns every rule that produces a number
(scores, progress, gates); the web app owns interaction, capture parsing, and
language.

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js 24 LTS (both repositories)

**Primary Dependencies**: as 002, plus `fractional-indexing` (both repos) and
`@dnd-kit/core` + `@dnd-kit/sortable` (web).

**Storage**: Render Postgres (staging = beta); new workspace tables with forced
RLS; IndexedDB read-only offline copy as in 002.

**Testing**: Vitest unit tests for every domain rule (cycles, scores, progress,
carries, gates, capture parser) with hand-calculated tables; Testcontainers
integration tests per route; the route-registry cross-tenant test extended to
every new route; Playwright desktop and 390×844 for the daily-critical flows,
one flow in both locales.

**Target Platform**: unchanged (Render Free API, Vercel web, staging domains).

**Project Type**: web application in two repositories.

**Performance Goals**: SC-001 (add from activity < 10 s), SC-003 (other device
within 30 s via 15 s polling), day screen in one request.

**Constraints**: Render Free cold start (~50 s, accepted); field-level LWW;
read-only offline; no personal data in either repository.

**Scale/Scope**: one owner plus test accounts; about 15 entries per day.

## Constitution Check

*Gate before Phase 0 and again after Phase 1.* Constitution v2.0.0.

| Principle | Status | Evidence |
|---|---|---|
| I. Cycles Before Lists | Pass | Entries belong to day cycles; objectives to cycles of seven horizons; carries move work between cycles (FR-023, FR-038). |
| II. Human Authorship | Pass | Suggestions, templates, and carries need confirmation (FR-023, FR-041–FR-043); nothing is planned by the system. |
| III. Time Is The Primary Unit | Pass | Capacity before adding (FR-017); segments with useful/support time (FR-013); time blocks (FR-012). |
| IV. Mobile-First | Pass | FR-051, SC-009; touch reordering (R10); e2e at 390×844. |
| V. Scores As Feedback | Pass | Execution and alignment separate, capped, explainable on demand (FR-019–FR-021); "no planned work" instead of 0. |
| VI. Tenant Isolation | Pass | Every new table workspace-scoped with forced RLS and composite FKs; registry cross-tenant tests for every route (SC-007). |
| VII. Data Ownership | Pass with gap | Export formatVersion 2 (FR-049); deletion cascades (FR-050); archive instead of delete when in use (FR-029). Tested backups are still pending in 002; the owner accepted the risk for the beta. |
| VIII. Evidence | Pass | Domain tables tested before code; verification report at close. |
| Product Boundaries | Pass | Owner's personal seed outside the repositories (R11); only generic defaults in source. |

**Result**: no unjustified violations. The VII gap is listed in the
verification report until 002 T064/T065/T074 pass.

## Project Structure

### Documentation

```text
specs/003-daily-timeline/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/api.md, contracts/ui.md
└── tasks.md
docs/adr/0008-cycle-and-timeline-model.md
```

### Source Code

```text
life-manager-backend/
├── src/domain/            # pure rules: cycles, scores, progress, carries, gates
├── src/modules/
│   ├── catalog/           # pillars, areas, tags, activities, generic defaults
│   ├── days/              # day bundle, entries, copy, close
│   ├── objectives/        # cycles, objectives, measurements, cycle close
│   ├── templates/         # objective templates and proposals
│   └── export/            # formatVersion 2 sections
├── src/db/schema/         # one file per module
├── src/db/migrations/     # 0006 onward, RLS in the same migration
└── scripts/seed-workspace.ts

cloud-stanos/
├── src/app/(signed-in)/
│   ├── day/[date]/        # home screen (/ redirects to today)
│   ├── cycles/[horizon]/[start]/
│   ├── catalog/
│   └── settings/          # + language, long-horizon start year, templates
├── src/lib/i18n/          # pt-BR and en dictionaries
├── src/lib/capture/       # parser
├── src/lib/day/           # client totals, order keys
└── e2e/                   # day, bundle, close, objectives, catalog, capture, locale
```

**Structure Decision**: same two repositories and branch name. Staging keeps
deploying from `002-cloud-foundation`; each finished slice of
`003-daily-timeline` is merged into it after CI is green (owner decision,
2026-10-18).

## Delivery Slices

Each slice ends deployed to staging with its tests green.

1. **Catalog and day timeline** (US1, US2, US3): schema, catalog, day bundle,
   entries, segments, reorder, capacity, i18n scaffold, owner seed.
2. **Log and day close** (US4, US5): unplanned, scores, close, carries,
   check-in, Rule Zero, copy from another day.
3. **Objectives and cycle closes** (US6, US7): cycles, objectives, progress,
   measurements, templates, week/month/year close, checkpoints.
4. **Capture and finish** (US8): parser, export v2, Markdown locale,
   verification.

## Complexity Tracking

Not needed.
