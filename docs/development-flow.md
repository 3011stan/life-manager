# Development Flow

How Life Manager (currently Cloud StanOS) is specified, built, verified, and
deployed. This document is the project's workflow; reusable procedures that
prove themselves here may later move to `stanrley-skills`.

Status: adopted 2026-10-03. Change it when real friction shows it is wrong, not
in anticipation.

## Repositories

| Repo | Holds |
|---|---|
| `cloud-stanos` (product + frontend) | Constitution, all specs (`specs/NNN-*`), discovery notes, ADRs, the OpenAPI contract, Next.js frontend |
| `life-manager-backend` | Fastify API source, migrations, backend tests, its own `AGENTS.md` |

- Every feature is specified once, here, even when it touches only the backend.
- The API contract (`contracts/` inside the feature spec, consolidated under
  `docs/api/` once it exists) is the seam between the repos.
- A feature that changes both repos uses the same branch name in both
  (`NNN-short-name`) and links the PRs to each other.
- The backend repo gets `AGENTS.md` when its walking skeleton is created
  (feature 002), not before.

## Where decisions live

| Decision kind | Artifact |
|---|---|
| Durable product/engineering invariants | `.specify/memory/constitution.md` |
| Business/domain behavior | `specs/NNN-*/spec.md` (Specify/Clarify) |
| Domain vocabulary and tentative entity maps | `docs/discovery/*.md` |
| Technical alternatives and reasoning | `specs/NNN-*/research.md`, `plan.md` |
| Long-lived architecture choices | `docs/adr/NNNN-*.md` |
| Data structures | `specs/NNN-*/data-model.md` |
| API shape | `specs/NNN-*/contracts/` |
| Commands, conventions, traps agents must know | `AGENTS.md` (per repo) |
| History, rejected approaches, gotchas, handoffs | ai-memory |

Database or schema work must never silently decide an open product question;
send it back to Specify/Clarify.

## Per-feature loop

| # | Phase | Answers | Output | Gate |
|---|---|---|---|---|
| 0 | Intent | Why, and what should be true afterwards | a few lines | — |
| 1 | Discovery (when the domain is unclear) | Vocabulary, rules, examples | `docs/discovery/*.md` | Glossary approved |
| 2 | Constitution check | Does this violate or need an invariant? | line in `plan.md`; amendment only if needed | — |
| 3 | Specify / Clarify | Behavior and acceptance scenarios, no technology | `spec.md` | No open clarifications |
| 4 | Plan / Research | Options compared against stated criteria | `plan.md`, `research.md`, ADRs | ADRs approved |
| 5 | Model / Contracts | Data and API shape | `data-model.md`, `contracts/` | Checked against spec |
| 6 | Tasks | Small, test-first steps with their own check | `tasks.md` | — |
| 7 | Implement | Red → green → refactor, one commit per task | code + tests | CI green |
| 8 | Verify | Evidence that the spec holds | `verification.md` | Verdict accepted |

Rules:

- Loops are expected. A problem found in a later phase goes back to the phase
  that owns it instead of being patched around.
- Before each major phase, state the phase, the questions it answers, and the
  artifacts expected to change.
- A checked task is not evidence. A feature is done when `verification.md`
  records commands run, results, failures, and known gaps, and the verdict is
  accepted.
- Significant product/architecture changes are shown before commit. Small
  infrastructure checkpoints are proposed explicitly.
- Kaizen (process retrospective) is deferred; it will be introduced later.

## Roadmap

| Order | Item | Notes |
|---|---|---|
| 1 | This flow | Adopted |
| 2 | Close `001-daily-timeline-prototype` | Close with documented gaps; F1, F2, F4, F6 carried into 004 |
| 3 | Constitution v2 | Hosted, authenticated, tenant-isolated, open-source-ready; data ownership and portability; testing and verification invariants. No vendor or library names |
| 4 | Domain discovery | Refine the draft model (Obsidian `briefing.md`, Obsidian `data-model.md`, POC types) into a glossary and entity map. No schema |
| 5 | `002-cloud-foundation` | Auth, storage, ORM/migrations, tenant isolation/RLS, hosting, test stack, CI/CD. Implemented as a deployed walking skeleton |
| 6 | `003-cycle-objective-model` | Cycles, objectives, contributions, weights, review cadence |
| 7 | `004-daily-timeline-cloud` | The POC daily loop on the backend, including editable carries (F4) and confirmed carries moving to the next day (F6) |
| 8 | `005-obsidian-import` | Import the Obsidian vault history; localStorage import is out of scope |

Numbers after 003 are tentative.

## Storage decision (to be made in 002)

Recorded as an ADR in `002-cloud-foundation`. Inputs: the constitution's
portability rule and the discovery entity map.

Options: relational (PostgreSQL), document store, Markdown files as primary
store, or a hybrid (relational source of truth + Markdown export/import).

Criteria: multi-device/mobile access, tenant isolation, aggregation queries
(scores, cycle rollups, objective contributions), concurrent edits from two
devices, self-hosting by open-source users, data portability, operating cost.

## Testing and conventions

- Invariants (domain rules have tests, tenant isolation has tests, features
  close with verification evidence) belong in the constitution.
- Tool choices (test runner, Fastify `inject` route tests, real Postgres in
  integration tests, Playwright end-to-end, OpenAPI generated from route
  schemas) are decided in 002 research.
- `docs/engineering/testing.md` is written after the 002 walking skeleton exists,
  from real examples.

## Deployment

Frontend and backend deploy independently.

- Environments: local (Postgres via Docker Compose) → staging → production.
  Frontend PR previews point at the staging API.
- CI per repo: lint, typecheck, unit, integration (real Postgres), build.
  End-to-end against staging.
- Backend release: migrations run as a release step before the new version
  takes traffic. Migrations follow expand/contract so the previous frontend
  keeps working.
- Order: backend first (backward-compatible), then frontend.
- Contract: the backend publishes OpenAPI; the frontend consumes generated
  types; frontend CI fails on contract drift.
- Domains: frontend and API on the same site (e.g. `app.<domain>` and
  `api.<domain>`) so auth cookies are first-party. Decide before the auth ADR.
- Vendors are chosen in 002 research. Criteria: cost at zero users, self-host
  story for open-source users, region near Brazil, operational effort.
