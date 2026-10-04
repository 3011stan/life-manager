# ADR 0003: Authentication And Sessions

**Status**: Accepted (2026-10-04)
**Feature**: `002-cloud-foundation` — evidence in research R4

## Context

Google sign-in now, magic link later without changing accounts; owner-managed
allow list; revocable sessions lasting 30 days of inactivity; account deletion
signs out every device; security events recorded; tenancy enforced by the API.

## Decision

- **Better Auth inside the Fastify API**, using only the core and the Google
  provider. Version pinned; advisories monitored.
- Database-backed sessions: 30-day expiry with sliding refresh; **cookie cache
  disabled**; all sessions revoked on account deletion.
- Allow list stored in our database and enforced in the user-creation hook; a
  refused sign-in creates nothing and returns an "invitation only" response.
- Workspaces and memberships are our own tables; Better Auth's organization
  plugin is not used.
- Cookie: `__Secure-` prefix, `HttpOnly`, `Secure`, `SameSite=Lax`,
  `Domain` set to the app's own subdomain (`life.bystan.tech` in
  production, see ADR 0002), never to `bystan.tech`.
- Every state-changing route checks `Origin` against an exact allow list,
  rejects `Sec-Fetch-Site: cross-site`, and accepts only JSON. CORS allows only
  the app origin, with credentials. Other `bystan.tech` subdomains count as
  the same site, so the Origin check is what blocks them.
- Previews and automated tests sign in through a test sign-in available only
  in local and staging configurations; a test fails if it is registered in a
  production build.

## Consequences

- Auth tables (user, session, account, verification) follow Better Auth's
  schema and are migrated with ours.
- Vercel owns Better Auth since July 2026; the exit path is a hand-rolled
  session layer (research R4 runner-up), which the simple schema allows.

## Rejected

Auth.js, hand-rolled OAuth (runner-up), Clerk, Auth0, Supabase Auth, WorkOS,
Firebase (reasons in research R4).
