# Implementation Plan: Alignment You Can Trust (Feedback Round 5)

**Branch**: `008-alignment-data` (both repositories) | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Status**: Draft — awaiting approval.

## Technical Decisions

| # | Decision | Why |
|---|---|---|
| R1 | `contributionsOf` and the day's objectives in `backend/src/modules/days/service.ts` drop the `status === "active"` filter (the period check stays in `contributes`). Web pickers keep filtering to active goals | FR-001, G1 |
| R2 | `cycleClosePreview`: a goal made by a rhythm (`rhythm_application.created_objective_id`) is not among the goals to carry; the close sets it done or not met like any goal it does not carry. `closeCycle` refuses a carry of such a goal | FR-002, G2 |
| R3 | `scripts/fix-data.ts` (`npm run fix-data -- <email> <rules.json> [--dry-run]`), one transaction rolled back on a dry run, like fix-chain: (a) rhythm duplicates — a week goal carried from a rhythm goal next to that rhythm's goal of the same week: its task links, child links, and measurements move to the rhythm's goal, the copy is soft-deleted; (b) title rules `{ prefix, activity }[]` give an activity to tasks with none (also to repeating items' templates); (c) `merge: { from, into }[]` moves tasks, templates, goal and template activity links, and repeating items from one activity to another and archives `from` | FR-003, G3 |
| R4 | `GET /v1/activities/suggest?title=` returns the activity most used by the workspace's past tasks whose title has the same prefix (text before ":" or the whole title, case-folded), or none. `EntrySheet` shows it under the activity field as a one-tap chip when the task has no activity | FR-004, G4 |
| R5 | Day close preview gains `withoutActivity` (done tasks with no activity); `CloseScreen` lists them with the existing `ActivityPicker`, saving through the entry update | FR-004, G4 |
| R6 | If G5 A: `dayScores` weighs useful minutes only — an entry's useful minutes are its useful segments, or its actual minutes when it has no segments and is useful; support entries leave both sides. Close snapshots already taken are left as they are | FR-005, G5 |
| R7 | `CloseScreen` "Why?" lines per status and time value; i18n en and pt-BR | FR-006, G7 |
| R8 | The private rules file lives next to the seed (`~/.config/life-manager/activity-rules.json`), never committed; tests use generic prefixes | FR-003 |

## Delivery

1. Backend: R1, R2, R6 with tests first; R3 with its own tests; R4, R5.
2. Web: client regen, suggestion chip, close list, texts, e2e.
3. Local e2e green, CI green, staging (web first, then backend).
4. The owner reviews the rules file I draft, reads the fix-data dry run, and
   runs it.
