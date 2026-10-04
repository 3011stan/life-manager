# API Contract: Cloud Foundation

**Feature**: `002-cloud-foundation` | **Date**: 2026-10-04

Human-readable contract. The authoritative machine contract is the backend's
generated `openapi.json` (ADR 0007); it must match this document.

## Base URLs

| Environment | API | Web app (allowed origin) |
|---|---|---|
| Production | `https://api.life.bystan.tech` | `https://life.bystan.tech` |
| Staging | `https://api.life-staging.bystan.tech` | `https://life-staging.bystan.tech` and Vercel preview origins |
| Local | `http://localhost:4000` | `http://localhost:3000` |

## Cross-Cutting Rules

- **Authentication**: session cookie set by the API (ADR 0003). Requests send
  credentials; there are no bearer tokens in this feature.
- **Workspace scope**: no endpoint takes a workspace id. The workspace is
  resolved from the session (FR-008).
- **State-changing requests** (`POST`, `PATCH`, `DELETE`) must:
  - come from an allowed `Origin`, otherwise `403`;
  - not carry `Sec-Fetch-Site: cross-site`, otherwise `403`;
  - use `Content-Type: application/json`, otherwise `415`;
  - carry an `Idempotency-Key` header (UUID) on workspace mutations; a replay
    returns the stored response; the same key with a different body returns
    `422`.
- **Errors** use `application/problem+json`: `type`, `title`, `status`,
  `detail`, and for validation errors `errors[]` with `field` and `message`.
- **Not found and foreign data**: a resource that does not exist and a resource
  of another workspace both return `404` with the same body (FR-009).
- **Unauthenticated**: `401`; the web app redirects to sign-in and returns to
  the requested page afterwards.
- **Versioning**: paths are prefixed with `/v1`. Changes follow expand/contract
  (ADR 0007).

## Endpoints

### Health

`GET /health` — public. `200 {"status":"ok","version":"<git sha>"}`. Used by
Render and the post-deploy smoke check.

### Authentication (provided by the auth library, prefix `/auth`)

| Endpoint | Purpose |
|---|---|
| `POST /auth/sign-in/social` `{ "provider": "google", "callbackURL": "<web app URL>" }` | Starts Google sign-in; returns the redirect URL |
| `GET /auth/callback/google` | Google redirect target; creates account and workspace on first allowed sign-in; refused emails are redirected to `<web app>/sign-in?error=invitation_only` without creating anything |
| `POST /auth/sign-out` | Ends the current session |
| `GET /auth/get-session` | Current session or `null` |

Exact paths follow the library's conventions and are recorded in `openapi.json`.

### Test sign-in (local and staging only)

`POST /test/sign-in` `{ "email": "…" }` → sets a session cookie for an allowed
email. **Not registered in production builds**; a backend test fails if it is.

### Me

`GET /v1/me` → `200`

```json
{
  "account": { "id": "…", "email": "…", "name": "…", "image": "…" },
  "workspace": { "id": "…" }
}
```

### Workspace settings

`GET /v1/workspace/settings` → `200`

```json
{
  "weekStartDay": 0,
  "timeZone": "America/Sao_Paulo",
  "defaultDailyCapacityMinutes": 960,
  "version": 3,
  "updatedAt": "2026-10-04T18:00:00Z"
}
```

`PATCH /v1/workspace/settings` with any subset of
`weekStartDay` (0–6), `timeZone` (IANA name), `defaultDailyCapacityMinutes`
(1–1440) → `200` with the full settings object. Invalid values → `422` with
field errors; nothing is stored. Last write wins.

### Export

`GET /v1/export?format=json` → `200`, `Content-Disposition: attachment`,
`application/json` per [export-format.md](export-format.md).

`GET /v1/export?format=markdown` → `200`, `Content-Disposition: attachment`,
`text/markdown`.

A second export request while one is running for the same account → `409`.
Each export writes an `export` security event.

### Account deletion

`DELETE /v1/account` with body `{ "confirmation": "DELETE MY ACCOUNT" }` →
`204`; all sessions revoked; cookie cleared. Missing or wrong confirmation →
`422`.
