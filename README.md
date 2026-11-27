# Task Manager API

Express + PostgreSQL REST API for the Task Management App. The database is
[Lakebase Postgres on Neon](https://neon.com/docs/introduction/branching); the app uses the pooled
connection string for requests and the direct connection string for DDL.

## Related repository

- **Client:** [sprout-assessment-frontend](https://github.com/David-Uk/sprout-assessment-frontend)
  — the React (Vite) app that consumes this API. Point it at this API with `VITE_API_BASE_URL`;
  the API must be running first.

The SQL scripts and CI configuration live in **this** repository, not in the client repo.

---

## Prerequisites

- Node.js 20+ and npm (`node --version`, `npm --version`)
- Neon CLI: `npm i -g neon@latest` (fallback: `npx neon@latest ...`)
- A Neon account with access to the project. Sign in with `neon login` (browser) if the CLI reports
  "Not signed in".
- Optional: Docker Desktop if you prefer local PostgreSQL via `docker compose up -d db` instead of
  Neon. The tests require a reachable Postgres database either way.

---

## 1. Install dependencies

```bash
npm ci
```

## 2. Create a Neon database and connect the project

### 2.1 Create a Neon account and database (first time)

1. **Create an account.** Go to [console.neon.tech](https://console.neon.tech) and sign up with an
   email address, GitHub or Google. Verify your email if prompted. The free tier is enough for this
   project.
2. **Create a project.** In the Console, go to **Organization → Projects → New project**. Give it a
   name (e.g. `sprout-assessment`), pick a region close to you or your users and a Postgres version,
   then create it. Neon creates a default branch called `production` containing a database named
   `neondb` and a role named `neondb_owner` — that database is fine to use as-is. To use a different
   name, open the SQL editor and run `CREATE DATABASE sprout_tasks;` (or use **Databases → New
   database**), then select that database in the Connect modal below.
3. **Create a separate test branch.** Go to **Branches → New branch**, name it `test`, branch it from
   `production` and create it. Tests must never run against production data. With the CLI, the
   equivalent is `neon branches create --name test --parent production --no-secrets`.
4. **Get the connection strings.** Click **Connect** in the Console nav. Choose the branch
   (`production`), compute, database and role. With **Connection pooling** on, copy the *pooled*
   string — its hostname contains `-pooler`. Turn pooling off (or remove `-pooler`) for the *direct*
   string. Repeat with the `test` branch to get its two strings. A pooled URL looks like
   `postgresql://role:password@ep-...-pooler.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require`.
   The CLI equivalents are `neon connection-string production --pooled` (pooled),
   `neon connection-string production` (direct), and the same with `test` as the branch name.
   The URL encodes the role, password, host and database name; use **Reset password** in the Console
   if you do not know the role's password. Treat these strings as passwords — never commit them.
5. **Put the strings in the env files.** Copy `.env.example` to `.env` and set `DATABASE_URL` to the
   pooled production string and `DATABASE_URL_UNPOOLED` to the direct production string. Copy
   `.env.test.example` to `.env.test` and set `DATABASE_URL_TEST` to the pooled test string and
   `DATABASE_URL_TEST_UNPOOLED` to its direct string. The table below maps every field. On Vercel,
   set `DATABASE_URL` to the pooled production string (see [Deployment](#deployment-vercel)).

The `neon init` commands below are only needed to reuse the already-linked project in this
repository; skip them if you created your own project and filled in the env files yourself.

### 2.2 Use the already-linked project

The repo is already linked via `.neon` and declares its services in `neon.ts`. To reproduce the
setup in a fresh clone:

```bash
neon login
neon init -y --org-id org-ancient-thunder-62671469 \
  --project-id odd-water-00500838 --branch production \
  --services postgres --no-agent-setup
neon deploy
```

`neon deploy` applies `neon.ts` and pulls the branch env vars into `.env`
(or `.env.local` if a `.env` does not exist). It prints which variables were pulled, for example
`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEON_BRANCH`, `NEON_BRANCH_ID`.

If you are not using Neon, copy `.env.example` to `.env` and set your own values. Never commit
`.env`.

### Environment variables

| Variable | Set it in | What to put there |
|---|---|---|
| `DATABASE_URL` | `.env`, Vercel (all environments) | **Pooled** Neon URL for `production` (hostname ends in `-pooler`). Used by `src/db.js` for every app query, including `/health`. |
| `DATABASE_URL_UNPOOLED` | `.env` | **Direct** Neon URL for `production` (no `-pooler`). Used only by `npm run db:init` / `db:seed` for DDL. |
| `DATABASE_URL_TEST` | `.env.test`, CI env | **Pooled** URL of the `test` branch. `test/setup.js` injects it as `DATABASE_URL` before the app is loaded. |
| `DATABASE_URL_TEST_UNPOOLED` | `.env.test`, CI env | **Direct** URL of the `test` branch, used by the schema helper that resets tables between tests. |
| `NODE_ENV` | `.env` (`development`), `.env.test`/CI (`test`) | `development`, `test` or `production`; controls dev CORS and request logging. Vercel sets `production` itself. |
| `PORT` | `.env` | Local HTTP port, default `3000`. Ignored on Vercel. |
| `CORS_ORIGIN` | `.env`, Vercel | Comma-separated frontend origin(s): `http://localhost:5173` locally, `https://sprout-assessment-frontend.vercel.app` deployed. A trailing slash is stripped automatically. |
| `DB_POOL_MAX` | `.env`, Vercel | Maximum `pg` connections per process; default `10`, set to `3` on Vercel to keep serverless pools small. |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DB_PORT` | `.env` (Docker Compose only) | Credentials for the optional local container in `docker-compose.yml`. Leave these out when using Neon. |
| `LOG_LEVEL`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | `.env` | Tuning placeholders; `config.js` currently uses fixed values, so changing them has no effect yet. |
| `NEON_BRANCH`, `NEON_BRANCH_ID` | pulled by `neon env pull` | Neon CLI context only; the API does not read them. |

TLS is enabled automatically when the connection host is a Neon host. `.env.local` is loaded before
`.env`, so it takes precedence when both exist.

In development (`NODE_ENV=development`), any `http://localhost:<port>` or
`http://127.0.0.1:<port>` origin is also allowed. Vite silently moves to the next free port when
5173 is busy (5174, 5175, …), so a strict single-port allow-list would cause the client's requests
to be blocked by CORS and surfaced as "API unreachable". Production and test use only the explicit
`CORS_ORIGIN` list.

## 3. Apply the database scripts

```bash
npm run db:init    # database/schema.sql — creates tasks table + status index
npm run db:seed    # database/seed.sql — inserts 5 sample tasks
```

Both scripts are safe to re-run: the schema uses `IF NOT EXISTS` and the seed skips titles that are
already present. Migrations use the direct URL; application queries use the pooled URL.

The SQL is modular: `schema.sql` and `seed.sql` are entry points containing ordered
`-- @include <relative path>` directives. `scripts/sql-loader.js` expands them (with circular-include
detection) before execution, so each table, index and seed set lives in its own file under
`database/schema/` or `database/seed/`. The same loader is used by the test setup.

## 4. Run the API

```bash
npm run dev        # auto-reload on changes
# or
npm start          # production-style start
```

The server listens on `http://localhost:3000` by default. Check it with:

```bash
curl http://localhost:3000/health
# {"status":"ok","database":true}
```

`npm run build` runs `node --check` over every source and script file. This project is plain
CommonJS JavaScript, so there is no bundling step.

## 5. Run the tests

Tests use **Mocha + Chai + chai-http** against a separate Neon branch, never production data.

Create a test branch once:

```bash
neon branches create --name test --parent production --no-secrets
neon connection-string test            # direct URL
neon connection-string test --pooled   # pooled URL
```

Copy `.env.test.example` to `.env.test` and paste those two URLs as `DATABASE_URL_TEST` and
`DATABASE_URL_TEST_UNPOOLED`. Then:

```bash
npm test
npm run test:coverage   # c8: text report + HTML/lcov files in coverage/
```

`test/setup.js` loads `.env.test` before the app is imported, so all database calls go to the test
branch. `test/helpers/db.js` applies `schema.sql` once and truncates/re-seeds `tasks` before every
test. Coverage includes explicit database connectivity (`SELECT 1` through the pool and the
`/health` endpoint) plus the task endpoints, validation, 404 handling, malformed ids, status
filtering, pagination, CORS and the docs routes. A clean copy of the project (only committed-style
files, no `node_modules` or local env files) was verified with `npm ci` followed by `npm test` using
the test database URLs supplied through environment variables.

---

## API reference (Scalar)

With the API running, open **http://localhost:3000/docs** (or the index route **/**, which redirects
there) for the interactive Scalar reference. It
is generated from the OpenAPI 3.1 document served at **`/docs/openapi.json`** (source file:
`docs/openapi.json`) and covers every endpoint, request/response schema and error shape, with
examples and a built-in request client. The page loads the Scalar bundle from jsDelivr, so viewing
it requires internet access.

## CI

`.github/workflows/ci.yml` runs on every push and on pull requests to `main`. It uses Node 22 from
`.nvmrc`, npm dependency caching and a Postgres 16 service container. The steps are `npm ci`,
`npm run lint`, `npm run build`, `npm run db:init` and `npm test`. The database URLs are throwaway
local values declared in the workflow — no GitHub Secrets are needed.

## Deployment (Vercel)

The API is deployed at **https://sprout-assessment-backend.vercel.app**. The Vercel project
`sprout-assessment-backend` is linked to this repository (`.vercel/` is gitignored) and uses
Vercel's zero-configuration Express detection — `src/app.js` exports the Express app, so no
`vercel.json`, build command or output directory is needed.

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | Neon pooled connection string | Stored as a Vercel Secret; never commit it |
| `CORS_ORIGIN` | `https://sprout-assessment-frontend.vercel.app` | Change this if the client is hosted elsewhere; trailing slashes are stripped |
| `DB_POOL_MAX` | `3` | Keeps the per-function pool small; Neon's pooler handles concurrency |

`NODE_ENV=production` is set by Vercel automatically. In production only the explicit
`CORS_ORIGIN` list is trusted; development additionally allows any `localhost` port.

Deploy from the CLI (uploads the current files and builds on Vercel's Linux builders):

```bash
vercel deploy --prod --yes
```

Local `vercel build` on Windows requires Developer Mode or an elevated shell because the CLI
creates symlinks in its build cache; the remote build path above avoids that. Pushes to the linked
GitHub repository also create deployments, but only committed changes are included. `.vercelignore`
excludes `.env*`, `node_modules`, coverage data and tests from uploads.

Deployment Protection (Vercel Authentication) is disabled because this is a public, unauthenticated
API. Point the deployed client at `https://sprout-assessment-backend.vercel.app/api` via
`VITE_API_BASE_URL`. Any additional deployed client origin must be added to `CORS_ORIGIN` with
`vercel env add CORS_ORIGIN --environment production --force`.

## API summary

All responses are JSON. Errors use `{ "error": { "code": "...", "message": "..." } }`.

| Method | Path | Success | Notes |
|---|---|---|---|
| GET | `/health` | 200 | Reports `{ status: "ok", database: true }` |
| GET | `/api/tasks` | 200 | `{ data: [...], count, page, limit, total }`, newest first; optional `?status=`, `?page=`, `?limit=` |
| POST | `/api/tasks` | 201 | Body: `title` (1–150), optional `description` (≤1000), optional `status` |
| PATCH | `/api/tasks/:id/status` | 200 | Body: `status`; 400 for bad id/status, 404 if missing |

Allowed statuses: `pending`, `in_progress`, `completed`.

Example:

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Write README","description":"Document setup","status":"pending"}'

curl -X PATCH http://localhost:3000/api/tasks/1/status \
  -H 'Content-Type: application/json' \
  -d '{"status":"in_progress"}'
```

---

## Architecture (MVC)

The API follows a layered MVC-style structure:

```
route → controller → service → model → Postgres
              ↓
          JSON view
```

- **Routes** (`src/routes/`) only map URLs to controller methods.
- **Controllers** (`src/controllers/`) read the request, call a service and hand the result to a view.
- **Services** (`src/services/`) hold validation and business rules and throw `AppError`.
- **Models** (`src/models/`) never hand-write SQL strings. They call operation-specific builders in
  `sql-builder.js` — `buildSelect`, `buildInsert`, `buildUpdate`, `buildDelete`, `buildCount` — passing
  custom columns, filters, ordering, limits and values. All values are parameterised and identifiers
  are validated, so no SQL appears in controllers.
- **Views** (`src/views/`) shape the JSON responses (the API has no HTML templates).
- **Middleware** (`src/middleware/`) validates body/params/query, handles unknown routes and maps errors
  to the standard shape. Helmet, a CORS allow-list, a 10 KB JSON body limit, rate limiting and
  non-sensitive request logging are wired in `src/app.js`.
- `src/app.js` only wires middleware and routers; `src/server.js` starts the listener.

## Project structure

```
.
├── database/
│   ├── schema.sql          # entry point → @include schema/*.sql
│   ├── schema/
│   │   ├── 001_tasks_table.sql
│   │   ├── 002_tasks_index.sql
│   │   └── 003_query_reference.sql
│   ├── seed.sql            # entry point → @include seed/*.sql
│   └── seed/
│       └── 001_tasks.sql
├── docs/
│   └── openapi.json        # OpenAPI 3.1 source for the Scalar reference
├── scripts/
│   ├── sql-loader.js       # expands @include in SQL entry points
│   ├── init-db.js          # npm run db:init
│   └── seed-db.js          # npm run db:seed
├── src/
│   ├── app.js              # Express wiring only (exported for tests)
│   ├── config.js           # env loading/validation
│   ├── db.js               # pg pool + query/close
│   ├── server.js           # listener + graceful shutdown
│   ├── routes/             # URL → controller mapping
│   ├── controllers/        # HTTP request/response coordination
│   ├── services/           # validation + business rules
│   ├── models/             # repository layer (built SQL)
│   │   ├── sql-builder.js  # operation-specific query builders
│   │   └── task.model.js   # calls builders with custom parameters
│   ├── views/              # JSON response shapes + Scalar HTML
│   ├── middleware/         # validation, 404 + central error handler
│   └── utils/              # AppError
├── test/
│   ├── setup.js            # test env + Mocha root hooks
│   ├── helpers/db.js       # schema apply + reset/seed
│   ├── connectivity.test.js
│   ├── docs.test.js
│   ├── sql-builder.test.js
│   └── tasks.test.js
├── .env.example / .env.test.example
├── .mocharc.json
├── .github/workflows/ci.yml # lint, build, schema, tests on push/PR
├── .nvmrc                  # Node 22
├── neon.ts                 # Neon branch policy
└── package.json
```

---

## Branch-first workflow

`neon.ts` declares Postgres only and gives new non-default branches a 7-day TTL. Use
`neon checkout <name> --create` for isolated work; it also pulls that branch's env. Use
`neon diff` to inspect schema changes before applying them to production.

## Outstanding / known limitations

- The client repository is a Vite scaffold; the UI features in Phase 4 are not implemented yet.
- The CI workflow exists and its steps were verified locally, but it has not run on GitHub because
  no commits have been pushed.
- HTTP tests use chai-http rather than Supertest (per the current testing choice).
- Tests need a reachable Neon test branch; they will not run fully offline.
- `pg` prints a non-fatal SSL-mode deprecation warning with the current driver version.
- No commits or pushes have been made yet for this work.
