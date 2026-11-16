# Implementation Plan: One Goal per Thing, Periods Closed in Order (Feedback Round 6)

**Branch**: `009-periods-and-duplicates` (both repositories) | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Status**: Draft — awaiting approval.

## Technical Decisions

| # | Decision | Why |
|---|---|---|
| R1 | `goalOrigins(ids)` in `backend/src/modules/objectives/`: rhythm (`rhythm_application.created_objective_id`), template (`template_application.objective_id`), chain (`chain_link.objective_id`, not `reused`), else hand | G1, G8 |
| R2 | `cycleClosePreview` replaces `rhythmNotMet` with `renews` (rhythm, template, chain goals still active and below target); `closeCycle` sets them dropped and refuses a carry of one (422). Web cycle close shows "Renews next period" | FR-001 |
| R3 | `closeCycle` carry: `sameGoal(nextCycle, o)` — an active goal there with the same non-empty activity set, or, with no activities, the same title once a trailing " · <period>" is removed. Found: no new goal; parents the carry would add are added to it; `carry_decision.created_objective_id` points to it. Not found: today's copy | FR-002 |
| R4 | `applyRhythms`: before making a goal, reuse an active goal of the week (or month) with the rhythm's activities that no other rhythm claimed; record it in `rhythm_application`, add the link above if missing. Templates: `proposals` returns `covered` (templates whose activities already have a goal that week, with that goal's title) apart from `templates`; `applyTemplates` refuses a covered one. Rhythms apply before proposals are shown (already so on week open) | FR-003 |
| R5 | `backend/src/domain/gates.ts` `childrenToClose(horizon, start, state)` and a service query: week ← its days with entries not closed; month ← `weeksOfMonth` weeks with goals not closed or with such a day; year ← its months, same rule; y5/y10/y15 ← their years. `cycleClosePreview` returns `openInside: CycleRef[]`; `closeCycle` refuses with 409 while it is not empty. Web close screen lists them as links and disables the close | FR-004 |
| R6 | `CyclesScreen`: `sessionStorage` key per horizon with the last `startDate` viewed (try/catch, falls back to "current"); a tab goes to its remembered date, else "current" | FR-005 |
| R7 | `CopyDialog` takes the day's entries; "already on this day" = a direct carry/copy source (locked, as today), an entry whose copy chain reaches it (the API's day entries gain `copyRootId`: the first entry of its copy/carry chain), or same folded title and activity (unselected, can be selected) | FR-006 |
| R8 | `web/src/app/icon.svg` (mark in `--accent`, `prefers-color-scheme` inside the SVG), `apple-icon.png` 180 px, `manifest.ts` with 192/512 icons and theme colors; check the sign-in redirect and the service worker let them through | FR-007 |
| R9 | `fix-data` step (d) `mergeAlikeGoals`: per week and month, goals with the same non-empty activity set merge (kept: rhythm's, template's, then oldest); with no activity, a carried chain goal merges into the chain goal of the same parent. Reuses step (a)'s move of task links, child and parent links, measurements, agenda and chain bookkeeping; `rhythm_application` and `template_application` pointers move to the kept goal. Look-alikes by title only are listed as "look alike, not merged". Runs with the 008 rules file; no new rules needed | FR-008 |
| R10 | The read-only `backend/scripts/diagnose-duplicates.ts` (not committed) lists look-alike goals per week and month with their origin; the owner runs it once to confirm findings 3–5 before R9 | Findings 3–5 |

## Delivery

1. The owner runs the duplicate listing (R10); I adjust R9 to what it shows.
2. Backend: R1–R5 with tests first; R7's `copyRootId`; R9 with its tests.
3. Web: client regen, close screens, tabs, copy dialog, icon, e2e.
4. Local e2e green, CI green, staging (web first, then backend).
5. The owner reads the fix-data dry run and runs it.
