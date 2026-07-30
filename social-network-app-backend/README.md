# Socialogy Backend

NestJS + PostgreSQL API for Socialogy.

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

**Root stack** (recommended): from the repo root, `docker compose up --build` serves the API on host **8080**.

**Package-local compose** (backend + Postgres only) maps the API to host **8081** so it can run beside another process on 8080. Production start runs migrations then `node dist/main.js`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run start:dev` | Watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run migrations, then compiled app |
| `npm run migration:run` | Apply pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run migration:show` | List migration status |
| `npm run test:e2e` | Health, schema, auth, feed, and upload tests (needs Postgres) |

## Environment

See [`.env.example`](./.env.example). Required: `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `JWT_SECRET`. `DB_SYNC` is ignored (migrations own the schema).
