# Implementation Plan: Alignment You Can Trust (Feedback Round 5)

**Branch**: `008-alignment-data` (both repositories) | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Status**: Approved 2026-11-12 (G5 A; G6 done by the owner in the interface).

## Technical Decisions

| # | Decision | Why |
|---|---|---|
| R1 | `contributionsOf` and the day's objectives in `backend/src/modules/days/service.ts` drop the `status === "active"` filter (the period check stays in `contributes`). Web pickers keep filtering to active goals | FR-001, G1 |
| R2 | `cycleClosePreview`: a goal made by a rhythm (`rhythm_application.created_objective_id`) is not among the goals to carry; the preview lists unmet ones in `rhythmNotMet`, and the close sets them dropped (met ones done). `closeCycle` refuses a carry of such a goal with its own message | FR-002, G2 |
| R3 | `scripts/fix-data.ts` (`npm run fix-data -- <email> <rules.json> [--dry-run]`), one transaction rolled back on a dry run, like fix-chain: (a) rhythm duplicates — a goal carried (through any number of carries) from a rhythm goal, next to that rhythm's goal of the same period: its task links, child links, measurements, agenda links, and chain bookkeeping move to the rhythm's goal, the copy is soft-deleted; (b) title rules `{ prefix, activity }[]` (`titleRules`, matched on the title's start, ignoring case; first match wins) give an activity to tasks and repeating items with none; (c) `merge: { from, into }[]` moves tasks, repeating items, goal and goal-template activity links, and chain bookkeeping from one activity to another and archives `from`. Merges run before title rules. An unknown activity name stops the run before anything is written | FR-003, G3 |
| R4 | `GET /v1/activities/suggest?title=` returns the activity most used by the workspace's past tasks whose title has the same prefix (text before ":" or the whole title, case-folded), or none. `EntrySheet` shows it under the activity field as a one-tap chip when the task has no activity | FR-004, G4 |
| R5 | Day close preview gains `withoutActivity` (done tasks with no activity); `CloseScreen` lists them with the existing `ActivityPicker`, saving through the entry update | FR-004, G4 |
| R6 | `dayScores` weighs useful minutes only — an entry with parts weighs its useful share of the actual minutes (actual × useful parts ÷ all parts); one without parts weighs its actual minutes when useful and nothing when support. Each alignment line says `support`. Close snapshots already taken are left as they are | FR-005, G5 |
| R7 | `CloseScreen` "Why?" lines per status and time value; i18n en and pt-BR | FR-006, G7 |
| R8 | The private rules file lives next to the seed (`~/.config/life-manager/activity-rules.json`), never committed; tests use generic prefixes | FR-003 |

## Delivery

1. Backend: R1, R2, R6 with tests first; R3 with its own tests; R4, R5.
2. Web: client regen, suggestion chip, close list, texts, e2e.
3. Local e2e green, CI green, staging (web first, then backend).
4. The owner reviews the rules file I draft, reads the fix-data dry run, and
   runs it.
