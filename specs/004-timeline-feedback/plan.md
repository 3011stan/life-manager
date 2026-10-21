# Implementation Plan: Timeline Feedback, Round 1

**Branch**: `004-timeline-feedback` (both repositories) | **Date**: 2026-10-20 | **Spec**: [spec.md](spec.md)

**Status**: Draft. D1, D2, D4, D6 approved; D3 and D5 deferred.

## Summary

Fix the four timeline defects with regression tests first; make CI run the
whole Playwright suite against a running stack in both repositories and a smoke
flow on staging after each deploy; then readability (titles, groups,
objective marks and chain, manual links), faster input (durations, swipe
delete with undo), and a flat activities list.

## Technical Decisions

| # | Decision | Why |
|---|---|---|
| R1 | Order keys use `COLLATE "C"` (migration on `entry`, `pillar`, `area`, `objective`, `objective_template` `order_key`); Testcontainers and docker-compose databases are created with ICU `en-US` like Render, so the regression test fails on the old schema | Fractional keys need byte order; the bug only shows under language collation |
| R2 | Optimistic updates keep the list order from the cache and the server merges by id; a save no longer disables the add field; only the changed row re-renders (memoized rows) | Point 11 |
| R3 | New `copied_from_entry_id`; copy skips sources present in the target as `copied_from` or `carried_from`; the copy dialog shows them checked-off and disabled | Point 12 |
| R4 | A shared `Sheet` component closes on backdrop click and Escape (every dialog moves to it) | Point 2 |
| R5 | Groups: `entry.kind` (`item`, `heading`) and `entry.group_id` (same day); headings are excluded from scores and capacity; children order by their own keys inside the group | D1 |
| R6 | Display rule changes to "title; activity label when different" in the web app only | D2 |
| R7 | Durations parsed by one tested function (`src/lib/day/duration.ts`) used by every minutes field | Point 5 |
| R8 | Swipe: pointer events on the row (no new dependency); threshold 80 px; Undo restores by clearing `deleted_at` through a new `POST /v1/entries/{id}/restore` | D4 |
| R11 | CI e2e: a reusable workflow starts Postgres (ICU en-US), runs migrations, starts the API with a throwaway test secret, builds and starts the web app, runs Playwright desktop and mobile; the web repo checks out the backend with a read-only token secret `BACKEND_READ_TOKEN`; traces stay in the job (no public artifacts) | D6, 002 T061 note on public artifacts |
| R12 | Staging smoke: after deploy, Playwright runs `e2e/smoke.spec.ts` against staging with `VERCEL_AUTOMATION_BYPASS_SECRET` and `TEST_SIGN_IN_SECRET` | FR-007 |

## Constitution Check

| Principle | Status |
|---|---|
| IV Mobile-first | Swipe delete, durations, readable rows. |
| VI Tenant isolation | The new `restore` route join the cross-tenant registry. |
| VII Data ownership | Undo instead of irreversible delete; export gains `kind`, `groupId`, `copiedFromEntryId` (formatVersion 3). |
| VIII Evidence | Each defect gets a failing test first; e2e on every push. |

## Delivery Order

1. Defects + their regression tests (US1) and the CI e2e (US2).
2. Readability (US3).
3. Input speed (US4).
4. Activities list (US5).

Each step ships to staging when CI (now including e2e) is green.
