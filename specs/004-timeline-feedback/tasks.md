# Tasks: Timeline Feedback, Round 1

**Input**: [spec.md](spec.md), [plan.md](plan.md). Tests first; each defect
starts with a test that fails without the fix (constitution VIII).

`backend/` = `~/Projects/life-manager-backend`, `web/` = `~/Projects/cloud-stanos`.

## Phase 1: Defects (US1)

- [x] T001 [US1] Create the test template database with ICU `en-US` collation in `backend/test/helpers/global-setup.ts` and `backend/docker-compose.yml`; regression test "moving to the top survives a refetch" in `backend/test/integration/days.test.ts` (fails on the current schema)
- [x] T002 [US1] Migration: `order_key` columns `COLLATE "C"` in `backend/src/db/migrations/`; schema files updated
- [x] T003 [P] [US1] Regression e2e: drag to top, refresh, same order; check an entry while typing keeps focus and order, in `web/e2e/day.spec.ts`
- [x] T004 [US1] Optimistic updates without reorder and without disabling the add field in `web/src/app/(signed-in)/day/use-day.ts`, `AddEntry.tsx`, `Timeline.tsx` (memoized rows)
- [x] T005 [US1] Regression tests for copy after carry and copy twice in `backend/test/integration/days.test.ts`; `copied_from_entry_id` migration; copy skips present sources; copy dialog marks them in `web/src/app/(signed-in)/day/CopyDialog.tsx`
- [x] T006 [US1] Shared `Sheet` component closing on backdrop and Escape in `web/src/components/Sheet.tsx`; move entry, objective, activity, copy dialogs to it; e2e "click outside closes"

## Phase 2: Running-app tests (US2)

- [x] T007 [US2] Reusable e2e workflow (Postgres ICU, migrations, API, web build, Playwright desktop + mobile, allow-listed e2e accounts) in `web/.github/workflows/e2e.yml` and `backend/.github/workflows/e2e.yml`; staging deploy needs it
- [ ] T008 [US2] Owner: create a fine-grained read-only token for the backend repo and save it as `BACKEND_READ_TOKEN` in the web repo
- [x] T009 [US2] (smoke skips with a warning until the owner adds `VERCEL_AUTOMATION_BYPASS_SECRET` to the backend `staging` environment) `web/e2e/smoke.spec.ts` and a post-deploy job against staging using `VERCEL_AUTOMATION_BYPASS_SECRET` and `TEST_SIGN_IN_SECRET` (002 T061)
- [x] T010 [US2] Prove the gate: a throwaway branch with a broken day screen fails CI and does not deploy (002 T067); record in verification

## Phase 3: Readability (US3)

- [x] T011 [US3] Row shows the title; activity as muted label when different, in `web/src/app/(signed-in)/day/Timeline.tsx`; e2e with two "Study" entries
- [x] T012 [US3] Groups: tests then `kind`/`group_id` (schema, routes, scores exclude headings) in `backend/src/modules/days/`; heading rows, indentation, group total, drag moves the group, in the web timeline
- [x] T013 [US3] Objective mark on rows; entry sheet lists the objectives an entry counts for with their parent chain; manual link picker of active objectives
- [x] T014 [US3] Export formatVersion 3 (`kind`, `groupId`, `copiedFromEntryId`) and `docs/export-format.md`

## Phase 4: Input (US4)

- [x] T015 [P] [US4] `web/src/lib/day/duration.ts` with tests (both languages); used by every minutes field
- [x] T016 [US4] Swipe-left Delete with Undo; `POST /v1/entries/{id}/restore` with tests and isolation check

## Phase 5: Activities (US5)

- [x] T018 [US5] Flat searchable activities list with area label and segment count; "Organize" view for pillars and areas; e2e

## Phase 6: Verification

- [ ] T023 Verification report with every finding of the spec mapped to its test; owner run on phone and desktop
