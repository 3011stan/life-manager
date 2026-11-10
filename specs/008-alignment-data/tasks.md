# Tasks: Alignment You Can Trust (Feedback Round 5)

**Input**: [spec.md](spec.md), [plan.md](plan.md). Tests first (constitution VIII).

`backend/` = `~/Projects/life-manager-backend`, `web/` = `~/Projects/cloud-stanos`.

## Phase 1: Counting (US1, US4)

- [ ] T001 [US1] Integration tests then R1: a task keeps counting for its week's goal after the week closes (done, carried, dropped); pickers active only
- [ ] T002 [US4] Unit tests then R6 in `backend/src/domain/scores.ts` (if G5 A)

## Phase 2: Rhythms (US2)

- [ ] T003 [US2] Integration tests then R2: a rhythm's goal is not offered or accepted for carry; the next week has one goal per rhythm

## Phase 3: Data (US2, US3)

- [ ] T004 [US2, US3] Tests then R3 `backend/scripts/fix-data.ts` with `--dry-run`, idempotent: rhythm duplicates, title rules, activity merge
- [ ] T005 [US3] I draft the private rules file from the owner's task titles; the owner reviews it (never committed)

## Phase 4: Prevention (US3)

- [ ] T006 [US3] Integration tests then R4 suggestion endpoint; R5 close preview list
- [ ] T007 Regenerate the client
- [ ] T008 [US3] Suggestion chip in `EntrySheet`; close list of tasks with no activity
- [ ] T009 [US4] "Why?" texts (R7), en and pt-BR
- [ ] T010 e2e: suggestion accepted in one tap; close lists and fixes a task with no activity; a closed week keeps its days' alignment; texts; axe light and dark

## Phase 5: Release

- [ ] T011 Local e2e green, CI green, staging (web first, then backend)
- [ ] T012 The owner reads the fix-data dry run and runs it
- [ ] T013 Verification report
