# ADR 0001: Storage Model

**Status**: Accepted (2026-10-04)
**Feature**: `002-cloud-foundation`
**Deciders**: project owner

## Context

Life Manager moves from a single-machine Obsidian vault and a localStorage
prototype to a hosted product used from phone and desktop, intended to be sold
and published as open source. The storage model must satisfy:

- Constitution VI: every business record belongs to one workspace; isolation is
  enforced by the service and proven by tests.
- Constitution VII: complete export as documented machine-readable data **and**
  Markdown; nothing lost silently; backups with tested restore; schema changes
  that keep the deployed app working.
- Discovery Q20: referential integrity. Real use showed what happens without
  it: 43 of 93 activity ids on tasks missing from the catalog, drifted
  taxonomy, 25–30% malformed goal links.
- Discovery decisions: cycles from day to 20 years, objectives chained across
  horizons with weighted many-to-many contributions, automatic progress and
  rollups, recurrence rules, carries with origin references.
- Spec 002: same data on several devices, read-only offline now, offline
  editing not ruled out.

## Options

| Criterion | Relational (PostgreSQL) | Document store | Markdown files as primary store | Hybrid: relational + Markdown export |
|---|---|---|---|---|
| Multi-device access | Yes | Yes | Needs a sync layer (git, object storage); conflicts are file-level | Yes |
| Tenant isolation | Row scoping, optional row-level security in the database | Per-collection scoping in the app; no database-level enforcement in most products | Per-folder; enforced only by the app | Same as relational |
| Referential integrity | Enforced by foreign keys, including tenant-scoped keys | Application-enforced | None; the Obsidian drift is the evidence | Enforced |
| Rollups and aggregates (scores, progress across horizons, contributions) | Native (joins, aggregates, recursive queries) | Possible; awkward for many-to-many graphs | Requires loading and parsing files | Native |
| Concurrent edits from two devices | Row-level, transactional | Document-level | File-level conflicts | Row-level |
| Schema evolution without breaking the deployed app | Mature migration practice (expand/contract) | Schemaless; drift moves into the code | Drift is invisible (as observed) | Mature |
| Portability and ownership | Through export | Through export | Native | Export in JSON + Markdown guaranteed by spec |
| Path to offline editing | Supported by several Postgres sync engines and by outbox patterns | Supported by some document stores | Possible through git-like sync; weak for structured data | Same as relational |
| Operating cost and maturity | Widely available managed offerings | Widely available | Cheap storage; custom tooling | Same as relational |

## Decision

Use a **relational database (PostgreSQL) as the single source of truth**, with
the Markdown and JSON export required by constitution VII generated from it.
Markdown is an output format, not a storage format.

## Consequences

- The domain model (003) is designed as related tables with tenant-scoped
  foreign keys; vocabularies (activities, taxonomy, objectives) are rows the
  user picks from, which prevents the drift seen in Obsidian.
- Export must be designed and tested as a feature (002 FR-017, FR-018), since
  ownership no longer comes for free from plain files.
- Obsidian import (later feature) maps drifted vocabularies to canonical rows.
- Postgres keeps both the database-level isolation option (row-level security)
  and the main local-first sync engines open for future offline editing.

## Rejected

- **Document store**: no advantage for a graph of objectives, contributions, and
  cycles; integrity would live only in application code.
- **Markdown files as primary store**: recreates the single-machine and drift
  problems the hosted product exists to solve; querying and isolation become
  custom infrastructure.
- **Two-way sync between the database and a Markdown vault**: doubles the
  sources of truth; may be reconsidered later as an export target, not as
  storage.
