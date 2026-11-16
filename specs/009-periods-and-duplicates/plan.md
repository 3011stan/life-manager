# Implementation Plan: One Goal per Thing, Periods Closed in Order (Feedback Round 6)

**Branch**: `009-periods-and-duplicates` (both repositories) | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Status**: Approved 2026-11-15.

## Technical Decisions

| # | Decision | Why |
|---|---|---|
| R1 | `goalOrigins` in `backend/src/modules/objectives/service.ts`: rhythm (`rhythm_application.created_objective_id`), template (`template_application.objective_id`), chain (`chain_link.objective_id`, not reused), agenda (`event_week.objective_id`, not reused), else hand; a carried goal follows `carried_from_objective_id` to the first goal with an origin | G1 |
| R2 | `cycleClosePreview` returns `renews` (active, below target, not by hand) in place of 008's `rhythmNotMet`; `closeCycle` sets them dropped and refuses a carry of one (422) | G1 |
| R3 | `backend/src/domain/goals.ts` `baseTitle`, `sameThing`; `sameGoalIn(all, cycleId, goal)`. `closeCycle` carry: a goal there → no copy, `carry_decision.created_objective_id` points to it | G2 |
| R4 | `applyRhythms` adopts a goal of the same thing not claimed by another rhythm (`adopt`: its activities, link above, the larger target); a new rhythm goal with no activity takes a matching active template's. `proposals` returns `covered` (template, goal) apart from `templates`; `applyTemplates` applies the week's rhythms first and refuses a covered one. The chain's `weekGoal` reuses any week goal of the activity (loose first); `bridge` reuses a goal of the period with the same base title | G3 |
| R5 | `backend/src/domain/gates.ts` `periodsInside`, `openInside` (pure, unit-tested); `cycleClosePreview` returns `openInside`; `closeCycle` answers 409 `open-inside` with the list | G4 |
| R6 | `CyclesScreen`: a module-level map of the last period per tab (kept while the app is open, gone on reload) | G5 |
| R7 | `GET /v1/days/:date` gains `copySources` (a recursive query over carry and copy sources); the copy endpoint skips them too. `CopyDialog` locks those and leaves same title and activity unselected | G6 |
| R8 | `web/src/app/icon.svg` (colors by `prefers-color-scheme`), `apple-icon.png`, `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `manifest.ts` | G7 |
| R9 | Migration `0017_one_goal_per_thing.sql` (PL/pgSQL, row-level security lifted and restored as in 0012 and 0014), tested on a database migrated up to 0016 with the owner's duplicate shapes (generic names) and run twice | G8 |
| R10 | `ObjectiveSheet`: before creating, the period's goals (from the goals tree) are checked with `web/src/lib/day/goals.ts` (same rule as the API); a match shows the question with Create / Cancel | G9 |

## Delivery

1. Backend: R1–R5, R7 with tests first; R9 with its migration test.
2. Web: client regen, close screens, proposals, tabs, copy dialog, icon,
   duplicate question, e2e.
3. Local e2e green, CI green, staging (web first, then backend); the migration
   runs with the backend deploy.
4. The owner runs the read-only duplicate listing to confirm.
