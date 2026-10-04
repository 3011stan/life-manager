# UI Contract: Cloud Foundation

**Feature**: `002-cloud-foundation` | **Date**: 2026-10-04

## Routes (web app)

| Route | Access | Content |
|---|---|---|
| `/sign-in` | Public | "Continue with Google"; shows "Access is by invitation only" when `?error=invitation_only` |
| `/` | Signed in | Redirects to `/settings` in this feature (the daily timeline arrives in 004) |
| `/settings` | Signed in, offline-readable | Week start day, time zone, default daily capacity; Save |
| `/account` | Signed in | Account info, Export (JSON, Markdown), Delete account, Sign out |

The 001 prototype screens are not part of the deployed app.

## States

- **Signed out**: any signed-in route redirects to `/sign-in` and returns to the
  original route after sign-in.
- **Saving**: the Save control shows progress; on failure the previous value
  stays and an error explains why (FR-015).
- **Offline** (FR-016): banner "Offline — showing data from <date, time>"; all
  inputs and actions disabled except Sign out; `/settings` shows the cached
  values. With no cached data: "Connect once to use Life Manager on this
  device."
- **Waking up**: when the API does not answer quickly after idle, show the
  cached data with "Connecting…" instead of an error.
- **Session expired while editing**: keep the unsaved input, ask to sign in,
  allow retry.
- **Delete account**: a dialog offering export first, then requiring the
  confirmation phrase before the Delete button is enabled.

## Layout

- Usable at 390 px width without horizontal scrolling; touch targets at least
  44 px tall; text never overlaps controls (SC-009).
