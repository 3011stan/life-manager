# Research: Cloud Foundation

**Feature**: `002-cloud-foundation` | **Date**: 2026-10-04 | **Status**: ADRs 0001–0007
accepted by the owner (2026-10-04)

Facts were checked against the sources listed under each topic on 2026-10-04.
Items marked *(unverified)* could not be confirmed from a primary source and must be
checked during implementation.

## R1. Storage model

- **Decision**: PostgreSQL as the single source of truth; JSON and Markdown export
  generated from it. See [ADR 0001](../../docs/adr/0001-storage-model.md).
- **Rationale**: referential integrity (discovery Q20), tenant isolation at the
  database level, rollups across horizons, and open paths to offline sync.
- **Alternatives considered**: document store; Markdown files as storage; two-way
  database ↔ vault sync.

## R2. Hosting, database, backups

- **Decision (owner)**: API on **Render** (Docker web service, Virginia, Free plan
  in staging and production); database on **Render Postgres** in the same
  region (paid Basic in production, free in staging); nightly dumps to
  **Cloudflare R2** kept 30 days. See [ADR 0002](../../docs/adr/0002-hosting-topology.md).
- **Why it differs from the first proposal**: research favored Fly.io + Neon in
  São Paulo for latency and a native release phase; the owner chose the Render
  and Vercel setup already used for another project. Trade-offs accepted:
  - about 110–130 ms added per request from Brazil (no South America region);
  - free web services sleep after 15 minutes and take about a minute to wake
    (SC-001 amended to measure with the service awake);
  - no pre-deploy command on Free, so GitHub Actions runs migrations before
    triggering the Render deploy hook;
  - the free Render database expires after 30 days, so production uses the paid
    Basic plan (about US$6/month) and staging is recreated by script.
- **Backups (FR-020–FR-022)**: Render's built-in backups (point-in-time restore
  creates a new instance) plus a nightly logical dump to R2 kept 30 days; a
  scheduled restore drill restores the latest dump into a scratch database and
  compares row counts and checksums. R2 has no egress fees, so drills are free.
- **Alternatives considered**: Fly.io + Neon São Paulo (best latency, native
  release command); Render Starter (~US$7/month, no cold starts; deferred);
  Neon or Supabase as the database (Supabase free tier pauses and has no
  backups); Google Cloud Run; AWS.
- **Sources**: render.com/docs/regions, render.com/docs/free,
  render.com/docs/postgresql-backups, render.com/docs/deploys,
  neon.com/docs/introduction/regions, docs.fly.io/reference/configuration,
  supabase.com/pricing, developers.cloudflare.com/r2/pricing *(R2 pricing not
  re-fetched)*.

## R3. Frontend hosting

- **Decision (owner)**: **Vercel**, Hobby while personal and non-commercial,
  Pro (US$20 per seat per month) before any commercial use. Functions stay in
  the default US-east region, next to the API.
- **Alternative considered**: Cloudflare Workers via OpenNext (free tier usable
  commercially; Node middleware support experimental).
- **Sources**: vercel.com/docs/plans/hobby, vercel.com/docs/regions,
  opennext.js.org/cloudflare.

## R4. Authentication and sessions

- **Decision**: **Better Auth inside the Fastify API**, core + Google provider
  only. See [ADR 0003](../../docs/adr/0003-authentication.md).
- **Rationale**:
  - The API owns identity, sessions, the allow list, and tenancy in one place.
  - Database sessions are revocable: `expiresIn` 30 days, sliding refresh,
    **cookie cache disabled** so account deletion signs out every device at once
    (FR-019, FR-020).
  - The allow list is enforced in the `user.create.before` hook, so no account is
    created for other addresses (FR-002) and the rule covers future methods.
  - The magic-link plugin signs into the existing account for a known email, so
    adding it later changes no accounts (FR-001).
  - A test-utilities plugin creates authenticated sessions without Google.
- **Guardrails**: pin versions; watch security advisories (12 published in June
  2026, mostly in plugins we do not use); no organization, SSO, or
  OAuth-provider plugins; workspaces and memberships in our own tables.
