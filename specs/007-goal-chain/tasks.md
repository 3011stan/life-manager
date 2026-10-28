# Tasks: Goal Chain (Feedback Round 4)

**Input**: [spec.md](spec.md), [plan.md](plan.md). Tests first (constitution VIII).

`backend/` = `~/Projects/life-manager-backend`, `web/` = `~/Projects/cloud-stanos`.

## Phase 1: The rule (US2)

- [ ] T001 [US2] Unit tests then `nextHorizon` and the one-level-up check (`backend/test/unit/cycles.test.ts`, `src/domain/cycles.ts`)
- [ ] T002 [US2] Integration tests then `validateParents` and entry hand-link validation; old skipping links stay readable

## Phase 2: The chain (US1, US2)

- [ ] T003 [US1] Unit tests then week-only direct credit in `backend/src/domain/progress.ts`
- [ ] T004 [US1] Integration tests then `ensureChain` and `chain_link` (migration); completing a task builds the week and month goals; reuse; deleted not recreated
- [ ] T005 [US2] Integration tests then rhythms, events, and repeating items through `ensureChain`; month targets from rhythms (E5)

## Phase 3: Web (US3)

- [ ] T006 Regenerate the client
- [ ] T007 [US3] `GoalPicker` and its use in the entry, goal, and event sheets; i18n en and pt-BR
- [ ] T007b [US1] Unit tests (a task counting for several goals whose paths join, as in finding 7) then the "Counts for" helper of R10; e2e: no goal appears twice in "Counts for"
- [ ] T008 [US2] "Skips a level" mark in the goals tree
- [ ] T009 e2e: a task of a tracked activity credits its year goal through new week and month goals; the entry picker shows only week goals; a week goal can count only for month goals; axe on the pickers, light and dark

## Phase 4: Existing data (US4)

- [ ] T010 [US4] Tests then `backend/scripts/fix-chain.ts` with `--dry-run`, idempotent
- [ ] T011 [US4] The owner names the missing long-horizon goals; update the private seed file (never committed)
- [ ] T012 [US4] The owner reads the dry run and runs the script on staging

## Phase 5: Release

- [ ] T013 Local e2e green, backend CI green, staging (web first, then backend)
- [ ] T014 Verification report
