# ADR 0006: Offline Read-Only Now, Sync-Ready Data

**Status**: Accepted (2026-10-04)
**Feature**: `002-cloud-foundation` (FR-016, FR-016a) — evidence in research R7

## Decision

Now:

- Service worker caches the app shell; offline-capable screens are static
  shells that load data in the browser.
- Workspace data lives in the client query cache persisted to IndexedDB, keyed
  by account and workspace, wiped on sign-out and on an unauthorized response.
- The UI shows "offline, data as of <time>"; one read-only flag disables edit
  controls and blocks mutations in the client data layer.

Data rules for every table and endpoint from the first migration:

- Client-generated UUIDv7 primary key; `workspace_id`; `created_at`,
  `updated_at`, `version`, `deleted_at`.
- Mutating endpoints accept an idempotency key; updates are field-level.
- Instants stored in UTC; calendar days stored as dates plus the workspace time
  zone.
- All client reads and writes go through one data-layer module.

Later (not in this feature): a mutation outbox with per-field last-write-wins
and versions against our API; PowerSync if a sync engine becomes necessary.

## Consequences

- iOS: storage can be cleared after 7 days without use unless installed to the
  Home Screen, and the installed app needs its own sign-in (to verify on a
  device).

## Rejected

Zero, Electric, Replicache, LiveStore, Triplit, InstantDB, CRDTs (research R7).
