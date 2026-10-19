# Research: Daily Timeline, Activities, And Objectives

**Feature**: `003-daily-timeline` | **Date**: 2026-10-18

Decisions are taken by the agent under the owner's delegation of 2026-10-18
(plan, ADRs, and tasks without a separate approval gate). Each one states what
would make it wrong.

## R1. One cycle table for every horizon

**Decision**: a single `cycle` row per (workspace, horizon, start date), with
horizon in `day`, `week`, `month`, `year`, `y5`, `y10`, `y20`. Day-only fields
(capacity, capture text, check-in) are nullable columns. Rows are created
lazily, on the first write that needs them (FR-007).

**Rationale**: close state, notes, carries, and "close before planning the
next" (FR-025, FR-039) are the same rule at every horizon; one table means one
close implementation and one isolation test. Cycle boundaries are computed, not
edited, so storing them is only a cache with a uniqueness rule.

**Alternatives**: a `day` table plus a `cycle` table (two close paths); no
stored cycles, close state on objectives (no place for day capture or notes).

**Wrong if**: day-specific data grows enough to make the row sparse and
confusing; then split `day_detail` out by an expand/contract migration.

## R2. Cycle boundaries

**Decision**: pure functions in the API (`src/domain/cycles.ts`) over calendar
dates (`YYYY-MM-DD`, no time zone):

- day: the date;
- week: starts on the settings week start day (default Sunday), 7 days;
- month and year: calendar;
- y5, y10, y20: consecutive blocks starting at `long_horizon_start_year`
  (new setting, default the current year at first use).

A week belongs to the month holding at least four of its days. "Today" is the
current date in the workspace time zone, computed with `Intl.DateTimeFormat`;
no date library.

**Rationale**: calendar dates are time-zone free by construction (ADR 0006
"calendar days stored as dates"). `Intl` is in Node 24 and every target
browser.

**Alternatives**: Temporal (not yet in every target browser), date-fns-tz
(dependency for what `Intl` covers).

## R3. Entry order

**Decision**: fractional index keys (`order_key` text, base-62, via the
`fractional-indexing` package, both repos). Moving an entry changes only its
own key.

**Rationale**: field-level last-write-wins (FR-047) needs a reorder to be a
single-field change; renumbering every row would make two devices' reorders
overwrite each other.

**Alternatives**: integer positions (rewrite many rows), linked list (fragile
under concurrent edits).

## R4. Segments as a JSON field

**Decision**: an entry's segments (and an activity's default segments) are a
`jsonb` array of `{id, title, minutes, timeValue}`, validated by the API
schema and a database check on shape. The whole array is one field for
last-write-wins.

**Rationale**: segments are never queried alone; they are edited as a group
in the entry sheet; one field keeps PATCH simple and isolation automatic (same
row).

**Alternatives**: a `segment` table (one more tenant table, cross-row ordering
and LWW for no query benefit).

**Wrong if**: segments need their own status or objective links.

## R5. Field-level updates and freshness

**Decision**: every mutable resource is updated with `PATCH` carrying only the
changed fields; the server writes only those columns and increments
`version`. Clients refetch open screens every 15 seconds and on focus or
reconnect (TanStack Query `refetchInterval`, `refetchOnWindowFocus`), which
meets FR-046 (30 seconds). Mutations update the cache optimistically and roll
back on error.

**Alternatives**: server-sent events or WebSockets (a second connection type to
host and test on the Render free plan, for a 15-second gain).

## R6. Where scores and progress are computed

**Decision**: the API computes execution, alignment, and objective progress on
read, from stored entries, in pure functions under `src/domain/` that are unit
tested with hand-calculated tables (SC-006). Day totals that only sum minutes
(capacity left, useful/support) are also computed in the web app for instant
feedback, from the same rules.

A day close stores a snapshot of the scores it showed, so history stays
stable; a reopened day drops the snapshot (FR-024).

