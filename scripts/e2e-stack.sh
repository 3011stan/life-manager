#!/usr/bin/env bash
# 004 T007: the whole app on one machine (Postgres with Render's text
# ordering, API, production web build), then the Playwright suite. Used by CI
# in both repositories. Expects Postgres on localhost:5432 with superuser
# postgres/postgres, and BACKEND_DIR and WEB_DIR pointing at checkouts.
set -euo pipefail
: "${BACKEND_DIR:?}" "${WEB_DIR:?}"
export PGPASSWORD=postgres
# Throwaway values for a disposable stack; never used anywhere else.
SECRET=ci-e2e-test-sign-in-secret-ci-e2e-0001
AUTH_SECRET=ci-e2e-auth-secret-ci-e2e-auth-secret-0001
OWNER=postgresql://life_owner:life_owner@localhost:5432/life_manager
APP=postgresql://life_app:life_app@localhost:5432/life_manager

psql -h localhost -U postgres -v ON_ERROR_STOP=1 -q <<'SQL'
CREATE ROLE life_owner LOGIN PASSWORD 'life_owner' NOSUPERUSER CREATEROLE NOBYPASSRLS;
CREATE ROLE life_app LOGIN PASSWORD 'life_app' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
CREATE DATABASE life_manager OWNER life_owner TEMPLATE template0 LOCALE_PROVIDER icu ICU_LOCALE 'en-US' LOCALE 'C.UTF-8';
GRANT CONNECT ON DATABASE life_manager TO life_app;
SQL

cd "$BACKEND_DIR"
npm ci --no-audit --no-fund
MIGRATION_DATABASE_URL=$OWNER npx tsx scripts/migrate.ts
for account in e2e e2e-cycles e2e-locale e2e-export-desktop e2e-export-mobile e2e-delete-desktop e2e-delete-mobile; do
  MIGRATION_DATABASE_URL=$OWNER npx tsx scripts/allow-email.ts "$account@example.test" e2e >/dev/null
done
APP_ENV=local PORT=4000 DATABASE_URL=$APP BETTER_AUTH_SECRET=$AUTH_SECRET BETTER_AUTH_URL=http://localhost:4000 \
  GOOGLE_CLIENT_ID=ci GOOGLE_CLIENT_SECRET=ci WEB_APP_ORIGIN=http://localhost:3000 TEST_SIGN_IN_SECRET=$SECRET \
  npx tsx src/server.ts > "$RUNNER_TEMP/api.log" 2>&1 &

cd "$WEB_DIR"
npm ci --no-audit --no-fund
NEXT_PUBLIC_API_URL=http://localhost:4000 NEXT_PUBLIC_TEST_SIGN_IN=true npm run build
npx next start -p 3000 > "$RUNNER_TEMP/web.log" 2>&1 &
npx playwright install --with-deps chromium >/dev/null

for _ in $(seq 1 60); do
  curl -sf localhost:4000/health >/dev/null && curl -sf localhost:3000/sign-in >/dev/null && break
  sleep 2
done

# No traces or screenshots leave the runner: the web repository is public and
# a failure snapshot can show what was typed (002 T061 note).
if ! E2E_TEST_SIGN_IN_SECRET=$SECRET npx playwright test --reporter=line; then
  echo "--- last API log lines ---"
  tail -n 40 "$RUNNER_TEMP/api.log" | cut -c1-300
  exit 1
fi
