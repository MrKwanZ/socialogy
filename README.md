# Socialogy

A full-stack social network application. Users can sign up, log in, update their status, and create, view, edit, and delete posts with image uploads. The React frontend talks to a **NestJS + PostgreSQL** backend over GraphQL and a REST image-upload endpoint.

> **Revamp status:** Phases 0–7 of the Nest/PG migration are done. The Express/Mongo package remains in-repo for rollback until Phase 8 cutover. Root Docker and the recommended local path use Nest + Postgres.

## Project Structure

```
socialogy/
├── docker-compose.yaml              # Nest backend, frontend, PostgreSQL
├── .github/workflows/ci.yml         # Express + Nest + frontend CI
├── docs/revamp/                     # NestJS + PostgreSQL revamp phase docs
├── social-network-app-backend-nest/ # NestJS + PostgreSQL API (recommended)
├── social-network-app-backend/      # Express + Mongo (legacy until Phase 8)
├── social-network-app-frontend/     # React SPA (Vite + TypeScript)
└── NestJS/intro-to-nestjs/          # Tutorial reference (not production)
```

The frontend reads the API origin from `VITE_API_URL` (default `http://localhost:8080`).

## Tech Stack

| Layer    | Technologies                                              |
| -------- | --------------------------------------------------------- |
| Frontend | React 19, React Router 7, Vite 6, TypeScript (strict)    |
| Backend  | NestJS 11, GraphQL (Apollo), TypeORM, TypeScript         |
| Database | PostgreSQL 16                                             |
| Testing  | Jest, Supertest (Nest e2e); Express suite retained        |
| CI       | GitHub Actions (type-check, lint, migrate, tests, build)  |

## Features

- User signup and login (JWT, 1-hour expiry)
- Protected routes and session persistence via `localStorage`
- Paginated post feed (2 posts per page)
- Create, edit, and delete posts with image upload (author-only edit/delete)
- Single post detail view
- User status updates
- Responsive layout with mobile navigation
- Blur-based form validation with inline error messages
- Nest backend e2e suite (auth, feed, upload, Mongo→PG migrate rehearsal)

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm
- [Docker](https://www.docker.com/) (for PostgreSQL / full stack)

## Quick Start (Local Development)

### 1. PostgreSQL + Nest backend

```bash
cd social-network-app-backend-nest
cp .env.example .env
docker compose up -d postgres   # package compose, or use root compose postgres
npm install
npm run migration:run
npm run start:dev
```

| Variable       | Description                                      |
| -------------- | ------------------------------------------------ |
| `DB_HOST`      | Postgres host (`localhost` for host-run Nest)    |
| `DB_PORT`      | Postgres port (default `5432`)                   |
| `DB_USER`      | Database user                                    |
| `DB_PASSWORD`  | Database password                                |
| `DB_DATABASE`  | Database name                                    |
| `JWT_SECRET`   | Secret key for signing JWT tokens                |
| `PORT`         | Server port (default `8080`)                     |

Confirm [http://localhost:8080/health](http://localhost:8080/health) and GraphQL at [http://localhost:8080/graphql](http://localhost:8080/graphql).

### 2. Frontend

```bash
cd social-network-app-frontend
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Override the API with `VITE_API_URL` if needed.

Per-project READMEs:

- [Nest backend](social-network-app-backend-nest/README.md)
- [Frontend](social-network-app-frontend/README.md)
- [Express backend (legacy)](social-network-app-backend/README.md)

## Quick Start (Docker)

From the repository root:

```bash
cp social-network-app-frontend/.env.example social-network-app-frontend/.env
docker compose up --build
```

| Service     | URL                                                            |
| ----------- | -------------------------------------------------------------- |
| Frontend    | [http://localhost:3000](http://localhost:3000) (Vite dev)    |
| Backend API | [http://localhost:8080](http://localhost:8080)                 |
| GraphQL     | [http://localhost:8080/graphql](http://localhost:8080/graphql) |
| PostgreSQL  | `localhost:5432` (`socialogy` / user `postgres`)               |

- **Backend** runs TypeORM migrations on start (`npm run start:prod`), then Nest.
- **Frontend** uses `VITE_API_URL=http://localhost:8080` (browser → host-mapped API).
- Images persist in the `backend_images` volume; Postgres data in `postgres_data`.

### Backup and recovery (PostgreSQL)

```bash
# Logical backup
docker compose exec postgres pg_dump -U postgres socialogy > backup.sql

# Restore into a running postgres service
docker compose exec -T postgres psql -U postgres socialogy < backup.sql
```

After a wipe, recreate schema with `npm run migration:run` in `social-network-app-backend-nest` (or restart the backend container, which migrates on boot). For Mongo→PG data migration rehearsals, see [Phase 6 checklist](docs/revamp/phase-6-checklist.md).

## API Overview

| Method | Path          | Description                                         |
| ------ | ------------- | --------------------------------------------------- |
| `POST` | `/graphql`    | GraphQL API (auth, posts, user)                     |
| `PUT`  | `/post-image` | Upload post image (`Authorization` header required) |
| `GET`  | `/images/*`   | Serve uploaded images                               |
| `GET`  | `/health`     | Nest health check                                   |

**GraphQL queries:** `login`, `posts`, `post`, `user`  
**GraphQL mutations:** `createUser`, `createPost`, `updatePost`, `deletePost`, `updateStatus`

Authenticated requests must include:

```
Authorization: Bearer <token>
```

## Scripts

### Nest backend (`social-network-app-backend-nest/`)

| Command                     | Description                                      |
| --------------------------- | ------------------------------------------------ |
| `npm run start:dev`         | Watch mode                                       |
| `npm run migration:run`     | Apply TypeORM migrations                         |
| `npm run test:e2e`          | Integration/e2e suite (needs Postgres)           |
| `npm run migrate:mongo:dry` | Plan Mongo→PG data migration                     |

### Frontend (`social-network-app-frontend/`)

| Command              | Description                       |
| -------------------- | --------------------------------- |
| `npm run dev`        | Vite dev server (port 3000)       |
| `npm run build`      | Production build → `dist/`        |
| `npm run type-check` | Type-check with `tsc -b`          |

## CI

On push/PR to `main` or `master`, GitHub Actions runs:

1. **Express (legacy):** type-check, build, tests (in-memory Mongo — no Mongo service)
2. **Nest:** type-check, lint, build, migrate Postgres service, unit + e2e tests
3. **Frontend:** type-check, build (`VITE_API_URL`)

No MongoDB service is required in CI.

## License

ISC
