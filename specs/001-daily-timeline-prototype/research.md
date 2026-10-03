# Research: Daily Timeline Prototype

## Decision: Use The Existing Next.js App Router Scaffold

Rationale: The project is already scaffolded as a single Next.js app with React and
TypeScript. The feature is a client-heavy prototype, and the App Router can host it
cleanly from the main page without adding backend routes.

Alternatives considered:

- Vite React app: simpler for pure client-side work, but would discard the existing
  scaffold and reduce continuity with a future full product.
- Static HTML: too limited for typed domain state, future routing, and component
  growth.

## Decision: Persist Prototype Data In Browser Local Storage

Rationale: The MVP is explicitly local-only. Browser storage is enough to validate
the daily timeline, low-friction edits, refresh persistence, and scoring without
introducing auth, database, deployment, or sync decisions.

Alternatives considered:

- IndexedDB: stronger for larger datasets, but unnecessary for the first prototype.
- Backend database: too much scope for validating the primary interaction model.
- Markdown files: explicitly not required for this MVP.

## Decision: Keep Useful vs Non-Useful As The User-Facing Time Split

Rationale: The product brief identifies a risk in over-classifying time. The first
prototype should validate whether a simple binary split is understandable and useful
before adding support/recovery/admin/transition categories.

Alternatives considered:

- Multiple visible categories from day one: higher analytical resolution, but more
  UI friction and noisier data entry.
- No time classification: simpler, but fails to validate the task bundle insight.

## Decision: Implement Freeform Structuring As Deterministic Suggestions

Rationale: The MVP needs to test the low-energy capture workflow, not AI quality.
Simple line-based parsing can turn each non-empty line into a pending suggestion
and infer rough title/minutes when obvious. User confirmation preserves authorship.

Alternatives considered:

- AI-backed parsing: closer to future product direction, but adds service,
  reliability, privacy, and cost decisions too early.
- Freeform text only: useful as notes, but does not validate turning messy days into
  structured daily records.

## Decision: Build A Small Custom Reordering Interaction

Rationale: The feature only needs to reorder a single daily list. A small custom
interaction keeps the dependency surface small. Accessibility fallback controls
should allow moving items up/down even if pointer drag is imperfect on a device.

Alternatives considered:

- Drag-and-drop library: likely more robust, but adds dependency and abstraction
  before the interaction model is proven.
- Up/down buttons only: accessible and simple, but does not validate the desired
  direct manipulation experience.

## Decision: Defer A Dedicated Test Runner

Rationale: The current scaffold includes lint/build scripts but no test runner. For
this first prototype, verification will rely on lint, build, and quickstart-driven
manual validation. Core scoring and rollup logic should remain pure and easy to add
unit tests around when a runner is introduced.

Alternatives considered:

- Add Vitest now: good long-term, but introduces another setup dependency before
  the first prototype interaction is built.
- No verification plan: unacceptable because scoring and persistence need explicit
  validation.
