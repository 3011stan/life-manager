# Implementation Plan: Plan and Polish (Feedback Round 2)

**Branch**: `005-plan-and-polish` (both repositories) | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

**Status**: Approved (2026-10-24).

## Summary

First lay the visual foundation of the chosen direction (C Ritmo with B's parts) (tokens, icons,
components), then rebuild the catalog on the 3 × 9 model and shorten the entry
sheet, then replace the single parent with many links and add Plan and
rhythms. Every slice ships to staging after its local e2e run passes and backend
CI is green.

## Technical Decisions

| # | Decision | Why |
|---|---|---|
| R1 | Design tokens as CSS custom properties in `src/app/tokens.css`: color (light and dark under `prefers-color-scheme`), type scale, spacing (4 px base), radii, and motion (150 ms, none under `prefers-reduced-motion`). Fonts come from `next/font` (self-hosted, no runtime request). Icons are a small local set of inline SVG components in `src/components/icons.tsx`, with no new dependency | D4, FR-014 |
| R2 | Shared components restyled in place: `Check`, `Row`, `PartsBar`, `Sheet`, `Field`, `Picker`, `Button`. Screens keep their structure, and only the markup and classes change | Limits the visual work to components |
| R3 | axe-core checks every screen through `@axe-core/playwright` in e2e, light and dark, desktop and mobile | FR-014, SC-004 |
| R4 | Catalog defaults: `src/modules/catalog/defaults.ts` holds 3 pillars × 9 areas in both languages, with a few generic activities per area. The seed's `--replace-generic` gains a name map from generic items to model areas. Used generic activities are re-parented, and unused ones are soft-deleted | D1, FR-002 |
| R5 | `activity.type` text, nullable, checked against the four values. API, export formatVersion 4, `docs/export-format.md` | D1b |
| R6 | Entry derivation: when an entry's activity changes, the server copies the activity's parts, routine (`is_time_block`), and deep work, and sets `time_value` to useful. A duration change on an entry with parts resizes the main part (the longest "counts" part; ties go to the first). The rule lives in `src/domain/parts.ts` with unit tests | D2, D3, FR-005, FR-006 |
| R7 | Entry sheet rebuilt with a searchable activity `Picker` that offers "Create “X”" with an area step. Status comes from the row check, with skip/cancel under "More". Move up and down are removed (dnd keyboard sensor stays) | D2 |
| R8 | `objective_link (workspace_id, child_id, parent_id)` with composite FKs, forced RLS, a unique pair, and a check `child_id <> parent_id`. The migration copies `parent_objective_id` and then drops it. The service rejects cycles (walk up from the parent), same or lower horizons, and parents whose period doesn't contain the child's | D5, FR-008, FR-009 |
| R9 | `src/domain/progress.ts`: `parentId` becomes `parentIds`, and descendants are collected as a set so a diamond is counted once | FR-008 |
| R10 | `GET /v1/goals/tree?date=` returns, for the periods containing `date` (long horizons, year, month, week), every goal with its progress and its links, in one call; the web builds the tree, shows a goal under each of its parents, and marks multi-parent goals with a link icon | D6, FR-010 |
| R11 | Rhythm fields on `objective` (`rhythm_period`, `rhythm_count`, `rhythm_minutes`, with checks) and `rhythm_application (workspace_id, objective_id, cycle_id, created_objective_id null, removed bool)`, unique `(objective_id, cycle_id)`. `POST /v1/cycles/{h}/{date}/apply-rhythms` is idempotent and is called by the web when it opens a week or month. Removing a generated goal marks the application removed. It reuses the template application pattern | D7, FR-012 |
| R12 | Horizon `y15`: a migration renames `y20` cycles with no objectives to `y15` with recomputed dates, and keeps `y20` cycles that have objectives (hidden in the tabs). Domain `LONG_YEARS` becomes `{ y5: 5, y10: 10, y15: 15 }`, and `y20` stays readable | D8 |
| R13 | Every new tenant route joins the route registry and its cross-tenant test | Constitution VI |
| R14 | E2e runs locally through `scripts/e2e-stack.sh` before every deploy, and the result is recorded in the verification report. Backend CI keeps gating the deploy | FR-015, owner 2026-10-24 |

## Constitution Check

| Principle | Status |
|---|---|
| I Essentialism | Fewer controls on the sheet, and one routine switch instead of two overlapping fields. |
| IV Mobile-first | Designed at 390 px first; 44 px targets. |
| VI Tenant isolation | `objective_link`, `rhythm_application`, the tree route, and apply-rhythms join the registry. |
| VII Data ownership | Export v4 carries links, rhythms, and activity type. No data is deleted by the taxonomy move. |
| VIII Evidence | Unit tests for parts and progress over a diamond; integration tests for links, rhythms, and the seed map; e2e for every story; axe. |

## Delivery Order

1. Visual foundation in the chosen direction (US5), on the existing screens.
2. Catalog model and seed rework (US1), then the short entry sheet (US2).
3. Many links and Plan (US3).
4. Rhythms (US4) and long horizons (D8).

Each step: tests first, local e2e green, backend CI green, then deploy to staging.

## Risks

- The beta date (2026-10-30) leaves about four working days. Slices 1–3 fit, and slice 4 may land after the beta.
- Re-parenting the owner's catalog touches real data. The seed runs only through `--dry-run` first, then for real, with an export taken before.
