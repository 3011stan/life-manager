# ADR 0002: Hosting Topology And Environments

**Status**: Accepted (2026-10-04); amended 2026-10-18 (one hosted environment)
**Feature**: `002-cloud-foundation` — evidence in `specs/002-cloud-foundation/research.md` (R2, R3)

## Context

Two independently released parts (web app, API) and one database, used mainly
from Brazil, at near-zero cost with no users yet, with migrations before new
versions take traffic, tested restores, staging, and frontend previews. The
owner already runs another project on Render (API) and Vercel (frontend) and owns
the domain `bystan.tech`.

## Decision

- **API**: Render web service (Docker), region Virginia (US east), **Free plan
  for staging and production**. Upgrading to a paid plan needs no code change.
- **Database**: Render Postgres in the same region. **Production on the paid
  Basic plan** (the free database expires after 30 days); staging on the free
  plan, recreated by a script when it expires (staging data is disposable).
- **Web app**: Vercel, Hobby while the product is personal and non-commercial,
  Pro before any commercial use. Functions stay in the default US-east region,
  next to the API.
- **Domains** (all under `bystan.tech`):

  | Environment | Web app | API | Session cookie domain |
  |---|---|---|---|
  | Production | `life.bystan.tech` | `api.life.bystan.tech` | `life.bystan.tech` |
  | Staging | `life-staging.bystan.tech` | `api.life-staging.bystan.tech` | `life-staging.bystan.tech` |

  The cookie is never scoped to `bystan.tech`, so other projects on the domain
  never receive it, and production cookies never reach staging.
- **Migrations**: Render Free has no pre-deploy command, so GitHub Actions runs
  migrations against the target database **after CI passes and before
  triggering the Render deploy hook**. Safe because every migration is
  expand-only until a later contract release (ADR 0005).
- **Backups**: Render's built-in backups plus a **nightly logical dump to
  Cloudflare R2, kept 30 days**. A scheduled restore drill restores the latest
  dump into a scratch database and compares row counts and checksums.
- **Environments**: local (Docker Compose Postgres), staging, production.
  Vercel previews point at staging.

## Amendment 2026-10-18: one hosted environment

- The environment provisioned as staging is the **only hosted environment** and
  will hold real data. It becomes production later **without moving data**; its
  names (`life-staging.bystan.tech`, `api.life-staging.bystan.tech`, GitHub
  environment `staging`, `APP_ENV=staging`) stay until the owner renames them.
- Its database moves from Free to **Basic** before real data is stored (the
  owner upgrades it in place); until then it is disposable and
  `scripts/recreate-staging-db.sh` recreates it.
- Nightly dumps to R2 and the restore drill target this environment and must
  pass before real data is stored.
- Vercel previews and the staging branch both point at this API, so previews
  see real data; the test sign-in secret (ADR 0003) is what keeps them from
  being an open door.
- Separate production provisioning (database, service, domains, OAuth client)
  is deferred until a second environment is wanted.

## Consequences

- **Latency**: Render has no South America region; each request from Brazil
  adds roughly 110–130 ms. API and database share a region, so database round
  trips stay short.
- **Cold starts**: free web services sleep after 15 minutes idle and take about
  a minute to wake. SC-001 is measured with the service awake (spec amended).
  The offline cache shows last data while the API wakes.
- Free instance hours are shared by every free service in the Render
  workspace (including other projects).
- The GitHub Actions deploy job needs the migration database URL and the Render
  deploy hook as repository secrets; runtime secrets stay in Render.
- The 30-day retention depends on the nightly dump job; its failure must alert.

## Rejected

- Fly.io + Neon in São Paulo (originally proposed): better latency, but the
  owner prefers the existing Render and Vercel setup.
- Render Starter for production (~US$7/month): avoids cold starts; deferred.
- Supabase, Neon (research R2).
