# Tasks: Goal Chain (Feedback Round 4)

**Input**: [spec.md](spec.md), [plan.md](plan.md). Tests first (constitution VIII).

`backend/` = `~/Projects/life-manager-backend`, `web/` = `~/Projects/cloud-stanos`.

## Phase 1: The rule (US2)

- [x] T001 [US2] Unit tests then `nextHorizon` and the one-level-up check (`backend/test/unit/cycles.test.ts`, `src/domain/cycles.ts`)
- [x] T002 [US2] Integration tests then `validateParents` and entry hand-link validation; old skipping links stay readable

## Phase 2: The chain (US1, US2)

- [x] T003 [US1] Unit tests then week-only direct credit in `backend/src/domain/progress.ts`
- [x] T004 [US1] Integration tests then `ensureChain` and `chain_link` (migration); completing a task builds the week and month goals; reuse; deleted not recreated
- [x] T005 [US2] Integration tests then rhythms, events, and repeating items through `ensureChain`; month targets from rhythms (E5)

## Phase 3: Web (US3)

- [x] T006 Regenerate the client (no change: 007 adds no API field)
- [x] T007 [US3] `GoalPicker` and its use in the entry, goal, and event sheets; i18n en and pt-BR
- [x] T007b [US1] Unit tests (a task counting for several goals whose paths join, as in finding 7) then the "Counts for" helper of R10; e2e: no goal appears twice in "Counts for"
- [x] T008 [US2] "Skips a level" mark in the goals tree
- [x] T009 e2e: a task of a tracked activity credits its year goal through new week and month goals; the entry picker shows only week goals; a week goal can count only for month goals; axe on the pickers, light and dark

## Phase 4: Existing data (US4)

- [x] T010 [US4] Tests then `backend/scripts/fix-chain.ts` with `--dry-run`, idempotent
- [x] T011 [US4] The owner names the missing long-horizon goals; update the private seed file (never committed) — done by the owner and the coordinator, 2026-10-28
- [ ] T012 [US4] The owner reads the dry run and runs the script on staging

## Phase 5: Release

- [x] T013 Local e2e green, backend CI green, staging (web first, then backend) — local e2e and CI green 2026-10-28; staging 2026-10-29 (web 2358d67, API e2b81be)
- [x] T014 Verification report ([verification.md](verification.md))

## 007b — follow-up (2026-11-02)

- [x] T015 [F1] Integration tests then fix-chain (b): drop ancestor hand links, "needs a choice" for links longer than a year
- [x] T016 [F2] Integration tests then `chainEntry` trackers limited to count and duration goals
- [x] T017 [F2] Integration tests then fix-chain (f): remove goals made toward value, level, and milestone goals; idempotent
- [x] T018 [F3] Report lines with the week's and month's start dates
- [x] T019 [F4] Activity field label and hints, en and pt-BR; e2e
- [x] T020 [F5] Unit tests then grouped matches and "+N more"; `GoalPicker`; e2e and axe light and dark
- [x] T021 Local e2e green, CI green on both branches; verification report
- [ ] T022 Staging (after the owner's go-ahead), then the owner's new dry run and run (T012)

## 007c — follow-up (2026-11-09)

- [x] T023 [F6] Integration tests then fix-chain (f): only links the app added are removed
- [x] T024 [F7] Integration tests then the chain reuses goals of closed periods
- [x] T025 Tests and CI green on both branches; verification report
- [ ] T026 Staging, then the owner's new dry run and run (T012)
