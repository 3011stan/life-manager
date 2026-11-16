# Tasks: One Goal per Thing, Periods Closed in Order (Feedback Round 6)

**Input**: [spec.md](spec.md), [plan.md](plan.md). Tests first (constitution VIII).

`backend/` = `~/Projects/life-manager-backend`, `web/` = `~/Projects/cloud-stanos`.

## Phase 0: Data check

- [x] T001 The owner ran the read-only duplicate listing; findings 3–5 confirmed (8 groups, all in November)

## Phase 1: Closing (US1, US3)

- [x] T002 [US1] Integration tests then R1, R2: rhythm, template, chain goals and copies carried from them are not offered or accepted for carry; unmet ones end not met
- [x] T003 [US1] Integration tests then R3: a carry copies nothing when the next period has the same goal (same activities; same title without amount or period label); no match makes a copy
- [x] T004 [US3] Unit tests (gates) then integration tests then R5: week, month, year, and long-horizon closes refused while a period inside needs closing; a week counts for the month of its fourth day

## Phase 2: One goal per thing (US2)

- [x] T005 [US2] Integration tests then R4: a rhythm wins over a template (and takes its activities); a template's goal made first becomes the rhythm's with the larger target; the chain reuses the week's and month's goal of the same thing

## Phase 3: Data (US5)

- [x] T006 [US5] Migration test then R9: the owner's duplicate shapes merge, look-alikes stay, a second run changes nothing, row-level security forced again

## Phase 4: Web (US1–US4, US6)

- [x] T007 Integration test then R7's `copySources`; regenerate the client
- [x] T008 [US1, US3] Cycle close: "Renews next period", the list of periods still open with links, close disabled
- [x] T009 [US2] Week proposals: "already in this week" for covered templates
- [x] T010 [US4, US6] R6 (tab memory); R7 copy dialog; R8 icon and manifest; R10 duplicate question (unit test of the rule)
- [x] T011 e2e: month close lists its open week; duplicate question; Year → Month keeps the month; copy dialog on an older day; icon and manifest served; axe light and dark

## Phase 5: Release

- [x] T012 Local e2e green, CI green, staging (web first, then backend; the migration runs with the deploy)
- [x] T013 The owner runs the read-only listing once more to confirm
- [x] T014 Verification report
