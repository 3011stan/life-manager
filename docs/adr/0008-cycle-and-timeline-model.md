# ADR 0008: One Cycle Table, Derived Scores, Fractional Order

**Status**: Accepted (2026-10-18, delegated by the owner)
**Feature**: `003-daily-timeline` — evidence in research R1–R7, R12

## Decision

- Every horizon (day, week, month, year, 5, 10, 20 years) is a row of one
  `cycle` table, created lazily on first write, unique per workspace, horizon,
  and computed start date. Day-only fields are nullable columns.
- Scores, objective progress, contributions, and carry candidates are computed
  on read by pure domain functions in the API. A close stores only a snapshot
  of what it showed; reopening drops it.
- Entries, objectives, and catalog items are ordered by fractional index keys,
  so a move is a single-field change compatible with field-level
  last-write-wins.
- Segments are a validated JSON array on the entry (and on the activity as
  defaults), edited as one field.
- Close-before-plan gates (Rule Zero, cycle close) are enforced by the API and
  reported in read responses so the client can explain them.

## Consequences

- One close flow, one isolation test per table, no materialized progress to
  go stale (001 F7).
- Aggregation runs per request; fine at the expected 15 entries per day and
  tens of objectives. Revisit if a screen exceeds 300 ms on the server.
- Segments cannot carry their own status or links without a migration to a
  table.

## Rejected

Separate day and cycle tables; materialized progress; integer positions;
client-side scoring.
