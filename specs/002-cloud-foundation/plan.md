# Implementation Plan: Cloud Foundation

**Branch**: `002-cloud-foundation` | **Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-cloud-foundation/spec.md`

**Status**: Phase 0 complete; ADRs 0001–0007 accepted (2026-10-04). Phase 1 next.

## Summary

Deliver a deployed walking skeleton: Google sign-in restricted by an allow list,
one personal workspace per account, workspace settings readable and editable on
any device and readable offline, full export (JSON and Markdown), account
deletion, and a verified release path with backups and restore drills. A Fastify
API in its own repository serves a Next.js web app in this repository; both
deploy independently. Tenant isolation is enforced in three layers (application
scoping, forced row-level security, composite foreign keys) and proven by tests.

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js 24 LTS (both repositories)

**Primary Dependencies**:
- API: Fastify 5, Better Auth (core + Google), Drizzle ORM 0.45.x (pinned),
  TypeBox type provider, `@fastify/swagger`, `@fastify/cors`, `@fastify/cookie`.
- Web app: Next.js 16, React 19, TanStack Query with IndexedDB persistence,
  Serwist (service worker), orval-generated client (TanStack Query hooks).

**Storage**: PostgreSQL on Render Postgres (Virginia); IndexedDB on the device for the
read-only offline copy.

**Testing**: Vitest 4 in both repositories; `fastify.inject` and Testcontainers
Postgres in the API; Testing Library and Playwright (desktop and 390×844) in the
web app; oasdiff and generated-file diffs for the contract.

**Target Platform**: API as a Docker web service on Render (Virginia, Free plan);
web app on Vercel; domains `life.bystan.tech` and `api.life.bystan.tech`;
current iOS Safari, Android Chrome, desktop browsers.

**Project Type**: Web application in two repositories (web app + API).

**Performance Goals**: SC-001 (new user to workspace under 1 minute on a phone),
SC-002 (setting visible on a second device within 5 seconds of refresh), SC-004
(export under 1 minute).

**Constraints**: API and database in US east (about 110–130 ms from Brazil);
free-plan cold starts of about a minute after 15 minutes idle; cookie scoped to
`life.bystan.tech`; tenant context set per transaction; migrations run from
GitHub Actions before the Render deploy hook; read-only offline; near-zero
cost at 0–10 users (production database about US$6/month).

**Scale/Scope**: up to 10 accounts in this feature; one resource (workspace
settings) plus identity, export, and deletion.

## Constitution Check

*Gate before Phase 0 and again after Phase 1.* Constitution v2.0.0.

| Principle | Status | Evidence |
|---|---|---|
| I. Cycles Before Lists | N/A | No cycle data in this feature; week start setting prepares cycles. |
| II. Human Authorship Before Automation | Pass | Account deletion requires explicit confirmation (FR-019); nothing is created on the user's behalf except the empty workspace. |
| III. Time Is The Primary Planning Unit | Pass | Daily capacity stored in minutes (FR-011). |
| IV. Mobile-First Daily Operation | Pass | SC-009 (390px), offline read on the phone (FR-016), Playwright 390×844 project. |
| V. Scores As Feedback | N/A | No scores in this feature. |
| VI. Tenant Isolation | Pass | ADR 0004: three layers; catalog test; route registry cross-tenant tests run as the application role (FR-007–FR-010, FR-028). |
| VII. Data Ownership, Durability, Portability | Pass | JSON + Markdown export (FR-017, FR-018); deletion (FR-019, FR-020); nightly dumps kept 30 days and restore drill (FR-021, FR-022); expand/contract migrations (FR-026, ADR 0005). |
| VIII. Evidence-Based Delivery | Pass | Deploys gated on green CI for the exact commit; post-deploy smoke (FR-024, FR-025); verification report required at close. |
| Product Boundaries | Pass | Personal workspaces only; managed services justified in ADRs 0002–0003; secrets in platform secret stores, never committed; external input untrusted (Origin checks, schema validation). |

**Result**: no violations; Complexity Tracking not needed.

**Post-design re-check (Phase 1)**: still passes. Data model applies the
ADR 0004 and ADR 0006 conventions to every workspace table; identity tables are
global and reachable only through the auth layer; security events hold no
workspace content. One spec tension found: FR-025 asks for a sign-in round-trip
smoke after every release, which cannot be automated in production (Google
sign-in; no test sign-in in production). Resolved: FR-025 amended (owner,
2026-10-04) — full round-trip on staging with the same commit, reduced smoke in
production.

## Project Structure

### Documentation (this feature, in `cloud-stanos`)

```text
specs/002-cloud-foundation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 (after ADR approval)
├── quickstart.md        # Phase 1 (after ADR approval)
├── contracts/           # Phase 1 (after ADR approval)
└── tasks.md             # Phase 2 ($speckit-tasks)

docs/adr/0001–0007       # Long-lived decisions for this feature
```

### Source Code

```text
life-manager-backend/                 # separate repository
├── src/
│   ├── app.ts                        # Fastify app factory (used by server and tests)
│   ├── server.ts                     # process entry point
│   ├── config/                       # environment parsing and validation
│   ├── plugins/                      # auth, tenant context, origin checks, cors, swagger
│   ├── modules/
│   │   ├── account/                  # me, deletion, security events
│   │   ├── workspace/                # workspace creation on first sign-in
│   │   ├── settings/                 # workspace settings resource
│   │   └── export/                   # JSON and Markdown export
│   └── db/
│       ├── schema/                   # Drizzle schema
│       └── migrations/               # reviewed SQL migrations
├── test/
│   ├── unit/
│   ├── integration/                  # Testcontainers, runs as application role
│   └── isolation/                    # catalog test and route registry cross-tenant tests
├── scripts/                          # openapi generation, backup dump, restore drill
├── openapi.json                      # committed contract
├── Dockerfile
├── render.yaml
├── AGENTS.md
└── .github/workflows/                # ci, deploy-staging, deploy-production, backup, restore-drill

cloud-stanos/                         # this repository (web app)
├── src/
│   ├── app/                          # sign-in, settings, export, account pages; offline shell
│   ├── lib/api/                      # generated schema types and the single data layer
│   └── lib/offline/                  # persistence, connectivity, read-only flag
├── e2e/                              # Playwright (desktop and 390×844), smoke suite
└── .github/workflows/                # ci, contract check, deploy
```

**Structure Decision**: two repositories as defined in `docs/development-flow.md`;
the API owns identity, tenancy, and persistence; the web app is a client of the
published contract. The 001 prototype screens are removed from the deployed app
(owner decision); they remain in git history.

## Owner Decisions (2026-10-04)

Recorded in [research.md](research.md#owner-decisions-2026-10-04) and ADR 0002:
Vercel; `life.bystan.tech`; Render Free + Render Postgres; Cloudflare R2 dumps;
orval; prototype screens removed from the deployed app.

## Complexity Tracking

Not needed: no constitution violations.
