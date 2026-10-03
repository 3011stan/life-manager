# Data Model: Daily Timeline Prototype

## DailyCycle

Represents one date-specific Life Manager cycle.

Fields:

- `date`: ISO date string for the local day.
- `items`: ordered list of `TimelineItem`.
- `freeformText`: text captured during the day.
- `freeformSuggestions`: list of pending `FreeformSuggestion`.
- `closeSummary`: optional `DailyCloseSummary`.
- `updatedAt`: ISO timestamp.

Validation:

- `date` is required.
- Each date has at most one active daily cycle in local persistence.
- Items must have unique IDs within the cycle.

## TimelineItem

Represents a visible row in the daily timeline.

Fields:

- `id`: stable local ID.
- `kind`: `simple` or `bundle`.
- `title`: user-facing label.
- `status`: `planned`, `completed`, `partial`, `skipped`, or `cancelled`.
- `plannedMinutes`: planned duration.
- `actualMinutes`: optional actual duration.
- `plannedStart`: optional local time.
- `notes`: optional freeform notes.
- `isAlignmentRelevant`: whether the item counts toward alignment score.
- `isDeepWork`: whether the item counts as deep work.
- `segments`: ordered list of `BundleSegment` for bundle items.
- `createdAt`: ISO timestamp.
- `updatedAt`: ISO timestamp.

Validation:

- `title` is required.
- `plannedMinutes` cannot be negative.
- `actualMinutes` cannot be negative when provided.
- `segments` must be empty for simple items.
- `segments` must contain at least one segment for bundle items.
- A cancelled item is excluded from score denominators.

## BundleSegment

Represents a child part of a task bundle.

Fields:

- `id`: stable local ID.
- `title`: segment label.
- `minutes`: segment duration.
- `timeValue`: `useful` or `non-useful`.

Validation:

- `title` is required.
- `minutes` must be greater than zero.
- `timeValue` is required.

Derived values:

- Bundle planned minutes equals the sum of segment minutes.
- Bundle useful minutes equals the sum of useful segment minutes.
- Bundle non-useful minutes equals the sum of non-useful segment minutes.

## FreeformSuggestion

Represents a proposed timeline item derived from freeform capture.

Fields:

- `id`: stable local ID.
- `sourceText`: original line or text fragment.
- `title`: proposed item title.
- `plannedMinutes`: optional inferred planned duration.
- `actualMinutes`: optional inferred actual duration.
- `status`: proposed status.
- `accepted`: boolean.

Validation:

- Suggestions are not final timeline items until accepted by the user.
- Dismissed suggestions must not be added to the timeline.

## DailyCloseSummary

Represents the result of closing a daily cycle.

Fields:

- `closedAt`: ISO timestamp.
- `executionScore`: number from 0 to 100.
- `alignmentScore`: number from 0 to 100.
- `plannedMinutes`: total planned minutes for non-cancelled items.
- `actualMinutes`: total actual minutes for non-cancelled items.
- `usefulMinutes`: total useful minutes from simple items and bundle segments.
- `nonUsefulMinutes`: total non-useful minutes from bundle segments.
- `deepWorkMinutes`: total actual or planned deep work minutes.
- `carryCandidates`: list of `CarryForwardCandidate`.
- `notes`: optional review notes.

Validation:

- Scores are calculated from visible item data.
- Cancelled items are excluded from score denominators.
- Extra actual minutes are visible but capped for score credit.

## CarryForwardCandidate

Represents a skipped or partial item that may be moved to a future cycle.

Fields:

- `id`: stable local ID.
- `sourceItemId`: originating timeline item.
- `title`: proposed carry title.
- `targetDate`: optional ISO date.
- `decision`: `pending`, `confirmed`, or `dismissed`.

Validation:

- A carry candidate requires user confirmation before becoming future planned work.

## State Transitions

Timeline item status:

```text
planned -> completed
planned -> partial
planned -> skipped
planned -> cancelled
partial -> completed
partial -> skipped
skipped -> planned
cancelled -> planned
```

Daily close:

```text
open -> reviewing -> closed
closed -> reviewing
```

Freeform suggestion:

```text
draft -> accepted
draft -> dismissed
accepted -> timeline item
```
