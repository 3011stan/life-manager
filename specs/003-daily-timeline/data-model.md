# Data Model: Daily Timeline, Activities, And Objectives

**Feature**: `003-daily-timeline` | **Date**: 2026-10-18
**Sources**: [spec.md](spec.md), [research.md](research.md), ADRs 0004, 0006, 0008

Logical model. Every table below is workspace data and follows the 002
conventions: UUIDv7 `id` (client may generate), `workspace_id` in every foreign
key as `(workspace_id, x_id)`, `created_at`, `updated_at`, `version`,
`deleted_at`, forced row-level security on `app.workspace_id`, unique
constraints including `workspace_id`. "Deleted" below means `deleted_at` set;
reads exclude such rows.

## Workspace Settings (changed)

New fields:

| Field | Rules | Default |
|---|---|---|
| `locale` | `pt-BR` or `en` | From `Accept-Language` on first read; `pt-BR` |
| `long_horizon_start_year` | Integer 2000–2100 | Current year in the workspace time zone at first read |
| `catalog_seeded_at` | Timestamp or null | Set when the generic catalog is inserted |

## Pillar

| Field | Rules |
|---|---|
| `name` | 1–60 chars; unique per workspace among non-deleted |
| `order_key` | Fractional index |
| `archived_at` | Null or timestamp |

## Area

| Field | Rules |
|---|---|
| `pillar_id` | Pillar of the same workspace |
| `name` | 1–60 chars; unique per pillar |
| `order_key`, `archived_at` | As pillar |

## Tag

| Field | Rules |
|---|---|
| `name` | 1–40 chars; unique per workspace |
| `archived_at` | |

## Activity

| Field | Rules |
|---|---|
| `name` | 1–80 chars; unique per workspace among non-archived |
| `area_id` | Required; area of the same workspace |
| `default_minutes` | Integer 0–1440; default 30 |
| `default_deep_work` | Boolean; default false |
| `default_is_time_block` | Boolean; default false |
| `default_time_value` | `useful` or `support`; default `useful` |
| `default_segments` | Segment array (below) or empty |
| `archived_at` | |

`activity_tag` links activities and tags: `(workspace_id, activity_id, tag_id)`.

**Delete rule** (FR-029): pillar, area, tag, and activity may be deleted only
when nothing references them (entries, objectives, areas, activities);
otherwise the API answers `409` with `type: .../in-use` and the client offers
archive.

## Cycle

| Field | Rules |
|---|---|
| `horizon` | `day`, `week`, `month`, `year`, `y5`, `y10`, `y20` |
| `start_date` | Date; must equal the computed start of its horizon (R2) |
| `end_date` | Date; computed, stored for queries |
| `capacity_minutes` | Day only; null = settings default; 0–1440 |
| `capture_text` | Day only; up to 10 000 chars |
| `check_in` | Day only; `{physicalEnergy, mentalEnergy, emotionalEnergy, satisfaction}` each 1–5 or null |
| `notes` | Up to 10 000 chars |
| `closed_at` | Null = open |
| `close_snapshot` | JSON written at close: scores and their inputs (day), objective final progress (others); null when open |

Unique `(workspace_id, horizon, start_date)`. Created on the first write that
needs it; reads of a missing cycle return a virtual open cycle without storing
it.

