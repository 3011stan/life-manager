# Verification: Plan and Polish (Feedback Round 2)

**Status**: DRAFT. Automated checks are green locally. The owner's run on phone
and desktop is pending, and so is the verdict.

## Every point and its evidence

| # | Point | Change | Test |
|---|---|---|---|
| 1 | Catalog doesn't match the model | New workspaces get 3 × 9 (D1). The seed moves the old generic catalog, and `--dry-run` shows the plan. Activity type (D1b) | backend `catalog.test.ts`, `seed.test.ts`; e2e `catalog.spec.ts` |
| 2 | Entry form too complex | The sheet shows title, activity (searchable picker with "Create"), start, duration, and "counts for", with the rest under "More". Parts, routine, and deep work come from the activity (D2, D3) | backend `parts.test.ts`, `days.test.ts`; e2e `day.spec.ts` "a new duration from the short sheet resizes the main part" and "an entry from an activity with parts…" |
| 3 | Rudimentary design | Ritmo with B's parts (D4): tokens, dark mode, DM Sans, SVG icons, round checks, pillar dots, progress ring | e2e `a11y.spec.ts`: axe on every screen and the open sheet, light and dark, desktop and mobile |
| 4 | Goals → activities | Many goals above (D5), Goals as one tree with "+ Goal" (D6), rhythms (D7), 15-year horizon (D8) | backend `objectives.test.ts`, `progress.test.ts`, `migrations-005.test.ts`, isolation; e2e `goals.spec.ts` |

## Defects found by the new runs (each now has a test)

| Defect | Fix | Test (fails without the fix) |
|---|---|---|
| A template added while the page's first list load was in flight didn't show | Cancel the in-flight load and put the created template in the list | `objectives.spec.ts` "a template added during a slow first load shows at once" |
| Undo right after a delete could reach the server first; the delete then won | Undo waits for the pending delete | `readability.spec.ts` "undo right after a slow delete keeps the entry" |
| A week opened while another screen created its rhythm goals showed without them | Refresh after every apply-rhythms call | `goals.spec.ts` |

## Running-app tests

| Check | Result |
|---|---|
| Local full e2e (API 005, production web build, desktop + mobile) | 72 of 72 pass, five consecutive runs |
| Backend `npm run check` | 216 tests pass |
| Web unit tests | 48 pass |

## Known gaps

- The owner's seed (T009) waits for the owner: dry-run, export, then the real run.
- Under heavy parallel load (8 workers × 10 repeats) the goals tree can take over 5 s to refetch; the test waits 15 s.

## Verdict

Pending the owner's run on phone and desktop.
