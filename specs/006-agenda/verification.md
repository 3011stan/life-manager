# Verification: Agenda (Feedback Round 3)

**Spec**: [spec.md](spec.md) · **Tasks**: [tasks.md](tasks.md)

Backend tests are in `life-manager-backend` (`test/unit/events.test.ts`,
`test/integration/events.test.ts`, `test/isolation/cross-tenant.test.ts`,
`test/integration/export*.test.ts`); web tests are in this repository
(`src/lib/day/agenda.test.ts`, `e2e/agenda.spec.ts`, `e2e/a11y.spec.ts`).
Every e2e test runs on desktop and mobile.

## Stories

| Scenario | Tests |
|---|---|
| US1.1 An event two months ahead shows in the agenda and on its day | integration "writes a future event into the agenda and onto its day, marked as an event"; e2e "an event two months ahead shows in the agenda and on its day, marked as an event (US1)" |
| US1.2 Timed event at its time, untimed first | integration "places a timed event at its time in the day, and an untimed one first" |
| US1.3 Edits change the planned task, never a completed one | integration "changes a planned task when the event changes, and never a completed one" |
| US1.4 Delete takes the planned task, keeps a completed one | integration "deletes the planned task with the event and keeps a completed one" |
| US2.1, US2.2 One week goal, done with its task, under the goals that contain the week | integration "makes one goal for the event, done with its task, under the goals that contain the week"; e2e "an event this week becomes a week goal, done when its task is done (US2)" |
| US2.3 Idempotent; a removed goal stays removed | integration "makes one goal…" (second apply) and "does not bring back a goal the person removed, and makes none with week goal off" |
| US2.4 An event saved in its own week gets its goal at once | integration "gives an event saved in its own week its goal at once"; e2e (US2) |
| US2.5 Week goal off makes none | integration "does not bring back a goal…" |
| US3.1, US3.2 Each year's occurrence with its own task and goal | integration "shows each year's occurrence with its own task and goal"; e2e "a yearly event shows its next occurrence in the agenda (US3)" |
| US3.3 Repeat off keeps the next occurrence | integration "keeps the next occurrence and removes later planned ones when repeat goes off" |
| US4.1, US4.2 Tasks on each chosen day at its time; one "6×" goal counting each check | integration "puts the task on each chosen day at its time and counts them in one week goal"; e2e "a Sun–Fri item puts six tasks in its week and its 6× goal is done with the sixth check (US4)" |
| US4.3 No task or goal comes back once deleted | integration "does not bring back a deleted task or goal of a week" |
| US4.4 Rule changes move planned tasks only | integration "changes planned tasks of applied weeks when the rule changes, and never completed ones" |
| US4.5 Nothing after the end date | integration "places nothing after the item's end date" |
| US4.6 Templates of its activity archived in the same save, with Undo | integration "archives the templates of its activity in the same save, and Undo brings them back (D7)"; e2e "a weekly item archives its activity's template by itself, and Undo restores it (D7)" |
| US4.7 A rhythm goal of the activity is reused | integration "counts its tasks for the week's rhythm goal of the same activity instead of making a second goal (D7)" |
| US4.8 Opening a day shows its weekly tasks | integration "puts the day's tasks in place when a later week is applied from its day (D8)"; e2e "a daily item with a time is on its day at that time with no action (D8)" |
| US4.9 Repeat… from a task | integration "turns an existing task into a weekly item, the task being that day's occurrence (D8)"; e2e "Repeat… turns a task into a weekly item from the day (D8)" |
| Found while building: no task before today | integration "places no task before today, so no past day is left open, and counts only the days it placed" |

## Requirements

| Requirement | Tests |
|---|---|
| FR-001 fields and rules | unit `events.test.ts`; integration "refuses a weekly item without days and an unknown activity" |
| FR-002 one task per occurrence | integration US1.1, US4.3; unit occurrence rules |
| FR-003 agenda range, months, repeat mark | integration "lists weekly items once and one-off occurrences in the range"; unit `agenda.test.ts` (months, "Sun–Fri"); e2e US1, US3 |
| FR-004, FR-005 week goals and their links | integration US2.1, US4.1 |
| FR-006 idempotent, removals remembered | integration US2.3, US4.3 |
| FR-007 completed tasks untouched | integration US1.3, US1.4, US4.4 |
| FR-008 event mark | e2e US1, D8 (the row's "Event" label) |
| FR-009 export v5 and isolation | integration `export-format-doc.test.ts`, `export.test.ts`; isolation `cross-tenant.test.ts` (agenda routes), `catalog.test.ts` (forced RLS on the new tables) |
| FR-010 offline | the agenda query is persisted like every query; writes go through the read-only guard of `apiFetch` |
| FR-011 axe | e2e `a11y.spec.ts`: Goals with the agenda, and the event sheet with day chips, light and dark |

## Decisions taken while building

- The apply route is `POST /v1/weeks/{date}/apply-events`, next to `apply-templates`.
- A task is never placed before today: a planned task on a past day would hold
  that day open (day close gate). A weekly item's week goal counts the days
  that got a task, so an item saved mid-week asks only for the days left.
- An item has an optional duration (`minutes`) for its tasks, so "Repeat…" keeps
  the task's length.
- D7 reuse covers a week goal made by a template as well as by a rhythm.
- Weekly items show once at the top of the agenda under "Every week".

## Runs

- Backend (2026-10-26): lint clean; vitest 253 passed (31 files), of which
  27 are new agenda tests (7 unit, 20 integration) plus 5 cross-tenant checks.
- Web (2026-10-26): lint and types clean; unit 52 passed; build ok.
- Local e2e, full suite on desktop and mobile, two runs back to back after the
  last change: 90 passed, 6 skipped (staging-only smoke and single-project
  tests), 0 failed, about 34 s each.
- Found by e2e and fixed: the pressed day chip was audited mid-transition
  (the audit now runs with reduced motion, so colors are read at rest), and
  the export check still expected format 4.
- Seen once, early on, not reproduced: under the first parallel runs some API
  requests waited about 17 minutes for a database connection. Three later full
  runs, with a watcher on Postgres lock waits and idle transactions, showed
  none. Worth watching on staging.
