# Feature Specification: Timeline Feedback, Round 1

**Feature Branch**: `004-timeline-feedback`

**Created**: 2026-10-20

**Status**: Approved (2026-10-21) — D1, D2, D4, D6 approved; D3 and D5 deferred

**Input**: The owner's first test of 003 on the web (15 points, 2026-10-20),
plus the requests that every reported misbehavior becomes a test and that an
automated flow runs against the running app on every change.

## Findings (discovery)

| # | Point | Finding |
|---|---|---|
| 1 | Capture is rudimentary | The parser is rule-based (research R8 of 003). Out of this feature (D3). |
| 2 | Entry sheet does not close on outside click | The native dialog has no backdrop handler. Bug. |
| 3 | Start times are a poor experience | Idea, not for now: a day start time plus ordered durations would compute start and end times, with fixed-time entries (stand-ups, meetings) anchored. Parked as discovery for a later feature. |
| 4 | An entry without a start time is created | By design: start time is optional (003 FR-008). |
| 5 | Durations as "1h", "30m" | Not supported; the field takes minutes only. |
| 6 | The gym block did not show its parts | Segments come from the activity's default segments (003 US2 scenario 4). The generic catalog has none, so "Academia" from the generic catalog has no parts. The owner's seed (Gym with three segments) may not have been loaded; and nothing in the interface shows that an activity can carry segments. |
| 7 | "JIB: standup, task, code review" | There is no way to group entries under a heading. |
| 8 | Tasks linked to week → month → year | The model supports it (an objective names activities; parents chain up; credit flows up), but nothing on the day shows which objective an entry feeds, the chain is not visible, and manual links have no screen. |
| 9 | A dragged entry jumps back | Root cause: moving to the top creates the key `Zz`. The browser sorts keys by bytes (`Zz` < `a0`); the staging database most likely sorts text by language rules, where `Zz` comes after `a0`, so the refetch puts it back near the end. Local and test databases sort by bytes, which hid it. Bug. |
| 10 | Entries show the activity name, not the typed title | 003 data model chose "display name = activity name". The owner had two "Study" rows and had to open each. |
| 11 | Odd refresh when checking an entry | The optimistic order and the server order disagree (point 9), and the add field is disabled while saving, so the list jumps and focus is lost. Bug. |
| 12 | Copy from another day duplicates carried entries | Copy ignores what the target day already received from the source. Bug. |
| 13 | Deleting is slow | Only through the entry sheet plus a confirm dialog. |
| 14 | No clear first path | The app opens on the day; nothing suggests starting from objectives, so entries end up linked to nothing. Out of this feature (D5). |
| 15 | Activities screen UX | A tree of pillars → areas → activities with prompts; hard to scan and edit. |

## Decisions To Approve

Each has a recommendation (★). Approve all, or change any.

| ID | Question | Options |
|---|---|---|
| D1 (approved: A) | How to group entries (point 7) | ★ **A** A group is an entry heading ("JIB") with child entries indented under it; each child keeps its own status and minutes; the heading shows the group total. **B** Group automatically by activity area. **C** A new "project" in the catalog shown as a prefix on entries. |
| D2 (approved: A) | What a row shows (point 10) | ★ **A** The typed title; the activity appears only as a small muted label when it differs from the title. **B** Title only, activity in the sheet. |
| D3 | Smarter capture (point 1) | Deferred by the owner (2026-10-21): capture stays rule-based for now. Options studied (Claude Haiku with a spend cap, Gemini free tier, in-browser model, better rules) are in `docs/discovery/llm-capture.md`. |
| D4 (approved: A) | Quick delete (point 13) | ★ **A** Swipe left (touch) or a row menu (desktop) reveals Delete; tapping it deletes at once and shows "Undo" for 5 seconds. **B** Swipe plus a confirm dialog. |
| D5 | First path (point 14) | Dropped by the owner (2026-10-21): the design itself should invite top-down planning; it will be designed with the later UX work. Kept in `docs/discovery/first-path.md`. |
| D6 (approved: A) | Running-app tests on every change | ★ **A** Both repositories run the full Playwright suite in CI against a fresh Postgres, the API, and a production web build, on every push; a deploy waits for it. The web repository (public) reads the private backend with a read-only token you create once. Plus a smoke run against staging after each deploy. **B** Only a smoke subset on every push, full suite nightly. |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The Timeline Behaves (Priority: P1)

Dragging an entry to the top keeps it there after any refresh; checking an
entry does not make the list jump or the add field lose focus; copying from a
day adds only what the target day does not already have from it; the entry
sheet closes on a click outside it.

**Why this priority**: these are defects in the daily screen.

**Independent Test**: on the staging database's text ordering, move the last
entry to the top and refresh; check an entry while typing in the add field;
carry an entry, then copy the same day again; click outside an open sheet.

**Acceptance Scenarios**:

1. **Given** five entries, **When** any entry is moved to any position, **Then**
   the order after a refresh on another device is the order shown.
2. **Given** an entry being completed, **When** the save is in flight, **Then**
   no row changes position and the add field keeps focus and text.
3. **Given** entry X carried or copied from day D into day E, **When** the user
   copies from D into E again, **Then** X is shown as already on the day and is
   not added twice.
4. **Given** an open entry sheet, **When** the user clicks or taps outside it or
   presses Escape, **Then** it closes without saving.

---

### User Story 2 - Every Change Is Checked On The Running App (Priority: P1)

Every push runs the end-to-end suite against a running API, database, and web
build; a failing flow blocks the deploy. After each staging deploy, a smoke
flow runs on staging.

**Why this priority**: the owner should not be the one finding regressions.

