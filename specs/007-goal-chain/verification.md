# Verification: Goal Chain (Feedback Round 4)

**Spec**: [spec.md](spec.md) · **Tasks**: [tasks.md](tasks.md)

Backend tests are in `life-manager-backend` (`test/unit/cycles.test.ts`,
`test/unit/progress.test.ts`, `test/integration/chain.test.ts`,
`test/integration/fix-chain.test.ts`, and the updated objectives, events, seed,
and export tests); web tests are in this repository (`src/lib/day/chain.test.ts`,
`src/lib/day/groups.test.ts`, `e2e/chain.spec.ts`, `e2e/goals.spec.ts`,
`e2e/a11y.spec.ts`). Every e2e test runs on desktop and mobile.

## Stories

| Scenario | Tests |
|---|---|
| US1.1 A tracked task credits its year goal through new week and month goals | integration "builds the week and month goals for a task whose activity a year goal tracks, and reuses them"; e2e "a task of a tracked activity credits its year goal through new week and month goals, and links go one level up" |
| US1.2 A second task that week reuses the week goal | integration "builds the week and month goals…" (second task) |
| US1.3 A task no goal tracks counts for nothing | integration "builds the week and month goals…" ("Walk") |
| US1.4 "Counts for" shows the whole path, each goal once | unit "draws what a task counts for from its direct goals, each goal once" (finding 7); integration "credits the week's month for a task on its first day…"; e2e (one path of three rows) |
| US2.1 A task links by hand only to goals of its week | integration "links a task by hand only to goals of its week"; e2e (the task's picker) |
| US2.2 Each goal counts only for the horizon right above; the API refuses others | unit "accepts a link only to the next horizon…"; integration "lets a goal count only for goals of the horizon right above that hold it"; e2e (a week goal's picker offers only month goals) |
| US2.3 A year goal's rhythm goes through the month goal, target from the rhythm | integration "puts a month goal between a year goal's rhythm and its week goals, with the rhythm's target"; "uses a month rhythm's goal as the month between a task and its year goal"; objectives "creates the week's goal once…" |
| US2.4 An event's and a repeating item's week goal go through the month goal | integration "links an event's week goal and a repeating item's goal through the month goal"; events "makes one goal for the event…" |
| US3.1 The entry's picker: this week's goals, search, at most 8, with paths | unit "offers only goals of one horizon, each with its path", "finds goals by title or path, at most 8…"; e2e |
| US3.2 "+ New week goal" from the task, with the month above | e2e `a11y.spec.ts` (the form opened and audited); component in `EntrySheet.tsx` |
| US3.3 The goal sheet's picker shows only the horizon above | e2e "a year goal under two 5-year goals…" (picker "Counts for (5 years)"), chain e2e ("Counts for (Month)") |
| US4.1 The dry run lists every change and writes nothing | integration "reports every change in a dry run and writes nothing" |
| US4.2 After the run no week goal counts for a year goal and no task is linked to a longer goal | integration "moves goals and tasks onto the chain, and a second run changes nothing" |
| US4.3 A goal still skipping a level is marked | integration (reported as "still skips a level"); `GoalsTree.tsx` mark with `skipsLevel` (unit) |
| US4.4 Running twice changes nothing | integration "moves goals and tasks… second run changes nothing" |

## Requirements

| Requirement | Tests |
|---|---|
| FR-001 Links one horizon up | unit and integration above; old links: "keeps old links that skip a level readable, and an edit may keep them but not add one" |
| FR-002 Hand links to the task's week | integration "links a task by hand only to goals of its week" |
| FR-003 Direct credit for week goals only | unit "credits a longer goal only through its week goals", "flows credit up to the duration ancestor, through the week goal's dates" |
| FR-004 Completion builds the missing goals | integration (US1), "builds the goals between a task and a 5-year goal, and reuses a loose week goal of the activity", "goes through the month goal that already tracks the activity" |
| FR-005 Rhythms, events, repeating items | integration (US2.3, US2.4) |
| FR-006 Reused per goal above and period; a deleted one stays deleted | integration (US1, removed week goal) |
| FR-007 Pickers in the entry, goal, and event sheets | e2e chain and goals specs; a11y audits |
| FR-008 Old links readable, marked | integration "keeps old links…", "carries a goal whose old link skipped a level through the goal between" |
| FR-009 Fix script: dry run, idempotent, run by the owner | integration `fix-chain.test.ts` |
| FR-010 axe light and dark | e2e `a11y.spec.ts`: the entry sheet with the goal picker open and the new week goal form |
| FR-011 "Counts for" from direct goals, each goal once | unit (finding 7); e2e (one path, three rows) |

## Found while verifying

- A week belongs to the month of its fourth day, but a task on the week's first
  day, still in the month before, was outside that month's dates: it counted
  for the week goal and not for the month above it, and the day did not list
  that month, so "Counts for" split into two paths (found by the chain e2e on
  a week starting on 29 March). Fixed: the date check is on the week goal, and
  the day lists the goals of its week's month and year. Tests: unit "credits
  the week's month for a task on a day of the month before", integration
  "credits the week's month for a task on its first day…".
- The export check in e2e still expected format 5; it is 6 now.

## Runs

- Backend (2026-10-28): lint and types clean; vitest 272 passed (33 files).
- Web (2026-10-28): lint and types clean; unit 56 passed; build ok.
- Local e2e on a fresh stack with 2 workers: 90 passed and 2 failed on the
  first run (a sign-in at cold start and the locale spec, neither touching
  007), then two runs back to back: 92 passed, 6 skipped, 0 failed, about 48 s
  each.
- Seen locally, not a 007 change: with the machine under heavy load (load
  average 30–56) and asleep part of the time, the default 5 workers timed out
  across many specs, and after a sleep the API's database connections were
  gone while requests waited on them with no timeout (93 requests never
  finished; Postgres showed no connection from the app). This matches the
  "17 minutes waiting for a connection" seen in 006. A connection timeout and
  TCP keepalive on the pool would make such a wait fail fast; left for a later
  round.
- CI (2026-10-28): web `2b315e0` green (check, e2e); backend `e2b81be` green
  (check, and e2e against the web branch `007-goal-chain`).
- Pending: T012 (the owner reads the fix-chain dry run on staging and runs
  it), staging release, and the owner's run on phone and desktop.
