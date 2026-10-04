# Feature Specification: Cloud Foundation

**Feature Branch**: `002-cloud-foundation`

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "Hosted, authenticated, tenant-isolated foundation for
Life Manager: the user can sign in from a phone and a desktop, owns a private
workspace, sees the same data on every device, can export and delete their data,
and the web app and the service are deployed independently with backups and a
verified release path. Delivered as a walking skeleton with one tenant-scoped
resource end to end. Domain features (cycles, objectives, daily timeline) are out
of scope."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign In And Get A Private Workspace (Priority: P1)

A person opens Life Manager on their phone, signs in, and lands in their own
private workspace. On first sign-in the workspace is created automatically. When
they sign out, nothing from the workspace remains visible on that device.

**Why this priority**: every later feature depends on knowing who the user is
and which workspace their data belongs to. Without it nothing else can be
hosted.

**Independent Test**: sign in on a phone-sized screen with a new account,
confirm a workspace exists and is empty, sign out, and confirm the app shows no
workspace content and requires signing in again.

**Acceptance Scenarios**:

1. **Given** a person without an account, **When** they complete sign-in for the
   first time, **Then** an account and one personal workspace are created and
   they land in it.
2. **Given** a signed-in user, **When** they sign out, **Then** the app shows no
   workspace data and any further request for workspace data requires signing
   in again.
3. **Given** a person who is not signed in, **When** they open any workspace
   page, **Then** they are taken to sign-in and, after signing in, return to the
   page they asked for.
4. **Given** a returning user on a device they signed in on before, **When** they
   open the app within the session lifetime, **Then** they are not asked to sign
   in again.
5. **Given** a person whose email is not on the allow list, **When** they try to
   sign in, **Then** they see that access is by invitation only and no account
   is created.

---

### User Story 2 - Same Data On Phone And Desktop (Priority: P1)

The user changes their workspace settings (week start day, daily capacity, time
zone) on the desktop and sees the same values on the phone, and the other way
around.

**Why this priority**: losing access from anywhere but one computer was the main
weakness of the Obsidian Life Manager. This is the reason for the hosted
product.

**Independent Test**: sign in on two devices, change a setting on one, refresh
the other, and confirm the new value appears.

**Acceptance Scenarios**:

1. **Given** the user is signed in on two devices, **When** they save a new week
   start day on one device, **Then** the other device shows the new value after
   refreshing.
2. **Given** a new workspace, **When** the user opens settings for the first
   time, **Then** the defaults are: week starts on Sunday, the time zone detected
   from the device, and a default daily capacity the user can change.
3. **Given** two devices edit the same setting, **When** both save, **Then** the
   last saved value wins and neither device shows a value that was never saved.
4. **Given** the user enters an invalid value (e.g. a negative capacity), **When**
   they save, **Then** the value is rejected with a clear message and the stored
   value is unchanged.

---

### User Story 3 - My Data Is Only Mine (Priority: P1)

The user trusts that nobody else using Life Manager can see or change their
workspace, and that they cannot see anyone else's.

**Why this priority**: constitution principle VI. A single leak between users
would end the product's credibility.

**Independent Test**: create two accounts, and from the first account attempt
to read and change the second account's workspace data through every available
path; every attempt must behave as if the data does not exist.

**Acceptance Scenarios**:

1. **Given** two users A and B, **When** A requests B's workspace data by any
   identifier, **Then** the response is the same as for data that does not
   exist.
2. **Given** two users A and B, **When** A attempts to change B's data,
   **Then** nothing changes and the response is the same as for data that does
   not exist.
3. **Given** a request that names a workspace different from the signed-in
   user's, **When** it is processed, **Then** the user's own workspace is the
   only one ever read or written.

---

### User Story 4 - Export Everything (Priority: P2)

The user downloads all of their data at any time, both as a machine-readable
file and as readable Markdown.

**Why this priority**: constitution principle VII. It keeps the ownership the
Obsidian setup gave the user, but it delivers no daily value until domain data
exists.

**Independent Test**: with settings saved, request an export and confirm both
formats contain every stored value and nothing from any other account.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they request an export, **Then** they
   receive a machine-readable file and a Markdown version containing all of
   their workspace data.
2. **Given** the export format, **When** a reader opens its documentation,
   **Then** every field in the machine-readable file is described.
3. **Given** two users, **When** user A exports, **Then** the export contains no
   data from user B.

---

### User Story 5 - Delete My Account (Priority: P2)

The user permanently deletes their account and all workspace data.

**Why this priority**: constitution principle VII and privacy law. Needed before
anyone other than the owner uses the product.

**Independent Test**: create an account with data, delete it with
confirmation, and confirm that signing in again starts a new empty workspace
and that the old data is not reachable.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they request account deletion, **Then**
   they must confirm explicitly and are offered an export first.
