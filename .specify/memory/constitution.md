<!--
Sync Impact Report
Version change: 1.0.0 -> 2.0.0
Bump rationale: MAJOR. Product Boundaries are redefined incompatibly: the local-only,
single-user prototype boundary (no backend, no authentication, no Markdown export) is
replaced by a hosted, authenticated, tenant-isolated product.
Modified principles:
- I. Cycles Before Lists (unchanged)
- II. Human Authorship Before Automation (unchanged)
- III. Time Is The Primary Planning Unit (unchanged)
- IV. Mobile-First Daily Operation (rationale wording: "MVP" -> "product")
- V. Scores As Feedback, Not Punishment (unchanged)
Added principles:
- VI. Tenant Isolation
- VII. Data Ownership, Durability, And Portability
- VIII. Evidence-Based Delivery
Modified sections:
- Product Boundaries (rewritten: hosted product; personal workspaces; self-hosting
  explicitly not a guarantee; external input untrusted)
- Development Workflow (references docs/development-flow.md; testing and verification
  rules moved into Principle VIII)
- Governance (compliance review checklist updated)
Removed sections:
- None
Follow-up TODOs:
- None. Technology, vendor, auth, storage, and RLS choices are deliberately left to
  002-cloud-foundation research.
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
The product must support repeated daily use, not only desktop planning sessions.

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

### VI. Tenant Isolation

Every record of user business data MUST belong to exactly one tenant workspace.
Every read and write of business data MUST be scoped to the workspace of the
authenticated user, and the scope MUST be enforced on the server; the client is never
trusted to supply or enforce it.

A request that targets another tenant's data MUST behave as if the data does not
exist. Tenant isolation MUST be covered by automated tests that attempt cross-tenant
access for every resource that stores business data.

Rationale: a Life Manager holds intimate personal data. One leak between users
destroys the trust the product depends on, and isolation is far cheaper to build in
from the first table than to retrofit.

### VII. Data Ownership, Durability, And Portability

Users own their data. Users MUST be able to export all of their data in a documented,
machine-readable format and in a human-readable Markdown form. Users MUST be able to
delete their account and its data.

User data MUST NOT be lost silently. Destructive operations MUST require explicit
confirmation. Production data MUST have backups, and restoring from them MUST have
been tested before the product is relied on. Schema changes MUST keep the currently
deployed application working while they roll out and MUST NOT discard data without a
documented migration.

Rationale: the previous Obsidian Life Manager proved the value of owning plain,
readable data; moving to a hosted product must not take that away, and a planning
history is only useful if it survives.

### VIII. Evidence-Based Delivery

Work is complete when evidence shows it, not when tasks are checked.

- Every bug fix MUST start with a regression test that fails without the fix and
  passes with it.
- Domain rules (scoring, cycle transitions, carries, bundle aggregation, date
  handling, freeform parsing), tenant isolation, and API contracts MUST have
  automated tests.
- Daily-critical user flows MUST be covered by end-to-end tests or a recorded
  verification run, including a phone-sized viewport.
- Each feature MUST close with a verification report that lists the checks run,
  their results, failures, and known gaps. A skipped, pending, or unrunnable check
  is a gap, never a pass.
- Deployments MUST come from a commit whose continuous integration is green.

Test-first development is encouraged everywhere and required for bug fixes.

Rationale: the 001 prototype had all implementation tasks checked while its
verification tasks were still open, and verification then found real defects.
Evidence keeps both humans and agents honest.

## Product Boundaries

Cloud StanOS is a hosted, authenticated Life Manager that the user operates from a
phone and a desktop. The local-only prototype phase (feature 001) has ended; its
validated behavior is the baseline for the hosted product.

- Each user has a personal workspace. Sharing a workspace between users and
  collaboration features are out of scope until a constitution amendment allows them,
  but the data model MUST stay workspace-scoped so they can be added later.
- The product is intended to be published as open source and possibly sold. Self-
  hosting by third parties is not a guarantee; managed services may be used when an
  architecture decision record justifies them.
- The repository MUST stay publishable: secrets and personal data MUST NOT be
  committed.
- Content that originates outside the team (imported files, user-provided text,
  third-party data, and future contributions) MUST be treated as untrusted input.
- Billing, native mobile apps, calendar or email sync, a marketplace, and an
  autonomous AI operator remain out of scope until a specification introduces them.
- Technology, vendor, authentication, and storage choices belong in feature research
  and architecture decision records, not in this constitution.

The visual experience MUST be essentialist and minimal. UI color, density, and
motion SHOULD serve state, hierarchy, and review clarity. Decorative patterns,
marketing-style hero screens, and generic SaaS dashboard clutter SHOULD be avoided
inside the product surface.

## Development Workflow

The project workflow is defined in `docs/development-flow.md`. All specifications,
plans, architecture decision records, and API contracts live in this repository, even
when the implementation lives in the backend repository.

Each meaningful feature MUST start with a Spec Kit specification that states user
value, scenarios, requirements, edge cases, and measurable success criteria before
implementation planning begins. Business behavior MUST be resolved in the
specification; data and schema design MUST NOT silently decide open product
questions.

Implementation plans MUST explicitly identify which constitution principles are
affected. Any feature that changes daily planning, cycle closing, automation,
scoring, persistence, tenant data, or mobile interaction MUST include acceptance
criteria for the affected principle.

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

- MAJOR version changes redefine or remove a core principle or product boundary.
- MINOR version changes add a new principle or materially expand governance.
- PATCH version changes clarify wording without changing meaning.

Compliance review is required before implementation begins for each feature and
again before a feature is considered complete. The review must check mobile-first
daily usability, human confirmation points, scoring integrity, tenant isolation,
data ownership and durability, verification evidence, and consistency with the cycle
model.

**Version**: 2.0.0 | **Ratified**: 2026-09-03 | **Last Amended**: 2026-10-03
