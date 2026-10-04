# Export Format, Version 1

**Feature**: `002-cloud-foundation` (FR-017, FR-018) | **Date**: 2026-10-04

Every export contains all of the account's data. Later features add sections;
they never remove or rename fields without increasing `formatVersion`.

## JSON (`format=json`)

| Field | Type | Description |
|---|---|---|
| `formatVersion` | integer | `1` for this format |
| `exportedAt` | string (UTC timestamp) | When the export was generated |
| `account.id` | string | Account identifier |
| `account.email` | string | Sign-in email |
| `account.name` | string or null | Display name from the sign-in provider |
| `account.createdAt` | string (UTC timestamp) | Account creation time |
| `workspace.id` | string | Workspace identifier |
| `workspace.createdAt` | string (UTC timestamp) | Workspace creation time |
| `workspace.settings.weekStartDay` | integer 0–6 | 0 = Sunday |
| `workspace.settings.timeZone` | string | IANA time zone |
| `workspace.settings.defaultDailyCapacityMinutes` | integer | Minutes |
| `workspace.settings.updatedAt` | string (UTC timestamp) | Last change |
| `securityEvents[]` | array | This account's events: `type`, `occurredAt` |

Not included: session tokens, provider tokens, hashed values, other accounts'
data.

## Markdown (`format=markdown`)

One document with the same information:

```markdown
# Life Manager Export

Exported: 2026-10-04T18:00:00Z · Format version 1

## Account

- Email: …
- Name: …
- Created: …

## Workspace Settings

- Week starts on: Sunday
- Time zone: America/Sao_Paulo
- Default daily capacity: 960 minutes
- Last changed: …

## Security Events

| Type | When |
|---|---|
| sign_in | … |
```

Every JSON field above appears in the Markdown version; a test compares them.
