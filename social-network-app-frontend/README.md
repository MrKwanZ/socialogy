# Social Network App — Frontend

A React single-page application for a social network platform. Users can sign up, log in, manage their status, and create, view, edit, and delete posts with image uploads. The UI talks to a GraphQL backend over HTTP.

## Tech Stack

| Technology | Version |
|------------|---------|
| React | 19.x |
| React Router | 7.x |
| Vite | 6.x |
| JavaScript (JSX) | ES modules |

## Features

- User authentication (login / signup) with JWT stored in `localStorage`
- Protected routes for authenticated users
- Feed with paginated posts
- Create, edit, and delete posts with image upload
- Single post detail view
- User status updates
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

- [Node.js](https://nodejs.org/) 18+ (24 LTS recommended)
- npm
- Running backend server on port **8080** (see backend README / setup)

## Setup

1. **Clone the repository**

   ```bash
   git clone <frontend-repo-url>
   cd social-network-app-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the backend first**

   In a separate terminal, from `social-network-app-backend`:

   ```bash
   npm install
   npm start
   ```

   Confirm the backend is listening on `http://localhost:8080`.

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

## Project Structure

```
social-network-app-frontend/
├── public/              # Static assets (logo, manifest)
├── src/
│   ├── components/      # Reusable UI (Button, Modal, Navigation, etc.)
│   ├── pages/           # Route pages (Auth, Feed, SinglePost)
│   ├── util/            # Validators and image helpers
│   ├── App.jsx          # Root app, auth state, routing
│   └── index.jsx        # Entry point
├── index.html           # Vite HTML template
└── vite.config.js       # Vite configuration
```

## API Configuration

API URLs are currently hardcoded to `http://localhost:8080`. If your backend runs on a different host or port, update the `fetch` calls in:

- `src/App.jsx`
- `src/pages/Feed/Feed.jsx`
- `src/pages/Feed/SinglePost/SinglePost.jsx`

## License

ISC
