# ADR 0004: Tenant Isolation

**Status**: Accepted (2026-10-04)
**Feature**: `002-cloud-foundation` — evidence in research R5; constitution VI

## Decision

Three layers, all mandatory for every table that holds workspace data:

1. **Application scoping**: every data-access function takes the workspace id
   from the authenticated session; another workspace's data is reported as not
   found.
2. **Row-level security** with `FORCE ROW LEVEL SECURITY`; policies compare
   `workspace_id` with a per-transaction setting
   (`set_config('app.workspace_id', …, true)`); a missing setting matches no
   rows.
3. **Composite foreign keys** `(workspace_id, referenced_id)` so a row cannot
   reference another workspace's row (foreign-key checks bypass row-level
   security).

Roles: a migration role owns tables; the application role is not the owner,
not superuser, has `NOBYPASSRLS`, and only data-manipulation grants. Unique
constraints are scoped by workspace.

## Verification

- Integration tests run as the application role.
- A catalog test fails if a table with `workspace_id` lacks forced row-level
  security, policies, or composite foreign keys for its tenant references.
- A route registry test fails if any route has no cross-tenant test entry or
  explicit public exemption.

## Rejected

Application scoping only; row-level security only (research R5).
