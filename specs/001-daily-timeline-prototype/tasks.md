# Tasks: Daily Timeline Prototype

**Input**: Design documents from `/specs/001-daily-timeline-prototype/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No dedicated test runner is added in this feature. Verification uses
`npm run lint`, `npm run build`, and the quickstart scenarios.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Confirm project baseline and create planned source structure.

- [x] T001 Verify dependency installation with `npm install` in package-lock.json
- [x] T002 [P] Create component directory structure in src/components/
- [x] T003 [P] Create domain directory structure in src/lib/ and src/types/
- [x] T004 Update app metadata for Cloud StanOS in src/app/layout.tsx
- [x] T005 Replace placeholder page shell with client entry component in src/app/page.tsx

---

## Phase 2: Foundational

**Purpose**: Core domain types and utilities required by all user stories.

**CRITICAL**: No user story work should begin until this phase is complete.

- [x] T006 Define DailyCycle, TimelineItem, BundleSegment, FreeformSuggestion, DailyCloseSummary, CarryForwardCandidate, and ScoreSummary types in src/types/life-manager.ts
- [x] T007 [P] Implement local date helpers for today, date navigation, formatting, and ISO date handling in src/lib/dates.ts
- [x] T008 [P] Implement demo daily cycle seed data with simple items and a gym bundle in src/lib/demo-data.ts
- [x] T009 Implement local persistence adapter for loading, saving, validating, and recovering daily cycles in src/lib/storage.ts
- [x] T010 Implement timeline mutation helpers for add, edit, reorder, status update, and bundle expansion state in src/lib/timeline.ts
- [x] T011 Implement score and time aggregation helpers for execution, alignment, planned, actual, useful, non-useful, and deep work minutes in src/lib/scoring.ts
- [x] T012 Create shared useful/non-useful visualization component in src/components/UsefulTimeBar.tsx
- [x] T013 Create base responsive app layout styles and design tokens in src/app/globals.css

**Checkpoint**: Foundation ready for independently testable user stories.

---

## Phase 3: User Story 1 - Plan And Operate Today's Timeline (Priority: P1)

**Goal**: The user can open today's local cycle, add and edit timeline items,
reorder them, update status, and preserve the day after refresh.

**Independent Test**: Create today's day, add at least three items, reorder them,
change status and duration, refresh, and verify the same browser restores the day.

### Implementation for User Story 1

- [x] T014 [P] [US1] Create date navigation controls in src/components/DateNavigator.tsx
- [x] T015 [P] [US1] Create timeline item card for simple items with status, time, duration, and notes display in src/components/TimelineItemCard.tsx
- [x] T016 [P] [US1] Create add/edit item sheet for simple timeline items in src/components/AddItemSheet.tsx
- [x] T017 [US1] Create timeline list with reorder controls and item update callbacks in src/components/Timeline.tsx
- [x] T018 [US1] Integrate DailyCycle state, date navigation, persistence, seeded data, add/edit, reorder, and status updates in src/app/page.tsx
- [x] T019 [US1] Ensure the local-only data notice is visible in the main daily screen in src/app/page.tsx
- [x] T020 [US1] Style the mobile-first timeline, controls, item rows, and empty state in src/app/globals.css

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Use Task Bundles For Activities With Hidden Time (Priority: P2)

**Goal**: The user can represent an activity such as gym as one expandable bundle
with useful and non-useful segment totals.

**Independent Test**: Create or load a gym-style bundle, collapse and expand it,
and verify total, useful, and non-useful minutes remain visible.

### Implementation for User Story 2

- [x] T021 [P] [US2] Extend TimelineItemCard to render collapsed and expanded bundle states in src/components/TimelineItemCard.tsx
- [x] T022 [P] [US2] Extend AddItemSheet to create bundle items with editable ordered segments in src/components/AddItemSheet.tsx
- [x] T023 [US2] Add bundle total, useful minutes, and non-useful minutes calculations to src/lib/timeline.ts
- [x] T024 [US2] Integrate bundle expand/collapse behavior into src/components/Timeline.tsx
- [x] T025 [US2] Style bundle segment rows and useful/non-useful split indicators in src/app/globals.css

**Checkpoint**: User Stories 1 and 2 work independently.

---

## Phase 5: User Story 3 - Capture A Low-Energy Day In Freeform Text (Priority: P3)

**Goal**: The user can capture unstructured daily text, request structure, edit
suggestions, and accept selected suggestions into the timeline.

**Independent Test**: Enter the sample freeform text from quickstart.md, generate
suggestions, edit one suggestion, accept selected suggestions, and verify only
accepted suggestions appear in the timeline.

### Implementation for User Story 3

- [x] T026 [P] [US3] Implement deterministic freeform line parsing and simple duration/status inference in src/lib/freeform.ts
- [x] T027 [P] [US3] Create freeform capture and suggestion review UI in src/components/FreeformCapture.tsx
- [x] T028 [US3] Integrate freeform text persistence, suggestion generation, edit, accept, and dismiss flows in src/app/page.tsx
- [x] T029 [US3] Style freeform capture, suggestion cards, and confirmation controls in src/app/globals.css

**Checkpoint**: User Stories 1, 2, and 3 work independently.

---

## Phase 6: User Story 4 - Close The Day And Review Scores (Priority: P4)

**Goal**: The user can review the day, calculate execution and alignment scores,
identify carries, and persist the close summary.

**Independent Test**: Mark a mix of completed, partial, skipped, and cancelled
items, close the day, confirm scores and carries, refresh, and verify the summary
persists.

### Implementation for User Story 4

- [x] T030 [P] [US4] Create score summary display for execution, alignment, planned, actual, useful, non-useful, and deep work minutes in src/components/ScoreSummary.tsx
- [x] T031 [P] [US4] Create daily close review panel with unresolved item warnings and carry candidate decisions in src/components/DailyClosePanel.tsx
- [x] T032 [US4] Implement daily close summary generation and carry candidate creation in src/lib/scoring.ts
- [x] T033 [US4] Integrate daily close open, review, confirm, edit, and persist flows in src/app/page.tsx
- [x] T034 [US4] Style daily close panel, score blocks, warnings, and carry decision controls in src/app/globals.css

**Checkpoint**: All user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, usability tightening, and documentation updates.

- [x] T035 Run lint validation with `npm run lint`
- [x] T036 Run production build validation with `npm run build`
- [ ] T037 Execute primary quickstart validation in specs/001-daily-timeline-prototype/quickstart.md
- [ ] T038 Execute mobile viewport quickstart validation at 390px width using specs/001-daily-timeline-prototype/quickstart.md
- [x] T039 [P] Update README with actual run instructions and MVP behavior in README.md
- [x] T040 Review text wrapping, touch target sizing, and no-horizontal-scroll behavior in src/app/globals.css

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): no dependencies.
- Foundational (Phase 2): depends on Setup completion and blocks all stories.
- US1 (Phase 3): depends on Foundational.
- US2 (Phase 4): depends on Foundational and integrates with US1 timeline UI.
- US3 (Phase 5): depends on Foundational and integrates with US1 timeline state.
- US4 (Phase 6): depends on Foundational and uses timeline state from US1.
- Polish (Phase 7): depends on selected stories being complete.

### User Story Dependencies

- US1 is the recommended MVP slice.
- US2 can start after foundational helpers exist, but final integration uses US1
  item rendering.
- US3 can start after foundational helpers exist, but final integration uses US1
  timeline state.
- US4 can start after foundational scoring helpers exist, but final integration
  uses US1 status and duration editing.

### Parallel Opportunities

- T002 and T003 can run in parallel.
- T007 and T008 can run in parallel after T006.
- T014, T015, and T016 can run in parallel after foundational types exist.
- T021 and T022 can run in parallel after US1 card/sheet structure exists.
- T026 and T027 can run in parallel after foundational types exist.
- T030 and T031 can run in parallel after scoring types exist.
- T039 can run in parallel with final visual review.

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1.
3. Stop and validate that today's daily timeline is usable and persists locally.

### Incremental Delivery

1. Add US2 to validate task bundles and useful/non-useful time.
2. Add US3 to validate low-energy freeform capture.
3. Add US4 to validate daily close and scoring.
4. Run final lint, build, quickstart, and mobile validation.

### Notes

- Keep the first prototype local-only and explicitly label it as local-only.
- Do not introduce backend, auth, cloud sync, or external AI calls.
- Keep scoring logic explainable and isolated in src/lib/scoring.ts.
- Preserve user confirmation before accepting freeform suggestions or carries.
