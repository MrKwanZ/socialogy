# Socialogy NestJS Backend

Parallel NestJS + PostgreSQL backend for the Nest/PG revamp. This package does **not** replace [`social-network-app-backend`](../social-network-app-backend) yet.

## Current status

| Phase | Status |
| --- | --- |
| 1 — Foundation (config, GraphQL health, Docker) | Done |
| 2 — `users` / `posts` schema + migrations | Done |
| 3 — Auth GraphQL (`createUser`, `login`, `user`, `updateStatus`) | Done |
| 4 — Posts / feed GraphQL CRUD | Done |
| 5 — Image upload REST + static `/images` | Done |
| 6 — Mongo→PG data migration | Done |
| 7 — Frontend `VITE_API_URL`, root compose, CI | Done |
| 8 — Cutover / retire Express+Mongo | Upcoming |

## Schema (Phase 2)

- **`users`**: UUID PK, unique normalized email, password hash, name, status default `I am new!`, nullable unique `legacy_mongo_id`, timestamps
- **`posts`**: UUID PK, title, content, `image_url`, `creator_id` FK → `users(id)` **ON DELETE RESTRICT**, nullable unique `legacy_mongo_id`, indexes on `created_at` and `creator_id`, timestamps
- **Synchronize**: always off — schema changes go through TypeORM migrations

## Prerequisites

- Node.js 20+
- Docker (for local Postgres)

## Quick start

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run migration:run
npm run start:dev
```

- Health: http://localhost:8080/health
- GraphQL: http://localhost:8080/graphql → `{ health }`

## Docker (Nest + Postgres)

```bash
docker compose up --build
```

Nest listens on host port **8081** so it does not collide with the Express backend on 8080. Production start runs migrations then `node dist/main`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run start:dev` | Watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run migrations, then compiled app |
| `npm run migration:run` | Apply pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run migration:show` | List migration status |
| `npm run test:e2e` | Health, schema, auth, feed, upload, and migrate tests (needs Postgres) |
| `npm run migrate:mongo:dry` | Plan Mongo→PG migration (no writes) |
| `npm run migrate:mongo:execute` | Apply Mongo→PG migration (idempotent) |

### Mongo → PostgreSQL (Phase 6)

```bash
# Requires MONGODB_URI + DB_* in .env; Postgres schema already migrated
npm run migrate:mongo:dry
npm run migrate:mongo -- --execute --copy-images --write-report
```

See [Phase 6 checklist](../docs/revamp/phase-6-checklist.md) for reconciliation exit codes and rollback notes.

## Environment

See [`.env.example`](./.env.example). Required: `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `JWT_SECRET`. `DB_SYNC` is ignored (migrations own the schema). Migration CLI also needs `MONGODB_URI`.

## Docs

- [Phase 1 checklist](../docs/revamp/phase-1-checklist.md)
- [Phase 5 checklist](../docs/revamp/phase-5-checklist.md)
- [Phase 6 checklist](../docs/revamp/phase-6-checklist.md)
- [Phase 7 checklist](../docs/revamp/phase-7-checklist.md)
- [Compatibility contract](../docs/revamp/phase-0-compatibility-contract.md)