**Rationale**: one authoritative implementation for anything called a score
(constitution V, VIII); a handful of rows per day makes on-read aggregation
cheap at this scale.

**Alternatives**: materialized progress tables (staleness bugs, 001 F7);
client-side scoring (two implementations to keep equal).

## R7. Contributions and credit flow

**Decision**: an entry contributes to an objective when it is completed and
either its activity is one of the objective's activities or it has a manual
link (`entry_objective`). Count and duration progress of an objective includes
the contributions of its descendants (Q6), computed with a recursive query
over the parent chain (at most six levels). Contributions are not stored
except manual links.

**Rationale**: derived contributions follow renames, archives, and status
changes without a sync job.

## R8. Capture suggestions

**Decision**: deterministic parser in the web app (`src/lib/capture/`), unit
tested with Portuguese and English lines; suggestions are not stored, only the
capture text (on the day). The parser receives the activity catalog to link
known activities (FR-043). Rules: `19h`, `19:30`, `às 7`, `7pm`, `at 7` are
start times; `2h`, `2 h`, `90 min`, `1h30`, `umas 2h`, `about 2h` are
durations; a bare `Nh` after `às`/`at` is a start time, otherwise a duration.

**Rationale**: no server round-trip, works with the read-only offline copy for
viewing; the spec does not require suggestions to persist.

**Wrong if**: the owner wants pending suggestions on another device.

## R9. Interface language

**Decision**: a typed dictionary per locale (`src/lib/i18n/{pt-BR,en}.ts`) and
a small React provider; no routing by locale. The locale lives in a new
workspace setting `locale` (`pt-BR` or `en`; default from the browser on first
use). The Markdown export receives the locale.

**Rationale**: two locales and client-rendered screens do not need a
framework; a missing key fails type checking (SC-010).

**Alternatives**: next-intl (routing and server components the app does not
use).

## R10. Reordering on touch

**Decision**: `@dnd-kit/core` + `@dnd-kit/sortable` with pointer, touch, and
keyboard sensors and a 44 px drag handle; "Move up/down" stays in the entry
menu as a fallback.

**Rationale**: 001 F3: HTML5 drag-and-drop does not work on touch screens.

## R11. Default catalog and the owner's seed

**Decision**: generic defaults (no personal data) live in the API source and
are inserted when a workspace is created, and lazily for existing workspaces
(`catalog_seeded_at` on settings). The owner's personal catalog, templates,
and 2026 annual objectives are loaded by `scripts/seed-workspace.ts`, which
reads a JSON file from outside the repository and writes into one workspace,
by email, as the migration role with the tenant setting applied. The JSON
file lives in `~/.config/life-manager/` and is never committed.

**Rationale**: constitution "repository MUST stay publishable"; the public
repository must not hold the owner's life.

## R12. Rule Zero and cycle-close gates

**Decision**: the API refuses to create a **planned** entry on today (in the
workspace time zone) (409, `type: .../close-required`, with the date to close)
when the most recent earlier day that has entries is not closed. Planning
other days (tomorrow, or fixing a past day) is not gated, as FR-025 names
today only. The same rule applies to objectives
of a cycle when the previous ended cycle of that horizon is not closed.
Unplanned logs, capture, and edits of existing entries are always allowed.

**Rationale**: enforced where it cannot be bypassed by a second client; the
web app reads the same information from the day response to show the prompt
before the user tries.

**Edge**: the first day ever has no earlier day, so nothing is required.
Copying entries into today counts as planning and is gated the same way.

## R13. Carry mechanics

**Decision**: closing a day writes carry decisions; a confirmed carry creates
the new entry in the next day immediately (with `carried_from_entry_id`) and
reopens that day if it was closed. Objective carries create the objective in
the next cycle of the same horizon with `carried_from_objective_id`.

## R14. Performance at the beta scale

Expected volume: about 15 entries per day, 30 objectives active, one user.
Every screen needs one request (day bundle: cycle, entries, week essentials,
gates). No pagination in this feature except export streaming as in 002.
