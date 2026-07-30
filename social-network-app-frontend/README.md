# Social Network App — Frontend

A React single-page application for a social network platform, written in **TypeScript**. Users can sign up, log in, manage their status, and create, view, edit, and delete posts with image uploads. The UI talks to a GraphQL backend over HTTP.

## Tech Stack

| Technology | Version |
|------------|---------|
| React | 19.x |
| React Router | 7.x |
| Vite | 6.x |
| TypeScript | 5.x (strict mode) |

## Features

- User authentication (login / signup) with JWT stored in `localStorage`
- Protected routes for authenticated users
- Feed with paginated posts
- Create, edit, and delete posts with image upload
- Edit/delete controls visible only to the post author
- Single post detail view
- User status updates
- Blur-based form validation with inline error messages
- Responsive layout with mobile navigation

## IMPORTANT

**This frontend cannot run as a full application on its own.**

You must also run the NestJS + PostgreSQL backend (`social-network-app-backend`), which provides the GraphQL API and image upload endpoint.

API origin defaults to `http://localhost:8080` and is configured via `VITE_API_URL`:

- GraphQL (`/graphql`) — auth, posts, user status
- Image upload (`/post-image`)
- Static images (`/images/*`)

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (20 LTS recommended)
- npm
- Running backend on the URL in `VITE_API_URL` (default port **8080**)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure the API URL**

   ```bash
   cp .env.example .env
   ```

   | Variable        | Description                                      |
   | --------------- | ------------------------------------------------ |
   | `VITE_API_URL`  | Backend origin (default `http://localhost:8080`) |

3. **Start the Nest backend first**

   ```bash
   cd ../social-network-app-backend
   npm run start:dev
   ```

4. **Start the frontend**

   ```bash
   npm run dev
   ```

5. **Open the app**

   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 3000) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run type-check` | Type-check with `tsc -b` |

## Project Structure

```
social-network-app-frontend/
├── public/              # Static assets (manifest)
├── src/
│   ├── components/      # Reusable UI (Button, Modal, Navigation, etc.)
│   ├── pages/           # Route pages (Auth, Feed, SinglePost)
│   ├── types/           # GraphQL and form TypeScript types
│   ├── util/            # graphql, validators, formValidation, image
│   ├── App.tsx          # Root app, auth state, routing
│   └── index.tsx        # Entry point
├── .env.example         # VITE_API_URL
├── index.html           # Vite HTML template
└── vite.config.ts       # Vite configuration
```

## API Configuration

`src/util/graphql.ts` exports `API_URL` from `import.meta.env.VITE_API_URL` (fallback `http://localhost:8080`). All GraphQL, upload, and image URL construction uses that constant.

## Docker

The Dockerfile provides two build targets:

| Target | Purpose |
|--------|---------|
| `development` (default in `docker-compose`) | Vite dev server with hot reload on port 3000 |
| `production` | Static build served by nginx on port 80 |

Pass the API URL at build time for production:

```bash
docker build --target production --build-arg VITE_API_URL=http://localhost:8080 -t socialogy-frontend .
```

## License

ISC
