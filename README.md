# Cloud StanOS (Life Manager web app)

Mobile-first web app for Life Manager. This repository also holds the product
documentation: constitution (`.specify/memory/constitution.md`), specifications
(`specs/`), architecture decisions (`docs/adr/`), and the development flow
(`docs/development-flow.md`).

The API lives in a separate repository, `life-manager-backend`.

## Status

Feature `002-cloud-foundation` is in progress: sign-in, a personal workspace,
settings, export, and account deletion against the hosted API. The local-only
daily timeline prototype from feature 001 is no longer part of the app; it
remains in git history and is rebuilt on the API in a later feature.

## Requirements

- Node.js 24 (`nvm use`)

## Run

```bash
npm install
npm run dev
```
