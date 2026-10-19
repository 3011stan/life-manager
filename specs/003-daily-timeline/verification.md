# Verification: Daily Timeline, Activities, And Objectives

**Status**: DRAFT — automated checks done locally and in CI; the hosted
quickstart run by the owner (T039) is pending. Verdict: pending.

## Builds under test

| Repo | Commit | Where |
|---|---|---|
| backend | `3f3359e` | CI green; deployed to staging (`/health` reports it) |
| web | `33c1a7a` | CI green; deployed to `life-staging.bystan.tech` |

Local run: 2026-10-19, macOS, Node 24.21.0, Postgres 18 (Docker), Playwright
1.63.0 (Chromium), web production build, API with a throwaway test secret.

## Automated checks

| Check | Command | Result |
|---|---|---|
| Backend lint, types, contract | `npm run lint`, `tsc --noEmit`, `npm run openapi:check` (CI) | pass |
| Backend unit (domain rules) | `vitest run test/unit` | 42 pass: cycles, scores, progress, gates |
| Backend integration + isolation | `npm test` | 186 pass (25 files) |
| Cross-tenant registry (SC-007) | `test/isolation/cross-tenant.test.ts` | every one of the 42 tenant routes has a check; all pass |
| Forced RLS on new tables | `test/isolation/catalog.test.ts` | 15 new tables: RLS forced, composite FKs include `workspace_id` |
| Web lint, types | `npm run lint`, `tsc --noEmit` | pass |
| Web unit | `vitest run` | 23 pass (dates, order keys, progress text, capture parser, API client) |
| End to end | `npx playwright test` (desktop 1280×900 and mobile 390×844) | 46 pass, 2 skipped by design (single-account specs run on desktop only); two consecutive full runs green |

## Spec coverage by evidence

| Story / criterion | Evidence | Result |
|---|---|---|
| US1 plan and run today | `e2e/day.spec.ts` (second context as second device); `test/integration/days.test.ts` | established |
| US2 real cost, segments, time blocks | `e2e/day.spec.ts`; `days.test.ts`; `scores.test.ts` totals | established |
| US3 catalog, rename, archive, in-use | `catalog.test.ts`; catalog screen exercised by `objectives.spec.ts` | established for API; catalog screen rename/archive not covered by e2e (limited) |
| US4 log what happened | `day-close.spec.ts`; `days.test.ts`; `day-close.test.ts` | established |
| US5 close the day, carries, check-in, Rule Zero | `day-close.spec.ts`; `day-close.test.ts`; `gates.test.ts` | established |
| US6 objectives at every horizon, six types | `objectives.test.ts` (10y → year → month → week chain); `progress.test.ts`; `objectives.spec.ts` | established |
| US7 week/month/year close, templates, checkpoints | `cycle-close.test.ts`; `objectives.spec.ts` | established for week; month/year close only through the API tests |
| US8 capture | `capture.spec.ts`; `parse.test.ts` (001 F1 lines) | established |
| FR-044 / SC-010 two languages | `locale.spec.ts`; dictionaries are type-checked for missing keys | established for the screens visited; no automated scan for untranslated text |
| FR-049 export v2 | `export.test.ts`, `export-format-doc.test.ts` | established |
| FR-050 deletion | `account-deletion.test.ts` covers every new table | established |
| SC-006 scores equal hand calculation | `scores.test.ts`, `day-close.test.ts` | established |
| SC-009 390 px, 44 px | `day.spec.ts` | limited: checks the day screen only |
| SC-003 sync within 30 s | 15 s refetch interval and refetch on focus | limited: not measured |
| SC-001, SC-002, SC-004, SC-005, SC-008 | timing and dogfooding | not verifiable by automation; owner run pending |

## Defects found and fixed during implementation

| Defect | Regression test |
|---|---|
| A read cancelled by navigation marked the API unreachable, so the next mutation (test sign-in) was refused as read-only | `src/lib/api/mutator.test.ts` |
| Two first catalog reads at once both seeded the generic catalog; one failed with 409 | `catalog.test.ts` "seeds once when the first reads arrive together" |
| Empty (204) responses could not be stored for idempotent replay | covered by catalog and entry delete tests |
| Template form read the submit event after `await` | `objectives.spec.ts` templates test |

## Known gaps

- Backups: tested restore and nightly dumps (002 T064, T065, T074) do not
  exist yet; the owner accepted storing real data without them. The Free
  database expires on 2026-11-16 unless upgraded (002 T075).
- Tags have no screen (the API supports them).
- Manual entry → objective links have no screen (the API supports them).
- FR-035 second rule (direct link to a higher horizon only when no lower
  objective has that parent) is not enforced.
- The owner's personal seed (T020) is waiting for the owner to run it.
- No hosted e2e run: CI has no Vercel protection bypass or staging test
  secret yet (002 T061).

## Verdict

Pending the owner's run of the quickstart on staging (phone and desktop).
