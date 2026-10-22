# Verification: Timeline Feedback, Round 1

**Status**: DRAFT — automated checks green locally and in CI; the owner's run
on phone and desktop is pending. Verdict: pending.

## Every finding and its evidence

| # | Finding | Fix | Test (fails without the fix) |
|---|---|---|---|
| 2 | Sheet did not close on outside click | dialogs close on backdrop click | `e2e/day.spec.ts` "the entry sheet closes on a click outside it" |
| 9 | Entry moved to the top jumped back | order keys `COLLATE "C"`; test databases use ICU `en-US` like Render | `backend/test/integration/days.test.ts` "keeps an entry moved to the top first after a refetch" (failed before the migration); `backend/test/integration/schema-rules.test.ts`; `e2e/day.spec.ts` "an entry moved to the top stays there after a reload" |
| 11 | Odd refresh when checking an entry | add field stays enabled and keeps its text; rows memoized; orders agree (9) | `e2e/day.spec.ts` "checking an entry keeps the add field and the order" |
| 12 | Copy duplicated carried entries | `copied_from_entry_id`; copy skips what the day already received; dialog marks it | `backend/test/integration/days.test.ts` "copies only what the target day did not already receive" (failed before); `e2e/day-close.spec.ts` copy after close |
| 10 | Rows showed the activity name | title on the row, activity as a muted label when different | `e2e/readability.spec.ts` "rows show the typed title…" |
| 7 | No way to group entries | headings ("JIB:") with indented entries and a total | `backend/test/integration/groups.test.ts` (4 tests); `e2e/readability.spec.ts` group test |
| 8 | Chain to objectives not visible | objective mark on rows; chain in the sheet; manual links | `backend/test/integration/objectives.test.ts` day objectives; `e2e/objectives.spec.ts` mark and chain |
| 5 | Durations only in minutes | one parser for every minutes field | `src/lib/day/duration.test.ts` (21 cases); `e2e/readability.spec.ts` durations |
| 13 | Deleting was slow | swipe left (touch) / hover (mouse) Delete, Undo for 5 s | `backend/test/integration/days.test.ts` restore; `e2e/readability.spec.ts` delete and undo, desktop and mobile |
| 15 | Activities screen hard to use | flat searchable list, parts count, Organize view | `e2e/catalog.spec.ts` |
| 6 | Gym block not shown | segments come from the activity; the list now shows "N parts"; the owner's seed has them | explained; `e2e/catalog.spec.ts` |
| 4 | Entry without start time | by design | — |
| 1, 3, 14 | Capture, computed schedule, first path | deferred | `docs/discovery/llm-capture.md`, `scheduled-day.md`, `first-path.md` |

## Running-app tests

| Check | Result |
|---|---|
| Backend CI `e2e` job (Postgres ICU, API, web build, Playwright desktop + mobile) | green on every push since `3194ee4`: 52 pass, 2 skipped at first; now more with the new specs |
| Web CI `e2e` job | skipped with a warning until `BACKEND_READ_TOKEN` exists (owner action) |
| Gate proof (T010) | run 39696880060: a deliberate defect failed `check` and `e2e`; `deploy-staging` did not run |
| Staging smoke after deploy (T009) | in place; skipped with a warning until `VERCEL_AUTOMATION_BYPASS_SECRET` is in the backend `staging` environment |
| Local full run (ICU database) | 62 pass, 4 skipped by design, two consecutive runs |

## Known gaps

- Web CI e2e and the staging smoke wait for two owner secrets.
- Undo after deleting a group heading restores the heading but not its
  grouping (the entries stay ungrouped).
- Entries can move between groups only through the sheet, not by dragging.
- The staging database collation was inferred from the bug's behavior, not
  read from Render; the fix holds under either collation.

## Verdict

Pending the owner's run on phone and desktop.
