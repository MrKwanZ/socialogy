# Socialogy

A full-stack social network application built with the MERN stack. Users can sign up, log in, update their status, and create, view, edit, and delete posts with image uploads. The React frontend talks to a Node.js/Express backend over GraphQL and REST.

## Project Structure

```
socialogy/
├── docker-compose.yaml              # Run backend, frontend, and MongoDB together
├── social-network-app-backend/      # Express API (GraphQL + image upload)
│   ├── Dockerfile
│   ├── app.js                       # Express app, routes, MongoDB connect
│   ├── graphql/                     # schema.js, resolvers.js
│   ├── middleware/                  # JWT auth
│   ├── models/                      # User, Post (Mongoose)
│   ├── util/                        # Image cleanup helpers
│   ├── controllers/                 # Legacy REST controllers (unused)
│   ├── tests/                       # Jest + Supertest integration tests
│   ├── jest.config.js
│   ├── .env.example
│   └── README.md                    # Backend setup, API, and testing
└── social-network-app-frontend/     # React SPA (Vite)
    ├── Dockerfile
    ├── vite.config.js
    ├── index.html
    ├── public/                      # Static assets (manifest)
    ├── src/
    │   ├── App.jsx                  # Auth state, routing, GraphQL calls
    │   ├── index.jsx
    │   ├── components/
    │   │   ├── Backdrop/
    │   │   ├── Button/
    │   │   ├── ErrorHandler/
    │   │   ├── Feed/                # Post, FeedEdit
    │   │   ├── Form/Input/          # Input, FilePicker
    │   │   ├── Image/               # Image, Avatar
    │   │   ├── Layout/
    │   │   ├── Loader/
    │   │   ├── Logo/
    │   │   ├── Modal/
    │   │   ├── Navigation/          # MainNavigation, MobileNavigation, etc.
    │   │   ├── Paginator/
    │   │   └── Toolbar/
    │   ├── pages/
    │   │   ├── Auth/                # Login, Signup
    │   │   └── Feed/                # Feed, SinglePost
    │   └── util/                    # validators, image helpers
    └── README.md                    # Frontend setup and configuration
```

Both services are required for the full application. The frontend sends requests to the backend at `http://localhost:8080`.

## Tech Stack


| Layer    | Technologies                                         |
| -------- | ---------------------------------------------------- |
| Frontend | React 19, React Router 7, Vite 6                     |
| Backend  | Node.js, Express 4, GraphQL (`express-graphql`), JWT |
| Database | MongoDB (Atlas or local) via Mongoose 8              |


## Features

- User signup and login (JWT, 1-hour expiry)
- Protected routes and session persistence via `localStorage`
- Paginated post feed (2 posts per page)
- Create, edit, and delete posts with image upload
- Single post detail view
- User status updates
- Responsive layout with mobile navigation
- Backend integration test suite (Jest + Supertest)

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (24 LTS recommended)
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
npm start
```

Confirm the server is running at [http://localhost:8080](http://localhost:8080). GraphiQL is available at [http://localhost:8080/graphql](http://localhost:8080/graphql).

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

Both service images use **Node 20 Alpine**. The frontend container runs the Vite dev server (`npm run dev`); the backend uses nodemon. Uploaded images are persisted via volume mounts, and MongoDB data is stored in `social-network-app-backend/data/`.


| Service     | URL                                                            |
| ----------- | -------------------------------------------------------------- |
| Frontend    | [http://localhost:3000](http://localhost:3000)                 |
| Backend API | [http://localhost:8080](http://localhost:8080)                 |
| GraphQL     | [http://localhost:8080/graphql](http://localhost:8080/graphql) |
| MongoDB     | `localhost:27017`                                              |


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


| Command     | Description                               |
| ----------- | ----------------------------------------- |
| `npm start` | Start server with nodemon                 |
| `npm test`  | Run integration tests (in-memory MongoDB) |


Run backend tests from `social-network-app-backend/` — no Atlas connection required:

```bash
cd social-network-app-backend
npm test
```

Test suites cover auth (`createUser`, `login`) and post CRUD (`createPost`, `updatePost`, `deletePost`, `posts` pagination).

### Frontend (`social-network-app-frontend/`)


| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start Vite dev server (port 3000)    |
| `npm run build`   | Production build → `dist/`           |
| `npm run preview` | Preview the production build locally |


## License

ISC