# Social Network App — Backend

A Node.js/Express API for a social network platform. It provides GraphQL endpoints for authentication, posts, and user status, plus a REST endpoint for image uploads. Data is stored in MongoDB via Mongoose.

## Tech Stack

| Technology | Version |
|------------|---------|
| Node.js | 18+ (24 LTS recommended) |
| Express | 4.x |
| GraphQL | 15.x (`express-graphql`) |
| Mongoose | 8.x |
| MongoDB | Atlas or local |
| JWT | `jsonwebtoken` |

## Features

- User signup and login (JWT, 1-hour expiry)
- CRUD operations for posts (create, read, update, delete)
- Paginated post feed (2 posts per page)
- User status updates
- Image upload for post attachments (`PUT /post-image`)
- CORS enabled for cross-origin frontend requests
- Integration test suite (Jest + Supertest)

## IMPORTANT

**This backend is not a complete application on its own.**

You must also set up and run the companion frontend repository (`social-network-app-frontend`) to use the full social network app. The frontend connects to this API at `http://localhost:8080` for GraphQL and image uploads.

Without the frontend, you can still use GraphiQL at `http://localhost:8080/graphql` for manual API testing, but there is no user-facing UI.

Clone or place both projects side by side, for example:

```
MERN/
├── social-network-app-backend/    ← this project
└── social-network-app-frontend/   ← required for full app
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (24 LTS recommended)
- npm
- [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or local MongoDB instance)

## Setup

1. **Clone the repository**

   ```bash
   git clone <backend-repo-url>
   cd social-network-app-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the example file and fill in your values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   |----------|-------------|
   | `MONGODB_URI` | MongoDB connection string (Atlas `mongodb+srv://...`) |
   | `JWT_SECRET` | Secret key for signing JWT tokens |
   | `PORT` | Server port (default: `8080`) |

4. **Start the server**

   ```bash
   npm start
   ```

   You should see: `Server running on port 8080`

5. **Start the frontend** (in a separate terminal)

   From `social-network-app-frontend`:

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start server with nodemon (auto-reload) |
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

GraphiQL is available at [http://localhost:8080/graphql](http://localhost:8080/graphql) when the server is running.

Authenticated requests must include:

```
Authorization: Bearer <token>
```

## Project Structure

```
social-network-app-backend/
├── app.js                 # Express app, MongoDB connect, routes
├── graphql/
│   ├── schema.js          # GraphQL schema
│   └── resolvers.js       # GraphQL resolvers
├── middleware/
│   └── auth.js            # JWT authentication
├── models/
│   ├── post.js
│   └── user.js
├── controllers/           # Legacy REST controllers (unused)
├── util/
│   └── file.js            # Image cleanup helper
├── tests/                 # Jest integration tests
├── images/                # Uploaded images (gitignored)
└── .env                   # Environment variables (gitignored)
```

## Testing

Tests use an in-memory MongoDB instance — no Atlas connection required.

```bash
npm test
```

## License

ISC
