# Feature Specification: Daily Timeline Prototype

**Feature Branch**: `001-daily-timeline-prototype`

**Created**: 2026-09-03

**Status**: Draft

**Input**: User description: "Create the simple main Life Manager screen for Cloud StanOS. It should start with real dates, be mobile-first, use a daily timeline as the primary experience, support drag-and-drop ordering, task bundles with useful vs non-useful time, simple freeform capture, basic daily close, and local-only persistence for MVP testing."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Plan And Operate Today's Timeline (Priority: P1)

As the initial user, Stan opens Cloud StanOS and sees today's Life Manager cycle as
a timeline using the current local date. He can add tasks, routines, commitments,
or notes; reorder them; update status; and understand the shape of the day without
manually maintaining Markdown files.

**Why this priority**: The daily timeline is the main product surface and the
smallest independently useful slice of the Life Manager MVP.

**Independent Test**: Open the product, create or load today's cycle, add at least
three timeline items, reorder them, update one status, refresh the page, and verify
that the day still reflects the user's edits.

**Acceptance Scenarios**:

1. **Given** no data exists for the current date, **When** the user opens the
   product, **Then** the system shows a new daily cycle for today's local date.
2. **Given** the user has added several timeline items, **When** the user reorders
   them, **Then** the timeline preserves the new order and updates the visible day
   sequence.
3. **Given** a timeline item is planned, **When** the user marks it completed,
   partial, skipped, or cancelled, **Then** the item visibly reflects the selected
   status.
4. **Given** the user refreshes the page, **When** the same local date is opened,
   **Then** previously saved items, order, statuses, notes, and durations are still
   available in the same browser.

---

### User Story 2 - Use Task Bundles For Activities With Hidden Time (Priority: P2)

As the initial user, Stan can represent activities such as gym or forro as one
meaningful activity that expands into multiple timeline segments. The bundle shows
the real calendar cost and the split between useful and non-useful time.

**Why this priority**: Bundles address a known Life Manager pain: activities often
consume more real day capacity than their core productive segment.

**Independent Test**: Create a gym bundle with preparation, workout, and return
segments; collapse and expand it; verify total duration and useful/non-useful split
remain visible and understandable.

**Acceptance Scenarios**:

1. **Given** the user adds a task bundle, **When** they define multiple segments,
   **Then** the bundle shows a total duration equal to the sum of its segments.
2. **Given** a bundle has useful and non-useful segments, **When** the bundle is
   collapsed, **Then** the row still indicates both useful and non-useful time.
3. **Given** a bundle is expanded, **When** the user reviews the timeline, **Then**
   each internal segment is visible in order under the parent activity.

---

### User Story 3 - Capture A Low-Energy Day In Freeform Text (Priority: P3)

As the initial user, Stan can write unstructured notes during a low-energy day and
turn them into a suggested daily structure before closing the day.

**Why this priority**: Freeform capture prevents a missed or messy day from becoming
operational debt, while still preserving user confirmation before structure becomes
final.

**Independent Test**: Enter several freeform lines, request a draft structure, review
suggested timeline items, accept selected suggestions, and verify they appear in the
daily timeline.

**Acceptance Scenarios**:

1. **Given** the user writes freeform text, **When** they request structure, **Then**
   the system presents suggested timeline items instead of silently committing them.
2. **Given** suggested items are shown, **When** the user accepts some suggestions,
   **Then** only accepted items are added to the timeline.
3. **Given** suggested items are shown, **When** the user edits a suggestion before
   accepting it, **Then** the edited version is added to the timeline.

---

### User Story 4 - Close The Day And Review Scores (Priority: P4)

As the initial user, Stan can close today's cycle by reviewing statuses and actual
minutes, then see execution and alignment feedback generated from the visible data.

**Why this priority**: Cycle closing is a core ritual and scoring has already proven
valuable in the existing Life Manager.

**Independent Test**: Create a daily timeline with planned items, mark a mix of
completed, partial, skipped, and cancelled statuses, close the day, and verify the
resulting summary explains execution, alignment, and carry-forward candidates.

**Acceptance Scenarios**:

1. **Given** a daily timeline has planned items, **When** the user starts daily
   close, **Then** the system guides them to review incomplete statuses and actual
   minutes before showing final scores.
2. **Given** a task is cancelled, **When** the day is scored, **Then** the cancelled
   item does not reduce execution or alignment.
3. **Given** an item is skipped or partial, **When** the day is closed, **Then** the
   system identifies it as a carry-forward candidate unless the user dismisses it.
4. **Given** the day is closed, **When** the user reopens the product, **Then** the
   close summary and scores remain available in the same browser.

### Edge Cases

- The user opens a date that has no existing data.
- The user creates a timeline item without a start time.
- The user creates overlapping or out-of-order items.
- The user reorders a bundle relative to single items.
- The user edits a bundle segment after the bundle was collapsed.
- The user closes a day with items still in planned status.
- The user records actual minutes greater than planned minutes.
- The user records zero actual minutes for completed status.
- The user refreshes during editing.
- Saved browser data is unavailable or corrupted.
- The user changes dates and returns to today's cycle.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST show a daily cycle based on the user's current local date
  by default.
