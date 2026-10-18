# Verification: Daily Timeline Prototype

**Status**: DRAFT — automated pass done; manual pass deferred by the user (low priority, 2026-10-03).
Decision: 001 closes with documented gaps; F1, F2, F4, F6 move to the cloud daily-timeline feature.
T037/T038 remain open until this report reaches a final verdict.

## Run

- Date: 2026-10-03 18:28 -03 (America/Sao_Paulo)
- Commit under test: `44edc8c` (working tree clean)
- App: `next build` + `next start` (production build), Next.js 16.2.6
- Runtime: Node 22.23.0, macOS 26.6.2
- Driver: Playwright 1.63.0, Chromium 153.0.8010.12 (headless)
- Viewports: desktop 1280×900 (mouse); mobile 390×844, `isMobile`, `hasTouch`, DPR 3 (tap)
- Each viewport runs in a fresh browser context (empty `localStorage`).
- The driver script lived outside the repo (session scratchpad); it is not part of
  the project and added no dependencies.

## Build Gates (T035, T036)

| Gate | Result |
|---|---|
| `npm run lint` | exit 0, no findings |
| `npm run build` | exit 0, static `/` route generated |

## T037 — Primary Quickstart Flows (desktop and mobile)

Pass = automated assertion held on both viewports unless noted.

### Primary flow

| Step | Check | Result |
|---|---|---|
| 2 | Shown date equals browser local date (`2026-10-03`, "Saturday, Oct 3") | PASS |
| — | Local-only notice: "Data is saved only in this browser. No cloud sync or backup yet." (SC-010, FR-027) | PASS |
| — | Seed data present: 6 items (FR-028) | PASS |
| 3 | Add five items | PASS |
| 4 | Reorder via Move up / Move down | PASS |
| 4 | Reorder via real mouse drag-and-drop (desktop) | **FAIL (automation)** — see F3 |
| 4 | Reorder via synthetic HTML5 drag events (app handler logic) | PASS |
| 4 | Reorder via touch drag (mobile) | Not supported — Move buttons are the touch path |
| 5–7 | Completed / partial with actual 10 < planned 30 / skipped | PASS |
| — | Edit an existing item through the Edit sheet (SC-002) | PASS |
| 8–9 | Refresh keeps date, order, statuses, notes, durations (UI and stored data identical) (SC-008) | PASS |

### Task bundle flow

| Step | Check | Result |
|---|---|---|
| 1–2 | Create `Gym` bundle with segments 20 non-useful / 60 useful / 30 non-useful | PASS (sheet provides exactly 3 fixed rows; see F5) |
| 3–5 | Collapsed: no segments visible, shows `110m planned`, bar "60m useful / 50m support" (SC-004) | PASS |
| 6–7 | Expanded: three segments in order | PASS |

### Freeform flow

Input: the five quickstart lines.

| Step | Check | Result |
|---|---|---|
| 3 | Five suggestions generated; timeline unchanged before confirmation (FR-017, FR-018) | PASS |
| — | `academia 19h` → start 19:00, no duration | **FAIL** — start 19:00 **and** duration 1140 min (F1) |
| — | `trabalhei no projeto X umas 2h` → 120 min, no start | **FAIL** — 120 min **and** start 02:00 (F1) |
| 4–6 | Edit one suggestion, accept three, dismiss one; accepted appear, dismissed does not | PASS |

Parsed suggestions (both viewports identical):

| Source | Title | Start | Minutes | Status |
|---|---|---|---|---|
| fiz standup | Standup | — | — | completed |
| trabalhei no projeto X umas 2h | Trabalhei no projeto X umas | 02:00 | 120 | completed |
| academia 19h | Academia | 19:00 | 1140 | planned |
| nao fiz leitura | Nao leitura | — | — | skipped |
| preciso marcar futevolei amanha | Marcar futevolei | — | — | planned |

### Daily close flow