**Independent Test**: push a commit that breaks the day screen on a throwaway
branch and see CI fail and no deploy happen.

**Acceptance Scenarios**:

1. **Given** a push to either repository, **When** CI runs, **Then** the
   Playwright suite runs against the other repository's matching branch (or
   the staging branch when none exists).
2. **Given** a reported misbehavior, **When** it is fixed, **Then** a test that
   fails without the fix is part of the change.
3. **Given** a staging deploy, **When** it finishes, **Then** a smoke flow signs
   in with the test secret, adds and completes an entry, and checks the result.

---

### User Story 3 - Read The Day At A Glance (Priority: P1)

Rows show what the user typed; the activity shows only as a small label when it
differs. Entries can sit under a group heading ("JIB") with the group total.
An entry that feeds an objective shows a small mark; tapping it shows the chain
(week → month → year).

**Why this priority**: the day must be readable without opening entries
(constitution IV, essentialist rules).

**Independent Test**: create "Study for AWS" and "Study Spanish", both with the
activity Study; group three work entries under "JIB"; link one entry to a week
objective whose parent is a month objective under a year objective.

**Acceptance Scenarios**:

1. **Given** two entries of the same activity with different titles, **Then**
   each row shows its own title.
2. **Given** a group heading with three entries, **Then** they are indented
   under it, the heading shows their total minutes, and moving the heading moves
   the group.
3. **Given** an entry counting for a week objective, **Then** the row shows a
   small mark, and the entry sheet lists the objective with its chain up to the
   longest horizon.
4. **Given** the entry sheet, **When** the user links it to an objective by
   hand, **Then** it counts for that objective and its ancestors.

---

### User Story 4 - Faster Input (Priority: P2)

Durations accept "1h", "1h30", "90m", "45". On touch, swiping a row left
reveals Delete; deleting offers Undo for a few seconds.

**Acceptance Scenarios**:

1. **Given** a duration field, **When** the user types "1h30", **Then** it is
   stored as 90 minutes and shown as 1h30.
2. **Given** a phone, **When** the user swipes a row left and taps Delete,
   **Then** it disappears, an Undo appears for 5 seconds, and Undo restores it.

---


### User Story 5 - Activities You Can Scan (Priority: P3)

The activities screen is a flat, searchable list (name, area as a small label,
default minutes, segments count) with one "New activity" action; pillars and
areas are managed in a secondary "Organize" view. An activity with default
segments says so, so blocks like the gym are discoverable.

**Acceptance Scenarios**:

1. **Given** 40 activities, **When** the user types "stu", **Then** only matching
   activities show.
2. **Given** an activity, **When** it has default segments, **Then** the list
   shows its parts count and the entry created from it starts with them.

---


### Edge Cases

- Moving an entry into or out of a group changes only that entry.
- Deleting a group heading asks what to do with its entries (keep them
  ungrouped, the default).
- Undo after the day was closed reopens it, as any change does.
- Durations above 24h are rejected with a field message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Entry order MUST be the same on every client and in the database
  for every possible key (byte-order comparison of order keys everywhere).
- **FR-002**: Saving an entry MUST NOT reorder rows that the change does not
  move, and MUST NOT disable or clear the add field.
- **FR-003**: Copy from another day MUST skip, and show as already present,
  source entries that the target day already received by copy or carry.
- **FR-004**: Every sheet and dialog MUST close on outside click, tap, or
  Escape, without saving.
- **FR-005**: CI in both repositories MUST run the end-to-end suite against a
  running API, database, and production web build on every push; the staging
  deploy MUST depend on it.
- **FR-006**: The test databases MUST use the same text ordering as staging.
- **FR-007**: A staging smoke flow MUST run after each deploy and fail the
  deploy job when it fails.
- **FR-008**: Rows MUST show the entry title; the activity name MUST appear
  only as a muted label when it differs from the title (D2).
- **FR-009**: Entries MUST be groupable under a heading entry; a heading has no
  status of its own, shows its children's total minutes, and moves with them
  (D1).
- **FR-010**: An entry counting for an objective MUST show a mark on its row;
  its sheet MUST list the objectives it counts for with their parent chain, and
  MUST allow linking it to an active objective by hand.
- **FR-011**: Duration inputs MUST accept `N`, `Nm`, `Nmin`, `Nh`, `NhMM`,
  `N h`, decimal hours (`1.5h`), in both languages.
- **FR-012**: Touch rows MUST reveal Delete on a left swipe; desktop rows MUST
  offer Delete in a row menu; a delete MUST be undoable for 5 seconds (D4).
- **FR-014**: The activities screen MUST be a searchable flat list with area
  labels and segment counts; pillar and area management MUST be secondary.
- **FR-016**: Each misbehavior listed in Findings (2, 9, 11, 12) MUST have a
  regression test that fails without its fix.

### Key Entities

- **Entry** (changed): optional `groupId` pointing to a heading entry of the
  same day; `kind` is `item` or `heading`; optional `copiedFromEntryId`.

## Success Criteria *(mandatory)*

- **SC-001**: 0 order mismatches between the screen and a refresh across 100
  random moves in an automated test on the staging text ordering.
- **SC-002**: Every push runs the full e2e suite; a deliberately broken commit
  fails CI and does not deploy.
- **SC-003**: The owner identifies every entry of a day without opening any.
- **SC-004**: Deleting an entry on a phone takes two gestures.

## Assumptions

- Point 3 (computed schedule with fixed-time anchors) is out of scope and kept
  in `docs/discovery/` for a later feature.
- Groups are one level deep (no nested groups).
- The visual redesign of the whole interface is a separate, later feature.