- **Cookies and CSRF**:
  - Cookie `__Secure-` prefixed, `HttpOnly; Secure; SameSite=Lax`, scoped to
    the app's own subdomain (`life.bystan.tech`), never to `bystan.tech`, so
    other projects on the domain never receive it.
  - SameSite does not protect against sibling subdomains, so every
    state-changing route requires an allowed `Origin`, rejects
    `Sec-Fetch-Site: cross-site`, and accepts JSON only.
  - CORS allows exactly the app origin with credentials.
- **Previews**: preview deployments on a vendor domain are cross-site to the API
  and Google does not allow wildcard redirect URIs. Previews authenticate
  against staging through a **staging-only test sign-in**, disabled in
  production by configuration and by a test that fails if it is registered.
- **Google**: only `openid email profile` scopes, so app verification is not
  required; brand verification and a privacy policy URL are needed before
  leaving testing mode (testing mode caps at 100 users).
- **Alternatives considered**: Auth.js (maintenance-mode beta; identity in the
  wrong tier); hand-rolled OAuth + sessions (runner-up; more security work);
  hosted identity (Clerk allow lists are paid, Supabase free tier pauses,
  Firebase sessions top out near 14 days, plus lock-in).
- **Sources**: better-auth.com/docs/integrations/fastify,
  better-auth.com/docs/concepts/session-management,
  better-auth.com/docs/concepts/database, better-auth.com/docs/plugins/magic-link,
  better-auth.com/docs/reference/security, better-auth.com/blog/better-auth-joins-vercel,
  better-auth.com/blog/security-update-june-2026,
  better-auth.com/blog/authjs-joins-better-auth, lucia-auth.com,
  support.google.com/cloud/answer/13463073.

## R5. Tenant isolation

- **Decision**: three layers. See [ADR 0004](../../docs/adr/0004-tenant-isolation.md).
  1. Every data-access function requires a workspace id taken from the session;
     cross-workspace access returns "not found".
  2. Postgres row-level security with `FORCE`, using a per-transaction
     `app.workspace_id` setting; fails closed when the setting is absent.
  3. Composite foreign keys `(workspace_id, x_id)` so a row cannot reference
     another workspace's row. Postgres foreign-key checks bypass row-level
     security, so only this layer enforces cross-tenant referential integrity.
- **Roles**: a migration role owns the tables; the application role is not the
  owner, not superuser, and `NOBYPASSRLS`, with DML grants only.
- **Render Postgres check** *(unverified)*: confirm the default database user can
  create a separate non-owner `NOBYPASSRLS` application role and grant it DML
  only. If it cannot, isolation layers 1 and 3 still hold and layer 2 needs a
  provider change; this is the first implementation task.
- **Tests**: integration tests run **as the application role** (a superuser
  silently bypasses row-level security); a catalog test checks every table with
  `workspace_id` has row-level security forced and policies present; a route
  registry test fails if any route lacks a cross-tenant test entry.
- **Alternatives considered**: application scoping only (one missed filter
  leaks); row-level security only (errors look like empty results; foreign keys
  still cross tenants).
- **Sources**: postgresql.org/docs/current/ddl-rowsecurity.html,
  orm.drizzle.team/docs/rls.

## R6. Data access and migrations

- **Decision**: **Drizzle ORM, version pinned (0.45.x)**, SQL migrations
  generated then reviewed and hand-edited; row-level security, `FORCE`, grants,
  and roles in custom SQL migrations; migrations run from GitHub Actions before the Render deploy hook,
  under the migration role. See [ADR 0005](../../docs/adr/0005-data-access-and-migrations.md).
- **Rationale**: types from a TypeScript schema, composite foreign keys, policy
  support, reviewable SQL for expand/contract (FR-026).
- **Risk**: Drizzle 1.0 (release candidate) changes the migration folder layout;
  the upgrade is planned as its own task later.
- **Alternatives considered**: Kysely (close second; most SQL control);
  Prisma (7 → 8 rewrite in progress; row-level security pattern awkward);
  MikroORM (heaviest); raw SQL generators (dormant or early access).
- **Sources**: npmjs.com/package/drizzle-orm, orm.drizzle.team/docs/v0-v1-changes,
  prisma.io/docs/orm/release-status, mikro-orm.io/blog/mikro-orm-7-released.

## R7. Offline and sync readiness

