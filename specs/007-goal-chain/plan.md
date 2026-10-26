# Implementation Plan: Goal Chain (Feedback Round 4)

**Branch**: `007-goal-chain` (both repositories) | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Status**: Draft — awaiting approval.

## Summary

Make the chain the only path: links go one horizon up, tasks count directly
only for week goals, and one service builds the missing week and month goals
whenever a task, rhythm, event, or repeating item needs them. A one-off script
moves existing data onto the chain.

## Technical Decisions

| # | Decision | Why |
|---|---|---|
| R1 | `nextHorizon(h)` in `src/domain/cycles.ts` (week → month → year → y5 → y10 → y15; y20 stays above y15 for old goals). `validateParents` accepts only `nextHorizon(own)` whose period contains the goal; for a week, the month is `weekMonthStart` | FR-001 |
| R2 | Entry hand links (`entry_objective`) are validated to week goals of the entry's week | FR-002 |
| R3 | `directlyContributes` applies to week goals only; longer goals keep counting through descendants. A longer goal's `activityIds` now mean "the activities this goal tracks", used by R4 | FR-003 |
| R4 | `ensureChain(tx, week, targetGoal, activityId?)` in `src/modules/objectives/chain.ts`: returns the week goal under `targetGoal` for that week, creating the month goal (when the target is a year goal) and the week goal if missing, recorded in `chain_link` (target goal, period start, created goal, removed) so a deleted one is not recreated. Titles "<target> · <Mon>" and "<activity>"; targets from E5 | FR-004–FR-006 |
| R5 | Completing an entry (create or update to completed) calls `ensureChain` for each goal of the week's month and year whose activities include the entry's activity and that no week goal of the week already covers | FR-004 |
| R6 | Rhythm apply for a week under a year goal goes through `ensureChain` (month first); month rhythm targets come from the weekly rhythm × weeks whose `weekMonthStart` is that month. Event and repeating-item apply call `ensureChain` toward each of the event's goals | FR-005 |
| R7 | Web: a `GoalPicker` component (pattern of `ActivityPicker`): search, max 8 options, each with its path (`chainOf`), "+ New … goal". Used in `EntrySheet` (week goals), `ObjectiveSheet` (horizon above), `EventSheet` (month and year goals). The old checklist goes away | FR-007, E3 |
| R8 | Goals tree: a "skips a level" mark on goals whose links break R1 | FR-008 |
| R9 | `scripts/fix-chain.ts` with `--dry-run`, run like the seed: (a) week goals linked to a year goal are re-linked through `ensureChain`; (b) hand links from entries to longer goals move to the week goal from `ensureChain`; (c) long-horizon skips are re-linked to goals named in the private seed file (`goals[].parents` already follows the chain once the owner names the missing goals); (d) prints every change | FR-009, E4 |

## Delivery

1. Backend: R1–R6 with tests first, then R9 with its own tests.
2. Web: client regen, `GoalPicker`, sheets, tree mark, e2e.
3. Local e2e green, backend CI green, then staging (web first, then backend).
4. The owner names the missing long-horizon goals, I update the private seed
   file, the owner reads the dry run and runs the script.
