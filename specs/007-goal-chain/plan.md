# Implementation Plan: Goal Chain (Feedback Round 4)

**Branch**: `007-goal-chain` (both repositories) | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Status**: Approved (2026-10-28).

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
| R10 | "Counts for" in `EntrySheet`: start from the goals in `contributesTo` that have no descendant also in it (the direct ones), draw each path with `chainOf`, and skip a goal already drawn in an earlier path. A pure helper in `src/lib/day/groups.ts` with unit tests | FR-011, finding 7 |
| R9 | `scripts/fix-chain.ts` with `--dry-run`, run like the seed: (a) week goals linked to a year goal are re-linked through `ensureChain`; (b) hand links from entries to longer goals move to the week goal from `ensureChain`; (c) long-horizon skips are re-linked to goals named in the private seed file (`goals[].parents` already follows the chain once the owner names the missing goals); (d) prints every change | FR-009, E4 |

## Delivery

1. Backend: R1–R6 with tests first, then R9 with its own tests.
2. Web: client regen, `GoalPicker`, sheets, tree mark, e2e.
3. Local e2e green, backend CI green, then staging (web first, then backend).
4. The owner names the missing long-horizon goals, I update the private seed
   file, the owner reads the dry run and runs the script.

## Notes from implementation (2026-10-28)

- FR-008: only a link a goal or task does not have yet is checked against the
  rule; links it already has may be kept on save, so an old goal can still be
  renamed. Adding a new link that skips a level is refused.
- Goals the chain makes leave a closed week or month closed (it does not
  reopen the period), so filling in old weeks keeps their close.
- R4: a week goal of the task's activity that counts for nothing yet (from a
  template, say) is linked into the chain instead of a second one being made.
- R4: a goal with a rhythm of the period being made (a year goal with a month
  rhythm) gives its rhythm goal as the goal between, so no second month goal.
- R9 has two more parts: (c) with the private seed file, its missing goals are
  made through the seed's own path and existing goals take the parents it
  names; (e) completed tasks whose activity a longer goal tracks get their
  week goal, as a new task would, so year goals keep the credit R3 would
  otherwise drop. Links that skip only month or year are fixed by themselves;
  longer skips need the seed file and are otherwise reported.
- The API keeps accepting any goal above a week for an event; the event
  sheet's picker offers month and year goals (FR-007).
- Export format 6 adds `cycles[].chainLinks`.

## 007b — follow-up (2026-11-02)

| # | Decision | Why |
|---|---|---|
| R11 | fix-chain (b) works per task: a hand link to a goal that is an ancestor of another of the task's links (hand-linked week goals included) is dropped and reported; a remaining link to a month or year goal moves as before; one to a goal longer than a year stays and is reported `needs a choice` | FR-012, F1 |
| R12 | `chainEntry` takes as trackers only count and duration goals. Rhythms exist only on count and duration goals, so they need no change. Events and repeating items keep building a chain toward the goals chosen for them, whatever their type (an explicit choice), and so do hand links | FR-013, F2 |
| R13 | fix-chain (f): for each goal recorded in `chain_link` as made (not reused), follow the made goals up to the first goal the app did not make; when that goal is value, level, or milestone, and the made goal has no live goal below it and no task linked to it by hand, it is soft-deleted with its links and its `chain_link` row (so an explicit need later can make it again), without reopening its period; repeated until nothing changes, so a month goal goes once its week goals are gone | FR-014, F2 |
| R14 | The report's `label` adds the start date for week and month goals | FR-015, F3 |
| R15 | `ObjectiveSheet`: label "Counts these activities" (week) or "Tracks these activities" (longer) with a hint; the field also shows on a value, level, or milestone goal that already lists activities, with the reference hint | FR-016, F4 |
| R16 | `matchGoals` returns the goals shown, grouped by their nearest goal above, and how many more match; `GoalPicker` renders a small heading per group and "+N more — type to search" | FR-017, F5 |

Consequence of R12, noted for the owner: a task whose activity only a value,
level, or milestone goal lists counts for no goal (and not for alignment) until
a week goal for that activity exists (a count goal, a rhythm, a template, or a
hand link).

## 007c — follow-up (2026-11-09)

| # | Decision | Why |
|---|---|---|
| R17 | `removeMeasuredChains` skips a `chain_link` row with `reused` and no activity: those come from `bridge`, where the link already existed. Only a reused row with an activity (the loose week goal `weekGoal` linked) is unlinked | FR-018, F6 |
| R18 | `covered` in `chainEntry`, `below` in `bridge`, and `loose` in `weekGoal` no longer need an active goal; `below` and `loose` still prefer one. A closed goal passes credit up (`descendantsOf` has no status filter). `trackersIn` stays active-only | FR-019, F7 |

Other active-only checks on these paths, reviewed: `sharedGoal` in the events
service cannot duplicate, because `applyWeek` returns early for a closed week.
`applyRhythms` is idempotent through `rhythm_application`, so a closed rhythm
goal is not made again. fix-chain (a) stays active-only on purpose: a closed
week goal that skips the month keeps its old link, its credit still reaches the
year, and history is not rewritten.
