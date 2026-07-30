# Socialogy Backend

Production NestJS + PostgreSQL API for Socialogy. Former Express/Mongo sources are frozen under [`../archive/social-network-app-backend-express`](../archive/social-network-app-backend-express).

## Schema

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

## Docker

**Root stack** (recommended): from the repo root, `docker compose up --build` serves Nest on host **8080**.

**Package-local compose** (backend + Postgres only) maps Nest to host **8081** so it can run beside another process on 8080. Production start runs migrations then `node dist/main.js`.

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

### Mongo → PostgreSQL (one-off cutover)

```bash
# Requires MONGODB_URI + DB_* in .env; Postgres schema already migrated
npm run migrate:mongo:dry
npm run migrate:mongo -- --execute --copy-images --write-report
```

See the [migration checklist](../docs/revamp/phase-6-checklist.md) and [cutover runbook](../docs/revamp/phase-8-cutover-runbook.md).

## Environment

See [`.env.example`](./.env.example). Required: `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `JWT_SECRET`. `DB_SYNC` is ignored (migrations own the schema). One-off Mongo migrate also needs `MONGODB_URI`.

## Docs

- [Cutover runbook](../docs/revamp/phase-8-cutover-runbook.md)
- [Cutover checklist](../docs/revamp/phase-8-checklist.md)
- [Migration checklist](../docs/revamp/phase-6-checklist.md)
- [Compatibility contract](../docs/revamp/phase-0-compatibility-contract.md)
