# Verification: Alignment You Can Trust (Feedback Round 5)

**Spec**: [spec.md](spec.md) · **Tasks**: [tasks.md](tasks.md)

Backend tests are in `life-manager-backend` (`test/unit/scores.test.ts`,
`test/integration/alignment.test.ts`, `test/integration/fix-data.test.ts`,
`test/isolation/cross-tenant.test.ts`, and the updated chain and fix-chain
tests); web tests are in this repository (`src/lib/day/chain.test.ts`,
`e2e/alignment.spec.ts`, `e2e/a11y.spec.ts`). Every e2e test runs on desktop
and mobile.

## Stories

| Scenario | Tests |
|---|---|
| US1.1 A task keeps counting for its week goal after the week closes | integration "counts a task for its week goal that is now %s" |
| US1.2 Done, carried, and dropped goals alike | integration, the same test for each status |
| US1.3 Pickers offer active goals only | unit "are left out of the picker, with their goals above still on the path" |
| US2.1 A rhythm's goal is not carried; one goal per rhythm next week | integration "does not offer or accept carrying a rhythm's goal, and sets it not met" |
| US2.2 The dry run lists merges; after the run one goal per rhythm | integration "merges a carried copy of a rhythm's goal into the goal the rhythm made, and a second run changes nothing"; owner's dry run and run on staging (below) |
| US2.3 A second run changes nothing | integration (same test); owner's confirmation dry run (below) |
| US3.1 Dry run lists tasks and merges; the run writes; a second changes nothing | integration "gives an activity by title rules…", "merges a twin activity into another and archives it, so its tasks count", "refuses a rules file naming an activity that does not exist, and writes nothing" |
| US3.2 A rule never overwrites an activity | integration "gives an activity by title rules only where there is none, to tasks and repeating items" |
| US3.3 Suggestion by prefix, one tap | integration "suggests the activity most used by past tasks with the same prefix"; e2e "a task with no activity is offered the one past tasks with its prefix used, in one tap" |
| US3.4 The close lists done tasks with no activity and fixes them in place | integration "lists done tasks with no activity at the day's close, and a task leaves the list once it gets one"; e2e "the close lists done tasks with no activity, fixes them in place, and its Why? reads plainly" |
| US4.1 Support time leaves both sides; useful work all counting is 100% | unit "leaves support entries out of both sides…", "weighs an entry with parts by its useful share of the actual minutes", "gives no alignment when only support time was done", "keeps support entries in execution"; integration "shows 100% when all useful work counts, with the coffee break marked support" |
| US4.2 "Why?" texts | e2e "the close lists done tasks…" (skipped, done · toward goals, support) |

## Requirements

| Requirement | Tests |
|---|---|
| FR-001 Goals of any status count | US1 |
| FR-002 Rhythm goals not carried | US2.1 |
| FR-003 One-off data script | US2.2, US3.1–3.2 |
| FR-004 Suggestion and close list | US3.3–3.4; cross-tenant test for the suggest endpoint |
| FR-005 Useful time only (G5 A) | US4.1 |
| FR-006 Texts in en and pt-BR | e2e and i18n keys |
| FR-007 Axe light and dark | `e2e/a11y.spec.ts` |

G6 needed no code: the owner made client B's activity and weekly template in
the interface.

## Runs (2026-11-12)

- Backend: lint, typecheck, vitest 300/300; CI check, e2e, deploy-staging green.
- Web: typecheck, lint, vitest 58/58; local e2e 98/98 on the final run. Three
  older specs (a11y, locale, agenda) failed once under parallel load and passed
  alone; the e2e caught a real bug (skipped tasks read "0m done"), fixed before
  release.
- Staging: web `38fba07`, API `bba7caa`, health ok.
- Data: the owner ran fix-data: 6 rhythm duplicates merged, 57 tasks given an
  activity, 1 twin activity merged; the confirmation dry run reported 0 changes.

## Not covered

- "A closed week keeps its days' alignment" has backend integration tests, not
  an e2e test.
- Days closed before 008 keep their stored score until edited and closed again
  (out of scope).