| Step | Check | Result |
|---|---|---|
| — | Adding a cancelled item leaves execution/alignment/planned unchanged (FR-023) | PASS (26% / 38% / 740m before and after) |
| 1–2 | Close warns about unresolved items ("11 items need review") | PASS |
| 3–4 | Generated execution/alignment equal an independent recomputation from stored items (SC-007) | PASS (26% / 38%) |
| 5 | Carry candidates = exactly the skipped + partial items, all pending | PASS |
| 6 | Confirm one, dismiss one; decisions stored | PASS |
| 7 | Refresh keeps scores, close summary, carry decisions | PASS |
| — | Carry candidates can be edited (FR-025 "confirm, edit, or dismiss") | **No edit control** (F4) |

No console errors or page errors on either viewport.

## T038 — Mobile 390px

Layout audit after every quickstart step (13 checkpoints):

| Check | Result |
|---|---|
| No horizontal scroll (`scrollWidth` 390 / viewport 390) | PASS at all 13 checkpoints |
| No element outside the viewport horizontally | PASS at all 13 checkpoints |
| No clipped text | PASS at all 13 checkpoints |
| Text overlapping controls | PASS — flags only while the add/edit sheet was open, caused by page content behind the opaque modal; confirmed visually as false positives |
| All quickstart operations completed with tap input | PASS (add, reorder via buttons, bundle expand/collapse, status, duration, freeform, close) |
| Touch targets ≥ 44px (Apple HIG) | Most controls are 40px tall |
| Touch targets ≥ 24px (WCAG 2.2 AA 2.5.8) | **FAIL** for `Expand/Collapse bundle` (302×20) and checkbox labels `Counts for alignment` / `Deep work` (19px tall) (F2) |

The quickstart criterion "touch-sized targets" has no numeric threshold in the spec.

## Findings

| ID | Finding | Evidence | Spec link |
|---|---|---|---|
| F1 | Freeform parser treats `19h` as both a 19:00 start and a 1140-minute duration, and `2h` as both 120 minutes and a 02:00 start. Accepting the `projeto X` suggestion puts a 02:00 start into the timeline. | parsed-suggestion table above | FR-017 |
| F2 | Bundle expand/collapse button is 20px tall; sheet checkbox labels are 19px tall at 390px. | mobile layout audit | FR-029, SC-009, quickstart "touch-sized targets" |
| F3 | Real mouse drag-and-drop did not reorder in headless Chromium (`dragTo` and stepwise mouse). Synthetic drag events do reorder, so the handler logic works; real-browser behavior is unconfirmed. Touch drag is not supported (HTML5 DnD). | P4 rows | Spec input "support drag-and-drop ordering"; FR-006 is met by Move buttons |
| F4 | Carry candidates can be confirmed or dismissed but not edited. | C6 | FR-025 |
| F5 | Bundles always have exactly three segments; no add/remove. | B1–2 | FR-011 ("multiple ordered segments") |
| F6 | A confirmed carry does not appear in the next day. | next-day probe: 2026-10-04 contains only seed items | Key Entity "may be moved into a future cycle after user confirmation" (ambiguous) |
| F7 | After close, the top score summary is frozen: changing an item status does not update it. | post-close probe | Not specified |
| F8 | Visiting any date with no data seeds and persists the six demo items for that date. | `localStorage` gained `…:2026-10-04` with seed items | FR-003, FR-028; edge case "opens a date that has no existing data" |
| F9 | The review-notes field is empty after refresh; the notes are kept in the stored close summary but not shown anywhere. | C7 | FR-026 (persisted, not displayed) |

### Product decisions on findings (2026-10-03)

- F4: carry candidates MUST be editable (confirms FR-025 as written; implementation gap).
- F6: a confirmed carry MUST move into the next day. This tightens the Key Entity
  wording "may be moved into a future cycle" and needs a spec change before it is
  implemented.
- Where these are implemented (001 prototype vs the hosted version) is still open.

## Not Verifiable by Automation

| Criterion | Reason |
|---|---|
| SC-001, SC-003, SC-005, SC-006 | Time-to-complete for a first-time human user |
| SC-007 (human side) | Whether scores feel explainable from the visible items |
| SC-010 (human side) | Whether anything implies cloud sync or backup |
| F3 | Real-browser mouse drag-and-drop |

## Verdict

Pending.
