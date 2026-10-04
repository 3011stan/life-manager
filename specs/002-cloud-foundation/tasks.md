---

description: "Task list for 002 Cloud Foundation"
---

# Tasks: Cloud Foundation

**Input**: Design documents from `specs/002-cloud-foundation/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md),
ADRs 0001–0007 in `docs/adr/`

**Tests**: Required. Constitution VIII (domain rules, tenant isolation, and API
contracts have automated tests; regression test before every fix) and FR-028.
Within each story, test tasks come first and must fail before implementation.

**Organization**: Tasks are grouped by user story so each story can be
implemented and verified on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: User story from spec.md (US1–US6)

## Path Conventions

Two repositories (plan.md, Project Structure):

- `backend/` = `~/Projects/life-manager-backend` (API, new repository)
- `web/` = `~/Projects/cloud-stanos` (web app, this repository)

Branch `002-cloud-foundation` is used in both repositories.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the backend repository, prepare the web app, and verify the
one unconfirmed platform assumption before building on it.

- [ ] T001 Verify on a Render Postgres instance that the default user can create a non-owner, `NOSUPERUSER`, `NOBYPASSRLS` login role with DML-only grants and that `FORCE ROW LEVEL SECURITY` applies to it; record commands and results in `web/specs/002-cloud-foundation/research.md` (R5, "Render Postgres check"). If it fails, stop and return to Plan (ADR 0004)
- [ ] T002 Initialize `backend/` as a git repository with branch `002-cloud-foundation`, `package.json` (Node 24, ESM, TypeScript 5.9), `tsconfig.json`, `.gitignore` (including `.env`), `.env.example` with placeholder values only, and `README.md`
- [ ] T003 [P] Add backend dependencies pinned to exact versions in `backend/package.json`: fastify 5, `@fastify/type-provider-typebox`, `typebox`, `@fastify/swagger`, `@fastify/cors`, `@fastify/cookie`, better-auth (core), drizzle-orm 0.45.x, drizzle-kit, pg; dev: vitest 4, `@testcontainers/postgresql`, tsx, eslint, typescript
- [ ] T004 [P] Configure lint, format, and type-check scripts (`check`, `test`, `dev`, `build`, `db:migrate`, `openapi:generate`, `openapi:check`) in `backend/package.json` and `backend/eslint.config.mjs`
- [ ] T005 [P] Create `backend/docker-compose.yml` with a local Postgres matching the Render major version, and `backend/Dockerfile` (multi-stage, Node 24, non-root user)
- [ ] T006 [P] Remove the 001 prototype from the deployed web app: delete `web/src/components/*`, `web/src/lib/*`, and `web/src/types/life-manager.ts`; replace `web/src/app/page.tsx` with a redirect to `/settings`; update `web/README.md` (prototype remains in git history)
- [ ] T007 [P] Add web dependencies pinned to exact versions in `web/package.json`: `@tanstack/react-query`, `@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister`, `idb-keyval`, `@serwist/turbopack`, orval; dev: vitest 4, `@testing-library/react`, `@playwright/test`
- [ ] T008 [P] Add web scripts (`check`, `test`, `e2e`, `api:generate`, `api:check`) in `web/package.json` and `web/orval.config.ts` pointing at a pinned `web/openapi/openapi.json` with a custom mutator `web/src/lib/api/mutator.ts`
- [ ] T009 [P] Create `web/playwright.config.ts` with `desktop` (1280×900) and `mobile` (390×844, touch) projects

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The skeleton every story needs: configuration, database roles and
isolation machinery, auth wiring, error and request rules, test harness,
contract generation, the web data layer, and a working staging deploy.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests first

- [ ] T010 Create the integration test harness in `backend/test/helpers/db.ts`: Testcontainers Postgres, migrations applied once as the migration role into a template database, one database per worker, application code connecting as the application role
- [ ] T011 [P] Create `backend/test/helpers/accounts.ts`: create a fresh allowed account + workspace per test and return a session cookie through the auth test utilities (no Google calls)
- [ ] T012 [P] Write the isolation catalog test in `backend/test/isolation/catalog.test.ts`: every table with `workspace_id` has row-level security enabled and forced, has policies, and every foreign key to a workspace table includes `workspace_id`; the application role is not owner, not superuser, and lacks `BYPASSRLS`
- [ ] T013 [P] Write the route registry test in `backend/test/isolation/route-registry.test.ts`: collect all routes via the `onRoute` hook and fail if any route lacks an entry in `backend/test/isolation/registry.ts` (cross-tenant fixture or explicit public exemption)
- [ ] T014 [P] Write request-rule tests in `backend/test/integration/request-rules.test.ts`: state-changing requests are refused with a foreign `Origin` (403), with `Sec-Fetch-Site: cross-site` (403), and with a non-JSON body (415); errors use `application/problem+json`
- [ ] T015 [P] Write the idempotency tests in `backend/test/integration/idempotency.test.ts`: a replayed key returns the stored response; the same key with a different body returns 422; keys are workspace-scoped
- [ ] T016 [P] Write `backend/test/integration/test-sign-in-absent.test.ts`: building the app with production configuration registers no `/test/*` route

### Implementation

- [ ] T017 Implement validated configuration in `backend/src/config/index.ts` (database URLs for app and migration roles, auth secret, Google client, allowed origins, cookie domain, environment name); refuse to start on missing values
- [ ] T018 Create the Drizzle setup in `backend/src/db/client.ts` and `backend/drizzle.config.ts` (app role for runtime, migration role for `db:migrate`)
- [ ] T019 Write migration `0001_roles_and_conventions` in `backend/src/db/migrations/` (hand-reviewed SQL): application role grants, default privileges for future tables, helper for `updated_at`/`version` maintenance
- [ ] T020 Implement the tenant-context plugin in `backend/src/plugins/tenant-context.ts`: per request, resolve the workspace from the session's membership, open a transaction, `set_config('app.workspace_id', …, true)`, and expose a scoped data-access handle; no route reads a workspace id from input
- [ ] T021 [P] Implement the request-rules plugin in `backend/src/plugins/request-rules.ts` (Origin allow list, Fetch-Metadata, JSON-only) and CORS for the configured origin with credentials
- [ ] T022 [P] Implement problem+json error handling and the shared not-found response in `backend/src/plugins/errors.ts`
- [ ] T023 [P] Implement the idempotency plugin and the `idempotency_key` table (schema in `backend/src/db/schema/idempotency.ts`, migration with forced row-level security and 24-hour expiry)
- [ ] T024 Implement the app factory `backend/src/app.ts`, entry point `backend/src/server.ts`, and `GET /health` returning the deployed commit
- [ ] T025 Configure Better Auth in `backend/src/plugins/auth.ts`: Google provider only, database sessions (30-day expiry, sliding refresh, cookie cache disabled), `__Secure-` cookie with the configured subdomain `Domain`, routes under `/auth`; register test utilities and `POST /test/sign-in` only when environment is local or staging; add the auth tables migration
- [ ] T026 [P] Generate and commit `backend/openapi.json` with `backend/scripts/generate-openapi.ts`; `openapi:check` fails on any difference
- [ ] T027 Create backend CI in `backend/.github/workflows/ci.yml`: install, `check`, `test` (Testcontainers), `openapi:check`, oasdiff breaking-change check against the base branch
- [ ] T028 Create the staging deploy workflow `backend/.github/workflows/deploy-staging.yml`: on green CI for the exact commit, run `db:migrate` against staging with the migration role, trigger the Render deploy hook, wait for `/health` to report the commit; and `backend/render.yaml` for the staging service (Free plan, Virginia)
- [ ] T029 Provision staging: Render web service and free Postgres, DNS `api.life-staging.bystan.tech`, Google OAuth client for staging, secrets in Render and GitHub (never committed); write the recreate-when-expired script `backend/scripts/recreate-staging-db.sh`; document steps in `backend/docs/deploy.md`
- [ ] T030 Implement the web data layer: `web/src/lib/api/mutator.ts` (credentials, `Idempotency-Key` on mutations, problem+json mapping, offline read-only guard), generated client in `web/src/lib/api/generated/` from the pinned spec, `web/src/lib/api/query-client.tsx` provider
- [ ] T031 [P] Create web CI in `web/.github/workflows/ci.yml`: `check`, `test`, `api:check` (regenerate and fail on diff), Playwright against a local API built from the pinned backend version
- [ ] T032 Connect the web app to Vercel (Hobby) with domain `life-staging.bystan.tech` for the staging branch and previews pointing at the staging API; document in `web/docs/deploy.md`

**Checkpoint**: staging API answers `/health` with the deployed commit; T010–T016 run; catalog and route registry tests pass for the tables and routes that exist so far.

---

## Phase 3: User Story 1 - Sign In And Get A Private Workspace (Priority: P1) 🎯 MVP

**Goal**: Allowed users sign in with Google and land in an automatically created personal workspace; others are refused.

**Independent Test**: quickstart scenarios 1 and 2 on staging; sign out removes access.

### Tests for User Story 1

- [ ] T033 [P] [US1] Write `backend/test/integration/first-sign-in.test.ts`: first sign-in of an allowed email creates account, workspace, owner membership, and default settings in one transaction; a second sign-in creates nothing new
- [ ] T034 [P] [US1] Write `backend/test/integration/allow-list.test.ts`: a non-allowed email creates no account row, records `sign_in_refused` with a hashed email only, and redirects to `/sign-in?error=invitation_only`
- [ ] T035 [P] [US1] Write `backend/test/integration/me.test.ts`: `GET /v1/me` returns account and workspace for a session, 401 without one, and 401 after sign-out
- [ ] T036 [P] [US1] Write `web/e2e/sign-in.spec.ts`: signed-out visit to `/settings` goes to `/sign-in` and returns after test sign-in; invitation-only message shown for the refusal error; sign-out clears workspace data (desktop and mobile projects)

### Implementation for User Story 1

- [ ] T037 [US1] Create schema and migration for `allowed_email`, `workspace`, `workspace_member` (temporary unique `account_id`), `security_event` in `backend/src/db/schema/` and `backend/src/db/migrations/` with forced row-level security on workspace tables and composite foreign keys
- [ ] T038 [US1] Implement the allow-list check in the Better Auth user-creation hook and workspace provisioning (workspace, membership, default settings) in `backend/src/modules/workspace/provision.ts`
- [ ] T039 [P] [US1] Implement security event recording in `backend/src/modules/account/security-events.ts` (sign_in, sign_in_refused, sign_out; salted hashes; no workspace content)
- [ ] T040 [US1] Implement `GET /v1/me` in `backend/src/modules/account/routes.ts`; add its cross-tenant registry entry; regenerate `backend/openapi.json`
- [ ] T041 [US1] Build `/sign-in` and the signed-in route guard in `web/src/app/sign-in/page.tsx` and `web/src/app/(signed-in)/layout.tsx`; return to the requested page after sign-in
- [ ] T042 [US1] Add allow-list management instructions (SQL against the production database through the migration role) to `backend/docs/operations.md`

**Checkpoint**: on staging, an allowed account signs in and sees an empty workspace; a non-allowed email is refused with no account created.

---

## Phase 4: User Story 2 - Same Data On Phone And Desktop (Priority: P1)

**Goal**: Workspace settings readable and editable from any device and readable offline.

**Independent Test**: quickstart scenarios 3, 4, and 6.

### Tests for User Story 2

- [ ] T043 [P] [US2] Write `backend/test/integration/settings.test.ts`: defaults (Sunday, detected or fallback time zone, 960); field-level PATCH; invalid week day, unknown time zone, capacity 0 and 1441 return 422 and leave the row unchanged; `version` increments; last write wins
- [ ] T044 [P] [US2] Write `web/src/lib/offline/connectivity.test.ts`: offline or unreachable API sets read-only; mutations are blocked in the mutator while read-only
- [ ] T045 [P] [US2] Write `web/e2e/settings.spec.ts`: change on one browser context, reload another → new value (SC-002); failed save keeps the previous value with an error; offline reload shows cached values, banner with time, disabled inputs (SC-011); 390 px has no horizontal scroll

### Implementation for User Story 2

- [ ] T046 [US2] Create the `workspace_settings` schema and migration (unique `workspace_id`, checks for ranges, forced row-level security) in `backend/src/db/schema/settings.ts`
- [ ] T047 [US2] Implement `GET` and `PATCH /v1/workspace/settings` with IANA time zone validation in `backend/src/modules/settings/routes.ts`; add registry entries; regenerate `backend/openapi.json`
- [ ] T048 [US2] Update the pinned `web/openapi/openapi.json` and regenerate the client
- [ ] T049 [US2] Build `/settings` in `web/src/app/(signed-in)/settings/page.tsx` as a static shell with client-side data, saving state, and error messages (FR-013, FR-015)
- [ ] T050 [US2] Implement offline support: `web/src/app/sw.ts` with Serwist (app shell and offline fallback), IndexedDB query persistence keyed by account and workspace and wiped on sign-out and 401 in `web/src/lib/offline/persist.ts`, connectivity and read-only hook in `web/src/lib/offline/connectivity.ts`, offline and waking-up banner in `web/src/components/ConnectivityBanner.tsx`

**Checkpoint**: settings round-trip across two devices on staging; offline read-only verified on a real phone (record device and browser).

---

## Phase 5: User Story 3 - My Data Is Only Mine (Priority: P1)

**Goal**: Prove isolation for every route and table that exists at this point.

**Independent Test**: isolation suite passes as the application role; manual spot check of quickstart scenario 5.

- [ ] T051 [P] [US3] Write `backend/test/isolation/cross-tenant.test.ts`: for every registry entry, account B reading, updating, or deleting account A's resource gets the same 404 body as a random id; B's responses never contain A's ids
- [ ] T052 [P] [US3] Write `backend/test/isolation/rls-fail-closed.test.ts`: a query without `app.workspace_id` returns no rows; inserting a row referencing another workspace's id fails on the composite foreign key
- [ ] T053 [US3] Fix any failures found by T051–T052 with a regression test first; record results for `verification.md`

**Checkpoint**: SC-003 established by test output.

---

## Phase 6: User Story 4 - Export Everything (Priority: P2)

**Goal**: Full export as JSON and Markdown per [export-format.md](contracts/export-format.md).

**Independent Test**: quickstart scenario 7.

- [ ] T054 [P] [US4] Write `backend/test/integration/export.test.ts`: both formats contain every stored value for the account and nothing from another account; every JSON field appears in the Markdown; a concurrent export returns 409; an `export` security event is written
- [ ] T055 [US4] Implement `GET /v1/export?format=json|markdown` in `backend/src/modules/export/` (JSON builder, Markdown renderer, per-account concurrency lock); add registry entry; regenerate `backend/openapi.json`
- [ ] T056 [US4] Document the format in `backend/docs/export-format.md` (copied from the spec contract and kept in sync by a test that checks field names)
- [ ] T057 [US4] Build export actions on `/account` in `web/src/app/(signed-in)/account/page.tsx`; add `web/e2e/export.spec.ts`

**Checkpoint**: SC-004 measured on staging.

---

## Phase 7: User Story 5 - Delete My Account (Priority: P2)

**Goal**: Permanent deletion after confirmation, signing out every device.

**Independent Test**: quickstart scenario 8.

- [ ] T058 [P] [US5] Write `backend/test/integration/account-deletion.test.ts`: wrong or missing confirmation returns 422; confirmed deletion removes account, workspace, settings, membership, idempotency keys, sessions, and provider links; a second device's session gets 401 on its next request; an `account_deleted` event remains with only the opaque id; signing in again creates a new empty workspace
- [ ] T059 [US5] Implement `DELETE /v1/account` in `backend/src/modules/account/delete.ts` in one transaction with session revocation; add registry entry; regenerate `backend/openapi.json`
- [ ] T060 [US5] Build the deletion dialog (export offered first, confirmation phrase) on `web/src/app/(signed-in)/account/page.tsx`; add `web/e2e/account-deletion.spec.ts`

**Checkpoint**: SC-005 established.

---

## Phase 8: User Story 6 - Reliable, Verified Releases (Priority: P2)

**Goal**: Production environment, gated releases, smoke checks, backups, and restore drills.

**Independent Test**: quickstart scenarios 9–11 and the post-deploy smoke.

- [ ] T061 [P] [US6] Write the smoke suites: `web/e2e/smoke-staging.spec.ts` (test sign-in, settings round-trip) and `backend/scripts/smoke-production.sh` (health commit, 401 on `/v1/me`, sign-in redirect URL, CORS only for the production origin)
- [ ] T062 [US6] Provision production: Render web service (Free), Render Postgres Basic, DNS `life.bystan.tech` and `api.life.bystan.tech`, production Google OAuth client, application and migration roles per T001, secrets in Render and GitHub; extend `backend/docs/deploy.md`
- [ ] T063 [US6] Create `backend/.github/workflows/deploy-production.yml`: manual trigger for a commit that passed staging smoke; migrate with the migration role, trigger the Render deploy hook, run the production smoke; never chained into one command with the check it depends on
- [ ] T064 [P] [US6] Create `backend/.github/workflows/backup.yml`: nightly logical dump of production to Cloudflare R2 with 30-day lifecycle; alert (failed workflow notification) on failure; script in `backend/scripts/backup-dump.sh`
- [ ] T065 [P] [US6] Create `backend/.github/workflows/restore-drill.yml`: monthly and on demand, restore the latest dump into a scratch database, compare row counts and checksums, tear down; script in `backend/scripts/restore-drill.sh`
- [ ] T066 [US6] Configure Vercel production for `life.bystan.tech` pointing at the production API; release independence check: deploy API alone, then web alone, run both smoke suites (SC-007)
- [ ] T067 [US6] Prove the gate: push a commit with a deliberately failing test on a throwaway branch and record that no deploy job ran (SC-008); delete the branch

**Checkpoint**: production live at `life.bystan.tech`; first restore drill passed.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T068 [P] Write `backend/AGENTS.md`: commands, two-repo workflow, migration rules (expand/contract, reviewed SQL, migration role), isolation rules (registry entry for every route, tests as application role), secrets policy
- [ ] T069 [P] Write `web/docs/engineering/testing.md` from the real examples built in this feature (flow doc: observe first, then codify)
- [ ] T070 Run all of [quickstart.md](quickstart.md) on staging and production; write `web/specs/002-cloud-foundation/verification.md` with commands, results, failures, and gaps (a skipped check is a gap)
- [ ] T071 Record in ai-memory the hosting decision history (Fly.io + Neon proposed and rejected in favor of Render + Vercel), the Render role check result, and any gotchas found during implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 Setup: T001 first (it can invalidate ADR 0004); then T002–T009.
- Phase 2 Foundational: depends on Setup; blocks all stories. T010 before other backend tests; T017–T019 before T020–T025; T028–T029 need T024 and T027.
- US1 (Phase 3): depends on Foundational.
- US2 (Phase 4): depends on US1 (settings are provisioned at first sign-in).
- US3 (Phase 5): depends on US1 and US2 (it tests the routes that exist).
- US4 and US5 (Phases 6–7): depend on US1 and US2; independent of each other.
- US6 (Phase 8): depends on Foundational for staging; production after US1–US5.
- Polish (Phase 9): after the stories in scope.

### Within Each Story

Tests first and failing → schema/migration → routes → contract regeneration → web UI → end-to-end.

### Parallel Opportunities

- Setup: T003–T009 in parallel after T002 (backend) and independently in `web/`.
- Foundational tests T011–T016 in parallel after T010; T021–T023 in parallel.
- US4 and US5 can run in parallel; T064 and T065 in parallel.

### Parallel Example: Foundational tests

```text
T012 catalog test       → backend/test/isolation/catalog.test.ts
T013 route registry     → backend/test/isolation/route-registry.test.ts
T014 request rules      → backend/test/integration/request-rules.test.ts
T015 idempotency        → backend/test/integration/idempotency.test.ts
T016 test sign-in absent → backend/test/integration/test-sign-in-absent.test.ts
```

## Implementation Strategy

### MVP First

1. T001 (platform check), Setup, Foundational with staging deploy.
2. US1 → validate on staging: sign in and see an empty workspace.
3. US2 → settings across devices and offline: the first real value.
4. US3 → isolation proven before anyone else is on the allow list.

### Incremental Delivery

5. US4 export, US5 deletion (required before inviting other people).
6. US6 production, backups, restore drill.
7. Polish and `verification.md`; the feature closes only with accepted evidence.
