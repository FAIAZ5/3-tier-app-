# 3-Tier Application (Docker)

A containerised three-tier web application: a React frontend, a Node/Express API, and a PostgreSQL database, orchestrated with Docker Compose. The whole stack runs with a single command.

I built this to get hands-on with the parts of containerisation that actually matter in production — image size, build caching, network isolation between tiers, secret handling, and health checks — rather than just getting something to run.

## Architecture

```
Browser
   │
   │  http://localhost:3000        (loads the UI)
   │  http://localhost:5000/items  (fetches data)
   ▼
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  frontend   │ --> │   backend   │ --> │   database   │
│ React/nginx │     │ Node/Express│     │  PostgreSQL  │
└─────────────┘     └─────────────┘     └──────────────┘
   frontend net      frontend +           backend net
                     backend net          (isolated)
```

Two Docker networks enforce the tier boundaries. The frontend sits on the `frontend` network only, the database on the `backend` network only, and the backend bridges both. This means the browser-facing frontend has no network path to the database — all data access has to go through the API, which is where validation and parameterised queries live.

## Stack

| Tier | Technology |
|------|-----------|
| Frontend | React (built with `npm run build`, served by nginx) |
| Backend | Node.js + Express, `pg` for PostgreSQL |
| Database | PostgreSQL 16 |
| Orchestration | Docker Compose |

## Running it

You need Docker installed. Then:

```bash
# 1. Create your local env file from the template
cp .env.example .env
# edit .env and set a DB_PASSWORD

# 2. Build and start everything
docker compose up --build
```

Then open http://localhost:3000.

To stop:

```bash
docker compose down          # keeps the database volume
docker compose down -v       # also wipes the database volume
```

## Some of the decisions behind it

A few things I did deliberately, with the reasoning:

**Single-stage backend, multi-stage frontend.** The frontend has a real build step — React source has to be compiled into static files — so it uses a multi-stage build: stage one compiles with the full Node toolchain, stage two copies only the built output into a small nginx image. The final frontend image is ~74MB instead of carrying the whole build toolchain. The backend runs its source directly with no build step, so multi-stage would add complexity without shrinking anything — a single stage with a production-only install is the cleaner choice.

**`npm ci` with a committed lockfile.** Both images install with `npm ci --omit=dev` (backend) against a committed `package-lock.json`, so builds are reproducible and ship only production dependencies. The `.dockerignore` excludes `node_modules` but keeps the lockfile, which `npm ci` needs.

**Non-root containers.** The backend drops to the built-in `node` user; the frontend uses the unprivileged nginx image. Neither runs as root.

**Health checks.** The backend exposes `/health` (liveness — is the process up) and `/ready` (readiness — can it actually reach the database, tested with a real query). The backend Dockerfile wires a `HEALTHCHECK` to `/health`. These are the endpoints an orchestrator like Kubernetes would probe.

**Secrets stay out of the repo.** The database password is read from a gitignored `.env` file via `${DB_PASSWORD}`. The committed `.env.example` documents the required variables with placeholder values only.

**Data persistence.** PostgreSQL data lives in a named volume, so it survives container restarts. The schema is initialised once from `database/init.sql` on first startup.

## Project layout

```
.
├── backend/            Node/Express API
│   ├── server.js       routes, health checks, graceful shutdown
│   ├── db.js           connection pool, env validation
│   └── Dockerfile      single-stage, production-only
├── frontend/           React app
│   ├── src/
│   └── Dockerfile      multi-stage build → nginx
├── database/
│   └── init.sql        schema + seed data
├── docker-compose.yml  ties the three tiers together
└── .env.example        required environment variables
```

## Notes and next steps

This currently runs locally via Compose. The direction I'm taking it next is a CI pipeline (lint, test, build the images) and deploying it to a cloud environment. The `depends_on` in Compose only waits for the database container to start, not for Postgres to be fully ready to accept connections, which is why the backend has its own connection handling and a readiness endpoint — in a Kubernetes setup that gap is closed with a proper readiness probe.