2. **Given** a confirmed deletion, **When** it completes, **Then** the account
   and all workspace data are no longer reachable and the user is signed out on
   every device.
3. **Given** a deleted account, **When** the same person signs in again,
   **Then** a new, empty account and workspace are created.

---

### User Story 6 - Reliable, Verified Releases (Priority: P2)

The owner releases changes to the web app and the service independently, each
release passes its checks before it goes live, data survives releases, and
backups can be restored.

**Why this priority**: constitution principles VII and VIII. It is the delivery
path every later feature uses.

**Independent Test**: release a change to only the web app, then only the
service, and confirm the other kept working; restore a backup into a separate
environment and confirm the data matches.

**Acceptance Scenarios**:

1. **Given** a change to the service only, **When** it is released, **Then** the
   currently deployed web app keeps working throughout.
2. **Given** a change whose automated checks fail, **When** a release is
   attempted, **Then** it does not go live.
3. **Given** a release, **When** it finishes, **Then** a live smoke check passes
   in the released environment (full sign-in and settings round-trip on
   staging; reduced checks in production for a commit already proven on
   staging).
4. **Given** production data, **When** a restore test is performed, **Then** the
   restored data matches the source as of the backup time.

### Edge Cases

- The user signs in on a device whose time zone differs from the workspace time
  zone (e.g. while travelling): the workspace setting governs dates; the app
  shows which time zone is in use.
- The session expires while the user is editing: the unsaved change is not
  lost silently; the user is asked to sign in and can retry.
- The user loses connectivity while saving: the app reports the save failed and
  never shows an unsaved value as saved.
- The user opens the app offline: the last loaded data is shown read-only with
  an offline notice and the time it was loaded; edit controls are disabled.
- The user opens the app offline on a device that never loaded the workspace:
  the app explains that a connection is needed the first time.
- An allow-listed person is removed from the list: existing data is kept, and
  they cannot sign in again until re-added.
- The sign-in provider is unavailable: the app explains that sign-in is
  temporarily unavailable; already signed-in sessions keep working.
- The user requests a second export while one is running: the user is told one
  is in progress.
- A deletion is requested while another device is signed in: that device loses
  access on its next request.
- A request references a record that does not exist or belongs to another
  workspace: both cases look identical to the requester.

## Requirements *(mandatory)*

### Functional Requirements

**Identity and access**

- **FR-001**: Users MUST be able to sign in with a Google account. No other
  sign-in method is offered in this feature; the design MUST allow adding email
  magic-link sign-in later without changing existing accounts.
- **FR-002**: Only email addresses on an allow list maintained by the owner MAY
  create an account. Sign-in from any other address MUST be refused with a clear
  message and MUST NOT create an account. Opening sign-up later MUST NOT require
  changing existing accounts.
- **FR-003**: On first sign-in the system MUST create one account and exactly
  one personal workspace for it.
- **FR-004**: Users MUST be able to sign out; signing out MUST end access to
  workspace data on that device.
- **FR-005**: Signed-in sessions MUST persist across app restarts on the same
  device for a limited lifetime (see Assumptions) and then require signing in
  again.
- **FR-006**: The product MUST be usable from a phone-sized screen and a desktop
  browser with the same account.

**Tenant isolation**

- **FR-007**: Every stored record of workspace data MUST belong to exactly one
  workspace.
- **FR-008**: Every read and write of workspace data MUST be limited to the
  signed-in user's workspace, enforced by the service regardless of what the
  client sends.
- **FR-009**: Requests for another workspace's data MUST be indistinguishable
  from requests for data that does not exist.
- **FR-010**: Records MUST NOT reference entities that do not exist or belong to
  another workspace; such writes MUST be rejected (referential integrity,
  discovery Q20).

**Workspace settings (the walking-skeleton resource)**

- **FR-011**: Each workspace MUST have settings for week start day, time zone,
  and default daily capacity in minutes.
- **FR-012**: New workspaces MUST default to: week starts Sunday, time zone
  detected from the first device, and a default daily capacity (see
  Assumptions).
- **FR-013**: Users MUST be able to view and change every setting; invalid
  values MUST be rejected with a clear message and leave the stored value
  unchanged.
- **FR-014**: A saved setting MUST be visible on every signed-in device after
  refresh.
- **FR-015**: The app MUST NOT present an unsaved or failed change as saved.

**Online use**

- **FR-016**: Without connectivity, the app MUST show the most recently loaded
  workspace data read-only, clearly marked as offline and as of when it was
  loaded. Changes MUST NOT be accepted offline in this feature.
- **FR-016a**: The design MUST NOT rule out editing offline with later
  synchronization in a future feature.

**Ownership**

- **FR-017**: Users MUST be able to export all of their data as a documented
  machine-readable file and as Markdown at any time.
