# ADR 0003: Authentication And Sessions

**Status**: Accepted (2026-10-04); amended 2026-10-18 (test sign-in secret)
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
- **Amended 2026-10-18**: the test sign-in also requires a secret
  (`TEST_SIGN_IN_SECRET` in the API, at least 32 characters), compared in
  constant time; without it configured the route is not registered. A wrong
  secret gets the same refusal as an email off the allow list and is recorded
  as a security event. The web form asks for the secret as a password field; it
  is never embedded in the web build (`NEXT_PUBLIC_*`). The release pipeline
  holds it as a GitHub secret for the smoke check. Reason: with one hosted
  environment holding real data (ADR 0002 amendment), an allow-listed email
  alone would let anyone into that account.

## Consequences

- Auth tables (user, session, account, verification) follow Better Auth's
  schema and are migrated with ours.
- Vercel owns Better Auth since July 2026; the exit path is a hand-rolled
  session layer (research R4 runner-up), which the simple schema allows.

## Rejected

Auth.js, hand-rolled OAuth (runner-up), Clerk, Auth0, Supabase Auth, WorkOS,
Firebase (reasons in research R4).
