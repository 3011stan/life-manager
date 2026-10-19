# API Contract: Daily Timeline, Activities, And Objectives

**Feature**: `003-daily-timeline` | **Date**: 2026-10-18

Extends [002 contracts/api.md](../../002-cloud-foundation/contracts/api.md);
every cross-cutting rule there applies (session cookie, no workspace id in
paths, Origin and content-type checks, `Idempotency-Key` on mutations,
problem+json, foreign = not found = `404`). The generated `openapi.json` is
authoritative (ADR 0007).

Conventions in this feature:

- `POST` accepts a client-generated `id` (UUIDv7); a repeated `id` with the
  same body is a replay.
- `PATCH` takes only the changed fields and returns the full resource with
  its new `version` (field-level last write wins, R5).
- `DELETE` is a soft delete; resources in use answer `409`
  `type: https://life.bystan.tech/problems/in-use` with `detail` naming what
  uses them.
- Gate refusals answer `409` `type: https://life.bystan.tech/problems/close-required`
  with `cycle: {horizon, startDate}` to close (R12).
- Dates are `YYYY-MM-DD`; times `HH:MM`; minutes are integers.

## Settings (changed)

`GET/PATCH /v1/workspace/settings` gain `locale` (`pt-BR`|`en`) and
`longHorizonStartYear` (integer).

## Catalog

| Method | Path | Body / result |
|---|---|---|
| GET | `/v1/catalog` | `{pillars[], areas[], tags[], activities[]}` including archived, each with `archivedAt`; seeds the generic catalog on first call (R11) |
| POST | `/v1/pillars` | `{id, name}` |
| PATCH | `/v1/pillars/{id}` | `name`, `orderKey`, `archived` (bool) |
| DELETE | `/v1/pillars/{id}` | `204` or `409 in-use` |
| POST/PATCH/DELETE | `/v1/areas`, `/v1/areas/{id}` | `{id, pillarId, name}`; patch also `pillarId` |
| POST/PATCH/DELETE | `/v1/tags`, `/v1/tags/{id}` | `{id, name}` |
| POST | `/v1/activities` | `{id, name, areaId, tagIds?, defaultMinutes?, defaultDeepWork?, defaultIsTimeBlock?, defaultTimeValue?, defaultSegments?}` |
| PATCH/DELETE | `/v1/activities/{id}` | any field above, `archived` |

## Days and entries

`GET /v1/days/{date}` → `200`

```json
{
  "date": "2026-10-19",
  "today": "2026-10-19",
  "timeZone": "America/Sao_Paulo",
  "cycle": { "id": null, "capacityMinutes": 960, "captureText": "", "checkIn": null,
             "notes": "", "closedAt": null, "closeSnapshot": null, "version": 0 },
  "entries": [ { "id": "…", "title": "…", "activityId": "…", "orderKey": "a0",
                 "startTime": null, "plannedMinutes": 110, "actualMinutes": null,
                 "status": "planned", "isUnplanned": false, "isTimeBlock": false,
                 "timeValue": "useful", "deepWork": false,
                 "segments": [ { "id": "…", "title": "Train", "minutes": 60, "timeValue": "useful" } ],
                 "notes": "", "objectiveIds": [], "contributesTo": ["…"],
                 "carriedFromEntryId": null, "version": 1 } ],
  "totals": { "capacity": 960, "planned": 600, "remaining": 360, "useful": 420,
              "support": 180, "deepWorkActual": 0 },
  "scores": { "execution": null, "alignment": null },
  "closeRequired": { "horizon": "day", "startDate": "2026-10-18" },
  "weekEssentials": [ { "id": "…", "title": "Gym 4×", "progress": 0.5 } ]
}
```

- `cycle.id` null means the day is not stored (FR-007).
- `scores` are present only on closed days (from the snapshot); the close
  preview endpoint gives live values.
- `closeRequired` is null unless Rule Zero applies to this date.

| Method | Path | Body / result |
|---|---|---|
| PATCH | `/v1/days/{date}` | `capacityMinutes`, `captureText`, `checkIn`, `notes`; creates the cycle if needed |
| POST | `/v1/days/{date}/entries` | `{id, title, activityId?, orderKey?, startTime?, plannedMinutes?, status?, isUnplanned?, actualMinutes?, isTimeBlock?, timeValue?, deepWork?, segments?, notes?, objectiveIds?}`; missing fields default from the activity; `orderKey` defaults to the end; planned entries on today are gated (R12) |
| PATCH | `/v1/entries/{id}` | any field above plus `date` (move to another day) |
| DELETE | `/v1/entries/{id}` | `204` |
| POST | `/v1/days/{date}/copy` | `{fromDate, entryIds[]}` → new planned entries (gated like planned creation) |
| GET | `/v1/days/{date}/close` | close preview: `{unresolved[], scores, explanation: {execution[], alignment[]}, carryCandidates[]}` |
| POST | `/v1/days/{date}/close` | `{notes?, checkIn?, carries: [{entryId, decision, title?, plannedMinutes?}]}`; `422` if entries are still planned or a candidate has no decision |

Changing an entry of a closed day reopens it (R13); the response of the
change includes `cycleReopened: true`.

## Cycles and objectives

| Method | Path | Body / result |
|---|---|---|
| GET | `/v1/cycles/{horizon}/{startDate}` | cycle, objectives with `progress`, `pace`, children ids, `closeRequired`; `startDate` may be any date inside the cycle (normalized) |
| GET | `/v1/cycles/{horizon}/current` | same, for the cycle containing today |
| PATCH | `/v1/cycles/{horizon}/{startDate}` | `notes` |
| POST | `/v1/cycles/{horizon}/{startDate}/objectives` | `{id, title, tier, targetType, …targets, activityIds?, parentObjectiveId?}`; gated by the previous cycle close (FR-039) |
| PATCH/DELETE | `/v1/objectives/{id}` | any field; `markDone` (milestone) |
| POST | `/v1/objectives/{id}/measurements` | `{id, recordedOn, value?|level?, note?}` |
| DELETE | `/v1/measurements/{id}` | |
| GET | `/v1/cycles/{horizon}/{startDate}/close` | preview: objectives with final progress, unfinished list, long-horizon checkpoints (year) |
| POST | `/v1/cycles/{horizon}/{startDate}/close` | `{notes?, carries: [{objectiveId, decision}], checkpoints?: [{objectiveId, relevant, onTrack, note?}]}` |

## Templates

| Method | Path | Body / result |
|---|---|---|
| GET | `/v1/objective-templates` | list |
| POST/PATCH/DELETE | `/v1/objective-templates[/{id}]` | `{id, title, tier, targetType: count|duration, targetCount?, targetMinutes?, activityIds[]}` |
| GET | `/v1/cycles/week/{startDate}/template-proposals` | templates not yet applied to that week |
| POST | `/v1/cycles/week/{startDate}/apply-templates` | `{accept: [templateId], ids: [objectiveId]}` → created objectives |

## Export

`GET /v1/export?format=json|markdown` adds the new sections (formatVersion 2);
the Markdown labels follow `locale`.