**State**: `open → closed` (close) and `closed → open` (any change to the
cycle's entries or objectives, or a carry arriving). Reopening clears
`closed_at` and `close_snapshot`.

## Entry

| Field | Rules |
|---|---|
| `cycle_id` | A `day` cycle of the same workspace |
| `title` | 1–200 chars; when an activity is chosen, the activity name is shown and `title` keeps what was typed |
| `activity_id` | Optional |
| `order_key` | Fractional index within the day |
| `start_time` | Optional `HH:MM` |
| `planned_minutes` | 0–1440; equals Σ segment minutes when segments exist |
| `actual_minutes` | 0–1440 or null; null while planned |
| `status` | `planned`, `completed`, `skipped`, `cancelled` |
| `is_unplanned` | Boolean; true only with status `completed`; such entries have `planned_minutes` 0 |
| `is_time_block` | Boolean |
| `time_value` | `useful` or `support` |
| `deep_work` | Boolean |
| `segments` | Segment array |
| `notes` | Up to 10 000 chars |
| `carried_from_entry_id` | Optional entry of the same workspace |

Segment (JSON, in entries and activities): `{id: uuid, title: 1–120 chars,
minutes: 1–1440, timeValue: useful|support}`, at most 20 per array, order as
stored.

**Status rules** (FR-009): `completed` requires `actual_minutes` (defaults to
`planned_minutes` when omitted); `skipped` and `cancelled` set
`actual_minutes = 0`; back to `planned` sets it to null.

**Display name**: activity name if `activity_id` is set, else `title`.
"No activity" mark: `activity_id` null and `is_time_block` false.

## Entry Objective (manual link)

`(workspace_id, entry_id, objective_id)` primary key; `weight` integer default
1 (Q5, not editable yet).

## Objective

| Field | Rules |
|---|---|
| `cycle_id` | A non-day cycle |
| `title` | 1–200 chars |
| `tier` | `essential`, `secondary`, `parked` |
| `order_key` | Within the cycle and tier |
| `target_type` | `count`, `duration`, `value`, `level`, `milestone`, `composite` |
| `target_count` | count: integer ≥ 1 |
| `target_minutes` | duration: integer ≥ 1 |
| `unit`, `start_value`, `target_value`, `is_cumulative` | value: unit 1–20 chars; numbers with up to 2 decimals |
| `level_scale` | level: ordered list of 2–20 labels |
| `target_level` | level: one of `level_scale` |
| `milestone_entry_id` | milestone: optional entry |
| `done_at` | milestone: set when marked done by hand |
| `parent_objective_id` | Optional; an objective in a strictly higher horizon whose cycle contains this one's cycle |
| `status` | `active`, `done`, `carried`, `dropped` |
| `carried_from_objective_id` | Optional |
| `checkpoint` | Long horizons: last annual checkpoint `{year, relevant, onTrack, note}` |

`objective_activity`: `(workspace_id, objective_id, activity_id)`.

**Progress** (FR-033, computed on read, 0–∞, shown capped at 100%):

| Type | Progress |
|---|---|
| count | contributing completed entries in the cycle and descendants ÷ `target_count` |
| duration | Σ actual minutes of the same ÷ `target_minutes` |
| value | (current − start) ÷ (target − start), where current = latest measurement, or start + Σ measurements when cumulative |
| level | index(latest level) ÷ index(`target_level`), using the scale order |
| milestone | 1 when `done_at` set or the milestone entry is completed, else 0 |
| composite | mean over children of min(child progress, 1); 0 without children |

Contributing entry (R7): completed, not deleted, not a time block, in the
objective's cycle date range, and either its activity is in
`objective_activity` or it has an `entry_objective` link to this objective or
to a descendant.

Pace: share of the cycle elapsed = (today − start + 1) ÷ length, clamped 0–1.

## Measurement

| Field | Rules |
|---|---|
| `objective_id` | A `value` or `level` objective |
| `recorded_on` | Date |
| `value` | Number (value) |
| `level` | Label from the scale (level) |
| `note` | Optional |

## Objective Template

| Field | Rules |
|---|---|
| `title`, `tier`, `target_type`, targets as objective (count or duration only in this feature) | |
| `activity_ids` | Via `objective_template_activity` |
| `order_key`, `archived_at` | |

Applied only to weeks; acceptance copies it into a new objective.

## Carry Decision

| Field | Rules |
|---|---|
| `cycle_id` | The cycle being closed |
| `source_entry_id` or `source_objective_id` | Exactly one |
| `decision` | `confirmed`, `dismissed` |
| `edited_title`, `edited_minutes` | Optional edits (entry carries) |
| `created_entry_id` / `created_objective_id` | Set when confirmed |

Unique per source. Candidates are computed; only decisions are stored.

## Scores (computed, FR-019, FR-020)

Over the day's non-deleted entries:

- **Work** = not time block, status ≠ cancelled.
- **Execution** = Σ min(actual, planned) ÷ Σ planned over work with
  `is_unplanned = false`; null ("no planned work") when Σ planned = 0.
- **Alignment** = Σ actual over work contributing to ≥ 1 active objective
  whose cycle contains the day ÷ Σ actual over work; null ("no work recorded")
  when Σ actual = 0.
- **Day totals**: capacity, planned (all non-cancelled entries including time
  blocks), remaining = capacity − planned, useful and support minutes (segment
  level when segments exist), deep work actual minutes.

## Relationships

```
Pillar 1─* Area 1─* Activity *─* Tag
Cycle(day) 1─* Entry *─0..1 Activity
Entry *─* Objective            (manual links)
Cycle(week..y20) 1─* Objective *─* Activity
Objective 0..1─* Objective     (parent → children)
Objective 1─* Measurement
Cycle 1─* Carry Decision
Entry 0..1─* Entry             (carried from)
Objective 0..1─* Objective     (carried from)
Objective Template *─* Activity
```

## Export (formatVersion 2)

Adds `catalog` (pillars, areas, tags, activities), `cycles` (with entries,
objectives, measurements, carry decisions, snapshots), and
`objectiveTemplates`. Version 1 fields are unchanged. Detailed in
`backend/docs/export-format.md`.

## Account Deletion

Every table above cascades from the workspace, as in 002.
