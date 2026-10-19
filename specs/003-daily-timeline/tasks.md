---

description: "Task list for 003 Daily Timeline, Activities, And Objectives"
---

# Tasks: Daily Timeline, Activities, And Objectives

**Input**: Design documents from `specs/003-daily-timeline/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md),
ADR 0008

**Tests**: Required (constitution VIII). Domain rules get hand-calculated
tables before code; every new route joins the cross-tenant registry.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: User story from spec.md (US1–US8)

## Path Conventions

- `backend/` = `~/Projects/life-manager-backend`
- `web/` = `~/Projects/cloud-stanos`

## Notes from implementation

- Screens use static routes with query parameters (`/day?date=`, later `/cycles?h=&start=`) instead of dynamic segments, so one cached shell serves every date offline.
- Tags exist in the API (FR-026) but have no screen yet; adding them to the activity sheet is pending.
- Manual entry → objective links (FR-034) exist in the API; the entry sheet does not offer them yet. Contributions come from the objective's activities.
- FR-035's second rule (a direct link to a higher horizon only when no lower objective has that parent) is not enforced yet.
- Template proposals and application use `/v1/weeks/{date}/…` instead of `/v1/cycles/week/{date}/…` (contracts/api.md).

## Phase 1: Setup

- [x] T001 Create branch `003-daily-timeline` in `backend/`; add `fractional-indexing` to `backend/package.json` and `web/package.json`, `@dnd-kit/core` and `@dnd-kit/sortable` to `web/package.json`
- [x] T002 [P] Add `locale` and `longHorizonStartYear` to settings in `backend/src/db/schema/settings.ts`, a migration, `backend/src/modules/settings/` and its tests
- [x] T003 [P] i18n scaffold in `web/src/lib/i18n/` (typed `pt-BR` and `en` dictionaries, provider, `useT`); translate the existing 002 screens; language control in `web/src/app/(signed-in)/settings/SettingsForm.tsx`

## Phase 2: Foundational (domain rules, schema)

- [x] T004 [P] Cycle boundary tests then `backend/src/domain/cycles.ts` (week start, week→month by majority, long horizons, today in a time zone, containment) in `backend/test/unit/cycles.test.ts`
- [x] T005 [P] Score tests then `backend/src/domain/scores.ts` (execution, alignment, totals, null cases, cancelled, time blocks, unplanned, segments) in `backend/test/unit/scores.test.ts`
- [x] T006 [P] Progress tests then `backend/src/domain/progress.ts` (six target types, descendants, capped composite, pace) in `backend/test/unit/progress.test.ts`
- [x] T007 [P] Gate and carry-candidate tests then `backend/src/domain/gates.ts` and `backend/src/domain/carries.ts` in `backend/test/unit/gates.test.ts`
- [x] T008 Schema and migrations for catalog, cycle, entry, entry_objective, objective, objective_activity, measurement, objective_template(+activity), carry_decision with forced RLS, composite FKs, and touch triggers in `backend/src/db/schema/` and `backend/src/db/migrations/0007_*.sql`; extend `backend/test/isolation/catalog.test.ts` expectations

## Phase 3: US3 Catalog (P1)

- [x] T009 [US3] Integration tests for catalog routes (seed on first read, rename, archive, in-use delete 409, unused delete) in `backend/test/integration/catalog.test.ts`; register the routes in `backend/test/isolation/registry.ts`
- [x] T010 [US3] Generic defaults (no personal data) in `backend/src/modules/catalog/defaults.ts`; catalog routes and service in `backend/src/modules/catalog/`; regenerate `backend/openapi.json`
- [x] T011 [US3] `backend/scripts/seed-workspace.ts`: load a JSON file from outside the repo into one workspace by email (catalog, templates, year objectives), idempotent by name; test with a fixture under `backend/test/fixtures/` that holds only fake data
- [x] T012 [US3] Web catalog screen `web/src/app/(signed-in)/catalog/` (tree, inline rename, archive/restore, activity sheet, in-use → archive offer); regenerate `web/src/lib/api/generated`

## Phase 4: US1 + US2 Day timeline (P1)

- [x] T013 [US1] Integration tests for day bundle and entries (virtual day, create with activity defaults, PATCH fields, status rules, reorder key, delete, segments sum, time block, move day, foreign 404) in `backend/test/integration/days.test.ts`; registry entries
- [x] T014 [US1] Day and entry routes and service in `backend/src/modules/days/`
- [x] T015 [US1] Web navigation shell (bottom bar / rail) and `/` → `/day/<today>` in `web/src/app/(signed-in)/layout.tsx` and `web/src/app/page.tsx`
- [x] T016 [US1] Day screen `web/src/app/(signed-in)/day/[date]/` (header, capacity line, timeline rows, add field with activity suggestions, status control, no-activity mark, 15 s refetch, optimistic updates)
- [x] T017 [US2] Entry sheet with segments editor, time block, time value, deep work, notes in `web/src/app/(signed-in)/day/EntrySheet.tsx` (totals come from the API; the sheet sums segments locally)
- [x] T018 [US1] Touch and mouse reordering with dnd-kit and 44 px handles in `web/src/app/(signed-in)/day/[date]/Timeline.tsx`
- [x] T019 [US1] E2E `web/e2e/day.spec.ts` (US1 and US2 independent tests, desktop and 390×844, second context as second device)
- [ ] T020 Slice 1 release (released 2026-10-19; owner seed pending the owner's run): merge `003-daily-timeline` into `002-cloud-foundation` in both repos after green CI; owner seed loaded into the owner's workspace on staging

## Phase 5: US4 + US5 Log and day close (P2)

- [x] T021 [US5] Integration tests for close preview, close, carries (entry created next day, reopen), check-in, reopen on change, Rule Zero 409, copy from day in `backend/test/integration/day-close.test.ts`; registry entries
- [x] T022 [US4] Unplanned log rules in `backend/src/modules/days/` (status completed, planned 0, excluded from execution)
- [x] T023 [US5] Close, carry, gate, and copy routes in `backend/src/modules/days/close.ts`
- [x] T024 [US5] Web close page `web/src/app/(signed-in)/day/[date]/close/` (unresolved, scores with why, carries edit/confirm/dismiss, check-in, notes); gate message on the add field; "Log done" toggle; copy-from-day dialog
- [x] T025 [US5] E2E `web/e2e/day-close.spec.ts` (US4 and US5 independent tests)
- [x] T026 Slice 2 release (as T020)

## Phase 6: US6 + US7 Objectives and cycle closes (P2)

- [x] T027 [US6] Integration tests for cycles and objectives (create per type, parent validation, progress through the chain, measurements, foreign 404) in `backend/test/integration/objectives.test.ts`; registry entries
- [x] T028 [US6] Cycle, objective, and measurement routes in `backend/src/modules/objectives/`; `contributesTo` and `weekEssentials` in the day bundle
- [x] T029 [US7] Integration tests and routes for cycle close (carry/drop, notes, year checkpoints, close-before-plan 409) and templates (CRUD, proposals, apply) in `backend/test/integration/cycle-close.test.ts`, `backend/src/modules/templates/`
- [x] T030 [US6] Web cycles screen `web/src/app/(signed-in)/cycles/[horizon]/[start]/` (tabs, tiers, progress and pace, objective sheet with "more types", measurement quick input also from the day view)
- [x] T031 [US7] Web cycle close and template proposals; templates editor in settings
- [x] T032 [US7] E2E `web/e2e/objectives.spec.ts` (US6 and US7 independent tests)
- [x] T033 Slice 3 release (as T020)

## Phase 7: US8 Capture and finish (P3)

- [x] T034 [P] [US8] Parser tests then `web/src/lib/capture/parse.ts` (pt and en; start vs duration; activity linking; 001 F1 lines)
- [x] T035 [US8] Capture panel on the day screen (text saved on the day, suggestions edit/accept/dismiss)
- [x] T036 [P] Export formatVersion 2 and Markdown in the chosen locale in `backend/src/modules/export/`, `backend/docs/export-format.md`, and `backend/test/integration/export*.test.ts`; account deletion test covers new tables
- [x] T037 [US8] E2E `web/e2e/capture.spec.ts` and a locale e2e (`web/e2e/locale.spec.ts`)
- [x] T038 Slice 4 release (as T020)

## Phase 8: Verification

- [ ] T039 Run [quickstart.md](quickstart.md) on staging (phone and desktop); write `specs/003-daily-timeline/verification.md` with checks, results, gaps (backups pending), and verdict for the owner
- [ ] T040 Record in ai-memory: 003 scope decisions of 2026-10-18, ADR 0008, slice results