- **FR-018**: The export format MUST be documented field by field.
- **FR-019**: Users MUST be able to permanently delete their account and all
  workspace data after explicit confirmation, with an export offered first.
- **FR-020**: After deletion, the account's data MUST be unreachable through the
  product immediately and MUST be purged from backups within the backup
  retention window.

**Durability and delivery**

- **FR-021**: Workspace data MUST be backed up automatically at least daily.
- **FR-022**: Restoring from backup MUST be tested successfully before the
  product is relied on and after any change to the backup process.
- **FR-023**: The web app and the service MUST be releasable independently; a
  release of either MUST NOT break the currently deployed version of the other.
- **FR-024**: A release MUST NOT go live unless its automated checks passed on
  the exact version being released.
- **FR-025**: Each release MUST be followed by a live smoke check. On staging it
  covers sign-in and a settings round-trip. In production it covers health,
  refusal of unauthenticated access, the sign-in redirect, and CORS; the same
  commit MUST have passed the staging round-trip before reaching production.
  (Amended 2026-10-04: production sign-in cannot be automated.)
- **FR-026**: Changes to stored data structure MUST keep the currently deployed
  web app and service working during rollout and MUST NOT discard data.
- **FR-027**: Security-relevant events (sign-in, sign-out, export, account
  deletion) MUST be recorded with time and account, without storing workspace
  content.

**Testing**

- **FR-028**: Tenant isolation MUST be covered by automated tests that attempt
  cross-workspace reads and writes for every resource holding workspace data.

### Key Entities

- **Account**: a person who can sign in. Identified through the sign-in method
  (Google now; more methods later); has a display name and email as provided by
  the sign-in method.
- **Allow List Entry**: an email address the owner has allowed to create an
  account.
- **Workspace**: the tenant. Owns all business data. Exactly one per account in
  this feature; designed so membership by more than one account can be added
  later without moving data.
- **Workspace Settings**: week start day, time zone, default daily capacity.
  Belongs to one workspace.
- **Session**: a signed-in device for an account, with an expiry.
- **Security Event**: a record of a sign-in, sign-out, export, or deletion, with
  time and account.
- **Export**: a generated copy of all of an account's workspace data in two
  formats.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user goes from opening the app on a phone to seeing their
  workspace in under 1 minute, measured with the service awake. (Amended
  2026-10-04: the owner chose a hosting plan whose service sleeps when idle and
  takes about a minute to wake; see ADR 0002.)
- **SC-002**: A setting saved on one device appears on a second device within
  5 seconds of refreshing, in 100% of attempts in verification.
- **SC-003**: 100% of automated cross-workspace read and write attempts return
  the same result as for non-existent data.
- **SC-004**: An export of the workspace completes in under 1 minute and
  contains 100% of stored values, verified by comparing export to stored data.
- **SC-005**: After account deletion, 0 records of the account are reachable
  through the product.
- **SC-006**: A restore test recovers 100% of data as of the backup time.
- **SC-007**: Releasing the web app alone and the service alone each cause 0
  failed user requests attributable to version mismatch during verification.
- **SC-008**: 0 releases go live with failing or skipped automated checks.
- **SC-009**: Primary screens (sign-in, settings, export, deletion) are usable on
  a 390px-wide screen without horizontal scrolling.
- **SC-010**: 100% of sign-in attempts from email addresses not on the allow
  list are refused without creating an account.
- **SC-011**: With connectivity off, the last loaded settings are visible
  read-only on the phone in 100% of verification attempts.

## Assumptions

- Each account has exactly one personal workspace; sharing is out of scope
  (constitution, Product Boundaries).
- Sessions on a device last up to 30 days of inactivity, then require sign-in.
- The default daily capacity is 960 minutes (16 waking hours) until the user
  changes it; calibration from history is a later feature (discovery Q19).
- Week start is a workspace setting so it can change later (discovery Q2).
- Backups are kept for 30 days; deleted accounts disappear from backups when
  those age out.
- Data from the 001 localStorage prototype is not imported (decided
  2026-10-03); Obsidian import is a later feature.
- Domain data (activities, cycles, objectives, tasks) is out of scope; it
  arrives in 003 and later features using this foundation.
- The product targets current mobile and desktop browsers; native apps are out
  of scope.
- Hosting, storage technology, sign-in provider, and data-isolation mechanism
  are decided in research for this feature, not in this specification.
- The owner manages the allow list directly (no admin screen is required in this
  feature).
- Users are primarily in Brazil; response times are judged from there. The
  service is hosted in the US east, so each request carries roughly 110–130 ms
  of network latency (ADR 0002).
- The first request after the service has been idle for 15 minutes can take
  about a minute; the app shows the offline copy and a waking-up notice
  meanwhile instead of an error.
