# Socialogy

A full-stack social network application built with the MERN stack and **TypeScript**. Users can sign up, log in, update their status, and create, view, edit, and delete posts with image uploads. The React frontend talks to a Node.js/Express backend over GraphQL and a REST image-upload endpoint.

## Project Structure

```
socialogy/
├── docker-compose.yaml              # Run backend, frontend, and MongoDB together
├── .github/workflows/ci.yml         # Type-check, build, and test on push/PR
├── social-network-app-backend/      # Express API (GraphQL + image upload)
│   ├── Dockerfile                   # Multi-stage: compile TS → run dist/app.js
│   ├── app.ts                       # Express app, routes, MongoDB connect
│   ├── graphql/                     # schema.ts, resolvers.ts
│   ├── middleware/                  # JWT auth
│   ├── models/                      # User, Post (Mongoose)
│   ├── util/                        # Mappers, paths, file helpers
│   ├── types/                       # Shared TS types and Express augmentation
│   ├── tests/                       # Jest + Supertest integration tests
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── .env.example
│   └── README.md
└── social-network-app-frontend/     # React SPA (Vite + TypeScript)
    ├── Dockerfile                   # Dev target (default) + production nginx target
    ├── vite.config.ts
    ├── index.html
    ├── src/
    │   ├── App.tsx                  # Auth state, routing, GraphQL calls
    │   ├── index.tsx
    │   ├── types/                   # GraphQL and form types
    │   ├── util/                    # graphql, validators, formValidation
    │   ├── components/
    │   └── pages/
    └── README.md
```

Both services are required for the full application. The frontend sends requests to the backend at `http://localhost:8080`.

## Tech Stack

| Layer    | Technologies                                              |
| -------- | --------------------------------------------------------- |
| Frontend | React 19, React Router 7, Vite 6, TypeScript (strict)    |
| Backend  | Node.js, Express 4, GraphQL (`graphql-http`), TypeScript |
| Database | MongoDB (Atlas or local) via Mongoose 8                   |
| Testing  | Jest, Supertest, MongoDB Memory Server                    |
| CI       | GitHub Actions (type-check, build, tests)                 |

## Features

- User signup and login (JWT, 1-hour expiry)
- Protected routes and session persistence via `localStorage`
- Paginated post feed (2 posts per page)
- Create, edit, and delete posts with image upload (author-only edit/delete)
- Single post detail view
- User status updates
- Responsive layout with mobile navigation
- Blur-based form validation with inline error messages
- Backend integration test suite (36 tests)

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (20 LTS recommended)
- npm
- [MongoDB Atlas](https://www.mongodb.com/atlas) cluster **or** Docker (for local MongoDB via `docker-compose`)

## Quick Start (Local Development)

### 1. Backend

```bash
cd social-network-app-backend
npm install
cp .env.example .env
```

Edit `.env` with your MongoDB connection string and JWT secret:

| Variable      | Description                       |
| ------------- | --------------------------------- |
| `MONGODB_URI` | MongoDB connection string         |
| `JWT_SECRET`  | Secret key for signing JWT tokens |
| `PORT`        | Server port (default: `8080`)     |

```bash
npm run dev
```

Confirm the server is running at [http://localhost:8080](http://localhost:8080). GraphQL is available at [http://localhost:8080/graphql](http://localhost:8080/graphql).

### 2. Frontend

In a separate terminal:

```bash
cd social-network-app-frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

For more detail, see the per-project READMEs:

- [Backend setup & API](social-network-app-backend/README.md)
- [Frontend setup & configuration](social-network-app-frontend/README.md)

## Quick Start (Docker)

From the repository root, configure the backend environment first:

```bash
cp social-network-app-backend/.env.example social-network-app-backend/.env
```

For Docker, point `MONGODB_URI` at the bundled MongoDB service:

```
MONGODB_URI=mongodb://mongo:27017/social-network
JWT_SECRET=your_jwt_secret_here
PORT=8080
```

Create an empty frontend env file (referenced by `docker-compose.yaml`):

```bash
touch social-network-app-frontend/.env
```

Start all services:

```bash
docker compose up --build
```

| Service     | URL                                                            |
| ----------- | -------------------------------------------------------------- |
| Frontend    | [http://localhost:3000](http://localhost:3000) (Vite dev)    |
| Backend API | [http://localhost:8080](http://localhost:8080)                 |
| GraphQL     | [http://localhost:8080/graphql](http://localhost:8080/graphql) |
| MongoDB     | `localhost:27017`                                              |

- **Backend container** compiles TypeScript and runs `node dist/app.js`.
- **Frontend container** runs the Vite dev server with hot reload (`development` target).
- For a static production frontend image, build with `docker build --target production`.

Uploaded images are persisted via volume mounts; MongoDB data is stored in `social-network-app-backend/data/`.

## API Overview

| Method | Path          | Description                                         |
| ------ | ------------- | --------------------------------------------------- |
| `POST` | `/graphql`    | GraphQL API (auth, posts, user)                     |
| `PUT`  | `/post-image` | Upload post image (`Authorization` header required) |
| `GET`  | `/images/*`   | Serve uploaded images                               |

**GraphQL queries:** `login`, `posts`, `post`, `user`  
**GraphQL mutations:** `createUser`, `createPost`, `updatePost`, `deletePost`, `updateStatus`

Authenticated requests must include:

```
Authorization: Bearer <token>
```

## Scripts

### Backend (`social-network-app-backend/`)

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `npm run dev`      | Start dev server with nodemon + tsx (hot reload) |
| `npm start`        | Run compiled production build (`dist/app.js`)    |
| `npm run build`    | Compile TypeScript → `dist/`                     |
| `npm run type-check` | Type-check app and tests (no emit)             |
| `npm test`         | Run integration tests (in-memory MongoDB)        |

### Frontend (`social-network-app-frontend/`)

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start Vite dev server (port 3000)    |
| `npm run build`    | Production build → `dist/`           |
| `npm run preview`  | Preview the production build locally |
| `npm run type-check` | Type-check with `tsc -b`           |

## CI

On push/PR to `main` or `master`, GitHub Actions runs for both packages:

1. `npm ci`
2. `npm run type-check`
3. `npm run build`
4. `npm test` (backend only)

## License

ISC