- **Decision**: read-only offline now; data rules that keep offline editing open.
  See [ADR 0006](../../docs/adr/0006-offline-and-sync-readiness.md).
  - App shell cached by a service worker (Serwist for Turbopack).
  - Workspace data held in the client query cache, persisted to IndexedDB,
    keyed by account and workspace, wiped on sign-out and on 401.
  - Offline-capable screens are static shells that fetch data in the browser.
  - "As of" time from the cache's last successful update; one read-only flag
    disables every edit control and blocks mutations at the data layer.
- **Rules from day one** (every table): client-generated UUIDv7 primary key,
  `workspace_id`, `created_at`, `updated_at`, `version`, `deleted_at`;
  idempotency key on mutating endpoints; field-level updates; instants in UTC
  and days as dates plus the workspace time zone; one client data layer.
- **Future path**: an outbox of mutations against our own API with per-field
  last-write-wins and versions; PowerSync if a sync engine is ever needed.
- **iOS caveats**: Safari deletes script storage after 7 days of use without
  visiting the site unless installed to the Home Screen; an installed web app
  has its own storage and must sign in again *(reported, verify on device)*.
- **Alternatives considered**: Zero (no offline writes), Electric (hosted
  service shut down after acquisition), Replicache (maintenance mode),
  LiveStore (beta), Triplit (orphaned), InstantDB (replaces the API), CRDTs
  (overkill for structured rows).
- **Sources**: nextjs.org/docs/app/guides/progressive-web-apps,
  serwist.pages.dev/docs/next/turbo, tanstack.com/query/latest/docs/framework/react/plugins/createPersister,
  webkit.org/tracking-prevention, webkit.org/blog/14403/updates-to-storage-policy,
  docs.powersync.com, zero.rocicorp.dev/docs/offline,
  electric.ax/blog/2026/08/11/electric-joining-databricks.

## R8. API contract between the repositories

- **Decision**: route schemas in **TypeBox**; OpenAPI generated by
  `@fastify/swagger` and committed as `openapi.json` in the backend; backend CI
  fails if the generated file differs and runs a breaking-change check
  (oasdiff); the frontend pins a published spec version and generates its
  client with **orval** (owner choice): TanStack Query hooks and types, all
  calls through one custom mutator; frontend CI fails if regenerated code
  differs. See [ADR 0007](../../docs/adr/0007-api-contract.md).
- **Why orval fits**: it generates TanStack Query hooks, the same cache used
  for offline persistence (R7), and its custom mutator is a single place for
  credentials, idempotency keys, and the offline read-only guard.
- **Alternatives considered**: `openapi-typescript` + `openapi-fetch` (first
  proposal; types only); Zod type provider (extra conversion layer); hey-api
  (0.x churn).
- **Sources**: github.com/fastify/fastify-type-provider-typebox,
  github.com/oasdiff/oasdiff-action, orval.dev *(orval version not re-checked)*.

## R9. Test stack

- **Decision**:
  - Backend: Vitest 4, `fastify.inject`, Testcontainers Postgres (same locally
    and in CI), template database per worker, a fresh account and workspace per
    test, a fake Google verifier / test-utilities session.
  - Frontend: Vitest + Testing Library for components; Playwright end-to-end
    with a 390×844 project beside desktop, against a seeded staging-like API.
  - Post-deploy smoke: Playwright against the deployed environment (sign-in via
    staging test sign-in on staging; health and settings round-trip in
    production with a dedicated smoke account).
- **Alternatives considered**: `node:test` (fewer features); CI service
  containers (no local parity); per-test transaction rollback (conflicts with
  per-request transactions).
- **Sources**: voidzero.dev/posts/announcing-vitest-4,
  node.testcontainers.org/modules/postgresql.

## R10. Runtime versions

- **Decision**: Node.js 24 LTS for both repos; Fastify 5; Next.js 16 and React 19
  (already in use); PostgreSQL on Render (latest version Render offers; *version unverified*).

## Owner Decisions (2026-10-04)

- Frontend host: Vercel, Hobby → Pro before commercial use.
- Domain: `life.bystan.tech` (staging `life-staging.bystan.tech`).
- Dumps: Cloudflare R2.
- API host: Render Free (staging and production); database: Render Postgres.
- API client: orval.
- The 001 prototype screens are removed from the deployed app.
