# Quickstart: Cloud Foundation Validation

**Feature**: `002-cloud-foundation` | **Date**: 2026-10-04

How to prove the feature works. Results are recorded in `verification.md` when the
feature closes (constitution VIII). Contracts: [api.md](contracts/api.md),
[export-format.md](contracts/export-format.md), [ui.md](contracts/ui.md).

## Prerequisites

- Node.js 24, Docker (for local Postgres and Testcontainers).
- Both repositories checked out side by side:
  `~/Projects/cloud-stanos` (web app) and `~/Projects/life-manager-backend` (API).
- Local `.env` files created from each repository's `.env.example` (never
  committed).

## Local Run

```bash
# API
cd ~/Projects/life-manager-backend
docker compose up -d db          # local Postgres
npm install
npm run db:migrate               # as the migration role
npm run dev                      # http://localhost:4000

# Web app
cd ~/Projects/cloud-stanos
npm install
npm run api:generate             # orval client from the pinned openapi.json
npm run dev                      # http://localhost:3000
```

## Automated Checks

| Check | Command (repository) | Expected |
|---|---|---|
| Lint, types, unit | `npm run check` (both) | exit 0 |
| API integration incl. isolation | `npm test` (backend) | exit 0; tests run as the application role |
| Isolation catalog | part of `npm test` (backend) | every workspace table has forced row-level security, policies, composite foreign keys |
| Route coverage | part of `npm test` (backend) | every route has a cross-tenant test entry or explicit public exemption |
| Test sign-in absent in production | part of `npm test` (backend) | production build registers no `/test/*` route |
| Contract | `npm run openapi:check` (backend), `npm run api:check` (web app) | no diff; no breaking change without a version step |
| End-to-end | `npm run e2e` (web app) | desktop and 390×844 projects pass |

## Scenario Validation

Run against local first, then staging.

1. **Sign in, first time (US1)**: allowed email → workspace created with
   defaults (Sunday, detected time zone, 960 minutes).
2. **Refused sign-in (US1, SC-010)**: email not on the allow list → "invitation
   only"; no account row created (check the database).
3. **Two devices (US2, SC-002)**: change week start on desktop; refresh phone
   (390×844) → new value within 5 seconds.
4. **Invalid value (US2)**: capacity 0 or 2000 → field error; stored value
   unchanged.
5. **Isolation (US3, SC-003)**: covered by the automated route tests; spot-check
   by requesting another account's settings id → `404`, same body as a random
   id.
6. **Offline (FR-016, SC-011)**: load `/settings`, switch the browser offline,
   reload → cached values, offline banner with time, inputs disabled.
7. **Export (US4, SC-004)**: download JSON and Markdown → every stored value
   present; fields match [export-format.md](contracts/export-format.md); under
   1 minute.
8. **Delete account (US5, SC-005)**: delete with the confirmation phrase → signed
   out on a second signed-in device at its next request; no rows remain for
   the account; signing in again creates a new empty workspace.
9. **Release independence (US6, SC-007)**: deploy only the API to staging, then
   only the web app → the other keeps working; smoke check passes.
10. **Gate (SC-008)**: a commit with a failing test cannot reach the deploy job.
11. **Restore drill (FR-022, SC-006)**: run the restore-drill workflow → restored
    row counts and checksums equal the source dump.
12. **Mobile layout (SC-009)**: sign-in, settings, account at 390 px → no
    horizontal scroll, touch targets at least 44 px.

## Post-Deploy Smoke

After every staging or production deploy: `GET /health` returns the deployed
commit; on staging, test sign-in → read and update settings → read back.
In production (no test sign-in exists there): `GET /health` returns the deployed
commit, `GET /v1/me` without a session returns `401`, starting Google sign-in
returns a Google redirect URL, and CORS answers only the production origin. The
full sign-in and settings round-trip is proven on staging with the same commit
before production is deployed.
