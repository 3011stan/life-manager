# ADR 0005: Data Access And Migrations

**Status**: Accepted (2026-10-04); amended 2026-10-18 (dump before migrating)
**Feature**: `002-cloud-foundation` — evidence in research R6; constitution VII

## Decision

- **Drizzle ORM**, version pinned to 0.45.x; schema in TypeScript.
- Migrations are generated as SQL, then **reviewed and edited by hand** before
  commit. Row-level security, `FORCE`, roles, and grants live in custom SQL
  migrations.
- Every schema change follows expand/contract: add compatible structure,
  deploy code that uses it, remove the old structure in a later release. A
  migration never drops or rewrites data without a documented data migration.
- Migrations run from GitHub Actions under the migration role, after CI passes
  and before the Render deploy hook is triggered (ADR 0002). Because they run
  while the previous API version is still serving, every migration must be
  compatible with it.

- **Amended 2026-10-18**: with one hosted environment, migrations reach real
  data directly, so the deploy pipeline takes a logical dump of the database
  and stores it in the backup bucket (R2) before running migrations; if the
  dump fails, nothing is migrated or deployed.

## Consequences

- Drizzle 1.0 changes the migration folder layout; upgrading is a separate,
  planned task.

## Rejected

Kysely (close second), Prisma, MikroORM, raw SQL generators (research R6).
