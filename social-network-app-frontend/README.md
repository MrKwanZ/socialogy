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

You must also set up and run the companion backend repository (`social-network-app-backend`) before using this app. The frontend sends all API requests to the backend at `http://localhost:8080` for:

- GraphQL (`/graphql`) — auth, posts, user status
- Image upload (`/post-image`)

Without the backend running, login, signup, and feed features will fail.

Clone or place both projects side by side, for example:

```
MERN/
├── social-network-app-frontend/   ← this project
└── social-network-app-backend/    ← required
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (20 LTS recommended)
- npm
- Running backend server on port **8080** (see backend README / setup)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the backend first**

   In a separate terminal, from `social-network-app-backend`:

   ```bash
   npm install
   npm run dev
   ```

   Confirm the backend is listening on `http://localhost:8080`.

3. **Start the frontend**

   ```bash
   npm run dev
   ```

4. **Open the app**

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
├── index.html           # Vite HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # Project references root
├── tsconfig.app.json    # App source type-check config
└── tsconfig.node.json   # Vite config type-check
```

## API Configuration

The backend URL is defined in `src/util/graphql.ts`:

```typescript
export const API_URL = 'http://localhost:8080';
```

If your backend runs on a different host or port, update `API_URL` there. All GraphQL calls go through the shared `graphqlFetch()` helper in the same file.

## Docker

The Dockerfile provides two build targets:

| Target | Purpose |
|--------|---------|
| `development` (default in `docker-compose`) | Vite dev server with hot reload on port 3000 |
| `production` | Static build served by nginx on port 80 |

Build the production image:

```bash
docker build --target production -t socialogy-frontend .
```

## License

ISC
