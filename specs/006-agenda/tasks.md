# Tasks: Agenda (Feedback Round 3)

**Input**: [spec.md](spec.md), [plan.md](plan.md). Tests first (constitution VIII).

`backend/` = `~/Projects/life-manager-backend`, `web/` = `~/Projects/cloud-stanos`.

## Phase 1: Events and occurrences (US1, US3)

- [x] T001 [US1] Integration tests: create, edit, and delete an event and its task; a completed task is never moved or deleted; workspace isolation (`backend/test/integration/events.test.ts`)
- [x] T002 [US3] Unit tests for yearly occurrences in a range, including 29 Feb (`backend/test/unit/events.test.ts`)
- [x] T003 [US1] Migration and schema `event`, `event_objective`, `event_occurrence`, `entry.event_id`, with RLS (`backend/src/db/schema/events.ts`)
- [x] T004 [US1] `backend/src/modules/events/service.ts` and routes: CRUD, `GET /v1/agenda`, `ensureOccurrences`; `eventId` in the day DTO

## Phase 2: The week's goal (US2)

- [x] T005 [US2] Integration tests: apply creates one goal per occurrence, linked to its task and to the goals above that contain the week; idempotent; a removed goal stays removed; "week goal" off makes none
- [x] T006 [US2] `POST /v1/cycles/week/{date}/apply-events`; deleting an occurrence's goal marks it removed
- [x] T006b [US4] Integration tests then weekly items: tasks placed on the chosen days at apply, one count goal per week with the tasks linked, deleted task or goal not recreated, rule edits change only weeks not started and planned tasks from today, end date respected
- [x] T006c [US4] Integration tests then D7: saving a weekly item archives templates of its activity (and Undo restores); a rhythm goal of the activity is reused; then D8 `fromEntryId`
- [x] T007 Export v5 and `backend/docs/export-format.md`; OpenAPI regenerated

## Phase 3: Web (US1–US3)

- [x] T008 Regenerate the client from `openapi/openapi.json`
- [x] T009 [US1] `AgendaSection` and `EventSheet` on the Goals screen; Calendar icon; i18n en and pt-BR
- [x] T010 [US2] Call apply-events next to apply-rhythms in `GoalsTree` and `CyclesScreen`, and after saving an event in the current week
- [x] T011 [US1] Event mark on the timeline row (icon and accessible label)
- [x] T011b [US4] Repeat control in `EventSheet` (never, every year, every week with day chips, end date); "Every Sun–Fri" in the agenda; template overlap warning
- [x] T011c [US4] Day screen applies its week (D8); "Repeat…" under "More" in the entry sheet
- [x] T012 e2e: checking the sixth task of a Sun–Fri item marks its "6×" week goal done; a daily item with a time shows on the day at that time without any action; "Repeat…" from a task; a weekly Sun–Fri item puts 6 tasks in its week and one "6×" goal that counts them; an event two months ahead shows in the agenda and on its day; an event this week becomes a week goal, done when its task is done; a yearly event shows next year's occurrence; axe on the agenda and the event sheet, light and dark

## Phase 4: Release

- [x] T013 Local e2e green, backend CI green, staging (web first, then backend)
- [x] T014 Verification report mapping each story and requirement to its tests
