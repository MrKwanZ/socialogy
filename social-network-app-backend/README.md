# Social Network App — Backend

A Node.js/Express API for a social network platform, written in **TypeScript**. It provides GraphQL endpoints for authentication, posts, and user status, plus a REST endpoint for image uploads. Data is stored in MongoDB via Mongoose.

## Tech Stack

| Technology | Version |
|------------|---------|
| Node.js | 18+ (20 LTS recommended) |
| TypeScript | 5.x (strict mode) |
| Express | 4.x |
| GraphQL | 15.x (`graphql-http`) |
| Mongoose | 8.x |
| MongoDB | Atlas or local |
| JWT | `jsonwebtoken` |

## Features

- User signup and login (JWT, 1-hour expiry)
- CRUD operations for posts (create, read, update, delete)
- Author-only post update and delete (enforced in resolvers)
- Paginated post feed (2 posts per page)
- User status updates
- Image upload for post attachments (`PUT /post-image`)
- CORS enabled for cross-origin frontend requests
- Integration test suite (Jest + Supertest, 36 tests)

## IMPORTANT

**This backend is not a complete application on its own.**

You must also set up and run the companion frontend repository (`social-network-app-frontend`) to use the full social network app. The frontend connects to this API at `http://localhost:8080` for GraphQL and image uploads.

Without the frontend, you can still send GraphQL requests to `http://localhost:8080/graphql` for manual API testing, but there is no user-facing UI.

Clone or place both projects side by side, for example:

```
MERN/
├── social-network-app-backend/    ← this project
└── social-network-app-frontend/   ← required for full app
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (20 LTS recommended)
- npm
- [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or local MongoDB instance)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   |----------|-------------|
   | `MONGODB_URI` | MongoDB connection string (Atlas `mongodb+srv://...`) |
   | `JWT_SECRET` | Secret key for signing JWT tokens |
   | `PORT` | Server port (default: `8080`) |

3. **Start the development server**

   ```bash
   npm run dev
   ```

   You should see: `Server running on port 8080`

4. **Start the frontend** (in a separate terminal)

   From `social-network-app-frontend`:

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with nodemon + tsx (auto-reload) |
| `npm start` | Run compiled production build (`node dist/app.js`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run type-check` | Type-check application and test files |
| `npm test` | Run integration tests (in-memory MongoDB) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/graphql` | GraphQL API (auth, posts, user) |
| `PUT` | `/post-image` | Upload post image (requires `Authorization` header) |
| `GET` | `/images/*` | Serve uploaded images |

### GraphQL (via `/graphql`)

**Queries:** `login`, `posts`, `post`, `user`  
**Mutations:** `createUser`, `createPost`, `updatePost`, `deletePost`, `updateStatus`

Authenticated requests must include:

```
Authorization: Bearer <token>
```

## Project Structure

```
social-network-app-backend/
├── app.ts                 # Express app, MongoDB connect, routes
├── graphql/
│   ├── schema.ts          # GraphQL schema (SDL)
│   └── resolvers.ts       # GraphQL resolvers
├── middleware/
│   └── auth.ts            # JWT authentication
├── models/
│   ├── post.ts
│   └── user.ts
├── util/
│   ├── file.ts            # Image cleanup helper
│   ├── mappers.ts         # Mongoose → GraphQL mappers
│   └── paths.ts           # Path helpers for dist/ runtime
├── types/
│   ├── errors.ts          # AppError class
│   ├── express.d.ts       # Express Request augmentation
│   ├── graphql.ts         # GraphQL response types
│   ├── global.d.ts        # Test global augmentation
│   └── models.ts          # Mongoose document interfaces
├── tests/                 # Jest integration tests
├── images/                # Uploaded images (gitignored)
├── tsconfig.json
├── tsconfig.test.json
├── jest.config.js
└── .env                   # Environment variables (gitignored)
```

## Testing

Tests use an in-memory MongoDB instance — no Atlas connection required.

```bash
npm test
```

Test suites cover auth (`createUser`, `login`) and post CRUD (`createPost`, `updatePost`, `deletePost`, `posts` pagination).

## Docker

The Dockerfile uses a multi-stage build:

1. **Builder** — `npm ci` + `npm run build` (compiles to `dist/`)
2. **Runtime** — production dependencies only, runs `node dist/app.js`

## License

ISC
