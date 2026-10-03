<!--
Sync Impact Report
Version change: N/A -> 1.0.0
Modified principles:
- Template Principle 1 -> I. Cycles Before Lists
- Template Principle 2 -> II. Human Authorship Before Automation
- Template Principle 3 -> III. Time Is The Primary Planning Unit
- Template Principle 4 -> IV. Mobile-First Daily Operation
- Template Principle 5 -> V. Scores As Feedback, Not Punishment
Added sections:
- Product Boundaries
- Development Workflow
Removed sections:
- None
Follow-up TODOs:
- None
-->

# Cloud StanOS Constitution

## Core Principles

### I. Cycles Before Lists

Cloud StanOS MUST model personal organization as cycles, not as a generic task list.
Daily, weekly, monthly, annual, and longer-horizon cycles are first-class product
concepts. Every feature that creates, edits, completes, postpones, or reviews work
MUST preserve the relationship between the current item and the relevant cycle.

Rationale: the product exists to support planning, execution, review, carry-forward,
and learning over time. A flat task list loses the ritual and long-term alignment
that make the Life Manager valuable.

### II. Human Authorship Before Automation

Automation and AI MUST produce drafts, suggestions, summaries, and calculations;
they MUST NOT silently turn suggestions into final user commitments. User-facing
flows MUST include clear confirmation points when the system structures freeform
capture, migrates unfinished work, creates a daily plan, or closes a cycle.

The product MUST distinguish capture from clarification. Capturing text, messages,
or ideas does not mean the user has accepted a task. Suggesting a next action does
not mean the action is valid. Migration and review flows MUST preserve a deliberate
choice about what still deserves attention.

Rationale: Cloud StanOS draws from GTD and Bullet Journal. The system should use
software and AI for memory, structure, retrieval, and calculation while preserving
the user's reflective decision-making.

### III. Time Is The Primary Planning Unit

Features MUST treat time as the primary planning and review unit. Tasks, routines,
commitments, and bundles MUST carry planned and actual duration when they affect
execution, alignment, or calendar capacity. Planning interfaces MUST make real day
capacity visible before encouraging the user to add more work.

Task bundles MUST represent activities that have hidden support time, such as
preparation, commute, transition, waiting, shower, or recovery. The main interface
MUST be able to show useful versus non-useful time without requiring excessive
classification from the user.

Rationale: a task can look small while consuming a large part of the day. The
product must model the real cost of living a day, not only the name of the work.

### IV. Mobile-First Daily Operation

The daily Life Manager experience MUST work well on a phone-sized viewport before
desktop enhancements are added. The primary daily screen MUST be a timeline with
clear ordering, quick status updates, drag-and-drop or equivalent reordering, and
low-friction capture.

Weekly and monthly review may use denser desktop layouts, but every daily-critical
operation MUST remain usable on mobile: opening today's cycle, adding an item,
marking status, editing duration, expanding a bundle, capturing freeform text, and
closing the day.

Rationale: the product will often be used when the user has limited time or energy.
The MVP must validate repeated daily use, not only desktop planning sessions.

### V. Scores As Feedback, Not Punishment

Execution score and alignment score MUST remain separate concepts. Features that
display or compute scores MUST preserve their different meanings: execution answers
whether the user did what was planned; alignment answers whether the user invested
time in what mattered.

Scores MUST be explainable from visible cycle data. They SHOULD highlight patterns,
trade-offs, and recovery opportunities. They MUST NOT hide uncertainty, inflate
credit from extra work to compensate for skipped planned work, or present misses as
moral failure.

Rationale: scoring worked in the existing Life Manager because it clarified reality.
The product should turn scoring into useful feedback for planning and review.

## Product Boundaries

The initial product is the Cloud StanOS Life Manager MVP. It MUST focus on a local,
single-user prototype that validates the daily timeline, cycle closing, task bundles,
freeform capture, and scoring experience.

The MVP MUST NOT require a backend, authentication, collaboration, billing, native
mobile app, calendar sync, email sync, marketplace, Markdown export, or autonomous AI
operator. These may be revisited only after the main daily and cycle-closing flows
are validated through dogfooding.

Persistence for the initial prototype SHOULD use browser local storage or an
equivalent local-only mechanism. Product behavior MUST avoid implying cloud sync,
backup, or multi-device durability until those capabilities exist.

The visual experience MUST be essentialist and minimal. UI color, density, and
motion SHOULD serve state, hierarchy, and review clarity. Decorative patterns,
marketing-style hero screens, and generic SaaS dashboard clutter SHOULD be avoided
inside the product surface.

## Development Workflow

Each meaningful feature MUST start with a Spec Kit specification that states user
value, scenarios, requirements, edge cases, and measurable success criteria before
implementation planning begins.

Implementation plans MUST explicitly identify which constitution principles are
affected. Any feature that changes daily planning, cycle closing, automation,
scoring, persistence, or mobile interaction MUST include acceptance criteria for the
affected principle.

Tests and verification MUST match the risk of the change. Core calculations,
local persistence, status transitions, task bundle aggregation, and date handling
SHOULD have focused automated coverage. Visual and interaction-heavy flows MUST be
manually verified in a mobile-sized viewport before being considered complete.

The dogfooding loop is part of delivery. Features SHOULD be small enough to test in
real Life Manager usage quickly. Product discoveries from dogfooding MUST be fed
back into specs or open questions instead of being buried only in implementation
notes.

## Governance

This constitution governs Cloud StanOS specifications, plans, tasks, implementation,
and review. When a spec or implementation conflicts with this constitution, the
constitution takes precedence unless it is amended.

Amendments require:

- a documented rationale;
- an explicit semantic version bump;
- review of affected specs or implementation plans;
- migration notes when existing behavior or data interpretation changes.

Versioning policy:

- MAJOR version changes redefine or remove a core principle.
- MINOR version changes add a new principle or materially expand governance.
- PATCH version changes clarify wording without changing meaning.

Compliance review is required before implementation begins for each feature and
again before a feature is considered complete. The review must check mobile-first
daily usability, human confirmation points, scoring integrity, local persistence
claims, and consistency with the cycle model.

**Version**: 1.0.0 | **Ratified**: 2026-09-03 | **Last Amended**: 2026-09-03