- **FR-002**: Users MUST be able to navigate to previous and next dates.
- **FR-003**: System MUST create a separate daily cycle per date when needed.
- **FR-004**: Users MUST be able to add timeline items with title, planned duration,
  optional actual duration, optional planned time, status, notes, and alignment
  relevance.
- **FR-005**: Users MUST be able to classify timeline items as simple item or task
  bundle.
- **FR-006**: Users MUST be able to reorder timeline items directly in the daily
  view.
- **FR-007**: System MUST preserve the user's custom timeline order independently
  from clock time when the user manually reorders items.
- **FR-008**: Users MUST be able to mark an item as planned, completed, partial,
  skipped, or cancelled.
- **FR-009**: Users MUST be able to edit planned minutes and actual minutes for each
  item.
- **FR-010**: System MUST visually distinguish useful time from non-useful time in
  timeline summaries.
- **FR-011**: Users MUST be able to create a task bundle with multiple ordered
  segments.
- **FR-012**: Each bundle segment MUST have a title, duration, and useful or
  non-useful classification.
- **FR-013**: System MUST calculate bundle total duration from its segments.
- **FR-014**: System MUST show useful and non-useful totals for each bundle.
- **FR-015**: Users MUST be able to expand and collapse task bundles.
- **FR-016**: Users MUST be able to add and edit freeform capture text for the
  current daily cycle.
- **FR-017**: System MUST transform freeform capture into suggested timeline items
  only after the user requests structure.
- **FR-018**: System MUST require user confirmation before adding suggested freeform
  items to the timeline.
- **FR-019**: Users MUST be able to start a daily close flow for the current date.
- **FR-020**: Daily close MUST highlight items that still need status or actual
  minute confirmation.
- **FR-021**: System MUST calculate execution score from non-cancelled planned work
  using capped credit for actual completion.
- **FR-022**: System MUST calculate alignment score separately from execution score
  using only alignment-relevant items.
- **FR-023**: System MUST exclude cancelled items from score denominators.
- **FR-024**: System MUST identify skipped and partial items as carry-forward
  candidates during daily close.
- **FR-025**: Users MUST be able to confirm, edit, or dismiss carry-forward
  candidates.
- **FR-026**: System MUST persist daily cycles, timeline items, bundle segments,
  freeform text, close summaries, scores, and carries in the same browser.
- **FR-027**: System MUST clearly communicate that MVP data is local to the current
  browser and not cloud-synced.
- **FR-028**: System MUST provide enough seeded or quick-start sample data for the
  user to evaluate the timeline, bundles, freeform capture, and daily close without
  extensive setup.
- **FR-029**: System MUST remain usable on a phone-sized viewport for all primary
  daily operations.
- **FR-030**: System MUST avoid automatically finalizing plans, freeform structures,
  daily close, or carries without user confirmation.

### Key Entities *(include if feature involves data)*

- **Daily Cycle**: A date-specific Life Manager record containing timeline items,
  freeform capture, close state, scores, and carry-forward candidates.
- **Timeline Item**: A user-visible item in the daily timeline. It may represent a
  task, routine, note, work block, commitment, support block, or bundle parent.
- **Task Bundle**: A parent timeline item that groups ordered segments into one
  meaningful activity with total useful and non-useful time.
- **Bundle Segment**: A child unit inside a task bundle with its own title, duration,
  ordering, and useful/non-useful classification.
- **Freeform Capture**: Unstructured daily text that can be converted into suggested
  timeline items only after user request and confirmation.
- **Daily Close Summary**: The saved result of closing a day, including scores,
  notes, unresolved items, and carries.
- **Carry-Forward Candidate**: An item or suggested action that may be moved into a
  future cycle after user confirmation.
- **Score Summary**: Computed feedback containing execution score, alignment score,
  planned minutes, actual minutes, useful time, non-useful time, and optional deep
  work minutes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can open the product and create a usable daily
  timeline for the current date in under 3 minutes.
- **SC-002**: A user can add, edit, reorder, and persist at least five timeline items
  without leaving the main daily screen.
- **SC-003**: A user can create and understand a three-segment gym-style bundle in
  under 2 minutes.
- **SC-004**: A user can see the useful versus non-useful time split for a bundle
  without expanding it.
- **SC-005**: A user can capture at least three freeform lines, convert them into
  suggested items, and accept selected suggestions in under 2 minutes.
- **SC-006**: Daily close can be completed for a day with ten timeline items in under
  5 minutes once item statuses are known.
- **SC-007**: Execution score and alignment score are explainable from visible item
  statuses and durations.
- **SC-008**: Daily data remains available after page refresh in the same browser.
- **SC-009**: All primary daily operations are usable on a 390px-wide viewport.
- **SC-010**: The product clearly avoids implying that local MVP data is cloud-synced
  or backed up.

## Assumptions

- The first prototype is single-user and local-only.
- The product starts with real local dates rather than a fixed mock day.
- Weekly and monthly cycles are conceptually important but outside this first feature
  except where daily close identifies carry-forward candidates.
- Useful versus non-useful remains the only user-facing time classification for this
  feature.
- Task bundles can be created manually first; automatic bundle templates can be
  added later.
- Freeform structuring can use simple deterministic parsing in the MVP; it does not
  require an AI model.
- The first visual direction is essentialist and minimal, optimized for repeated
  daily use on mobile.
- The user accepts local browser persistence as sufficient for prototype validation.
