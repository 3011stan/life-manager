# Tasks: One Goal per Thing, Periods Closed in Order (Feedback Round 6)

**Input**: [spec.md](spec.md), [plan.md](plan.md). Tests first (constitution VIII).

`backend/` = `~/Projects/life-manager-backend`, `web/` = `~/Projects/cloud-stanos`.

## Phase 0: Data check

- [ ] T001 The owner runs the read-only duplicate listing (R10); findings 3–5 confirmed or corrected in spec.md

## Phase 1: Closing (US1, US3)

- [ ] T002 [US1] Integration tests then R1, R2: rhythm, template, and chain goals are not offered or accepted for carry; unmet ones end not met
- [ ] T003 [US1] Integration tests then R3: a carry joins a matching goal of the next period (same activities; same title without the period label); no match makes a copy
- [ ] T004 [US3] Unit tests (gates) then integration tests then R5: week, month, year, and long-horizon closes refused while a period inside needs closing; a week counts for the month of its fourth day

## Phase 2: One goal per activity (US2)

- [ ] T005 [US2] Integration tests then R4: a rhythm reuses its activity's goal in the week; a covered template is not proposed and is refused

## Phase 3: Data (US5)

- [ ] T006 [US5] Tests then R9 in `backend/src/modules/objectives/fix-data.ts`: merges, kept goal order, look-alikes listed, idempotent

## Phase 4: Web (US1–US4)

- [ ] T007 Integration test then R7's `copyRootId`; regenerate the client
- [ ] T008 [US1, US3] Cycle close: "Renews next period", the list of periods still open with links, close disabled
- [ ] T009 [US2] Templates screen: "already in this week" for covered templates
- [ ] T010 [US4] Unit test then R6 (tab memory); R7 copy dialog; R8 icon and manifest
- [ ] T011 e2e: carry joins the goal there; month close blocked by an open week; Year → Month keeps the month; copy dialog on an older day; icon served; axe light and dark

## Phase 5: Release

- [ ] T012 Local e2e green, CI green, staging (web first, then backend)
- [ ] T013 The owner reads the fix-data dry run and runs it
- [ ] T014 Verification report
