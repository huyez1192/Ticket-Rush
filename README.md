# Ticket Rush

Ticket Rush is an online ticket booking system for seat-based events. The project will support Customer and Admin roles, event browsing, seat selection, checkout, electronic tickets, QR codes, admin management, analytics, and virtual queue workflows according to the documents in `docs/`.

## Tech Stack

- Frontend: ReactJS with Vite
- Backend: ExpressJS
- Database: MongoDB with Mongoose
- Package manager: npm workspaces
- Language: modern JavaScript with ESM `import`/`export`

## Folder Structure

```txt
ticket_rush_3/
├─ apps/
│  ├─ api/        # ExpressJS backend
│  └─ web/        # Vite React frontend
├─ docs/          # Requirements, Swagger, database reference, and design exports
├─ packages/
│  └─ shared/     # Shared constants for frontend/backend
├─ AGENTS.md
├─ README.md
├─ package.json
├─ .gitignore
└─ .env.example
```

## Setup

1. Install Node.js 20 or newer.
2. Install MongoDB locally or prepare a MongoDB connection string.
3. Create environment files from the examples:

```bash
copy .env.example .env
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env
```

On macOS/Linux, use `cp` instead of `copy`.

## Install Dependencies

From the repository root:

```bash
npm install
```

The root package uses npm workspaces, so this installs dependencies for `apps/api`, `apps/web`, and `packages/shared`.

## Run Backend

```bash
npm run dev:api
```

The backend runs on `http://localhost:5000` by default.

The Phase 2 backend foundation includes:

- validated environment loading from `apps/api/.env`
- MongoDB connection through Mongoose
- security and request middleware
- shared success/error response helpers
- global 404 and error handling middleware
- request validation middleware placeholder for future Zod schemas
- route aggregation under `/api`
- health check endpoint

Before running the backend, make sure MongoDB is running and copy the backend env file:

```bash
copy apps\api\.env.example apps\api\.env
```

Health check:

```bash
GET http://localhost:5000/api/health
```

## Run Frontend

```bash
npm run dev:web
```

The frontend runs on `http://localhost:5173` by default.

## Run Both Apps

```bash
npm run dev
```

## Build

```bash
npm run build
```

At this phase only the web app has a build step.

## Environment Variables

Backend variables are documented in `apps/api/.env.example`.
Frontend variables are documented in `apps/web/.env.example`.

MongoDB is the target database. The file `docs/database/migrations.sql` is only a schema and business-constraint reference for designing MongoDB/Mongoose schemas. Do not run it as a SQL migration and do not add a SQL database layer.

## Model Layer

The Phase 3 model layer converts `docs/database/migrations.sql` into Mongoose schemas. The SQL file remains documentation only; there is no SQL migration runner and no SQL database layer.

MongoDB collections represented by Mongoose models:

- `users`
- `roles`
- `events`
- `event_images`
- `seat_sections`
- `seats`
- `seat_locks`
- `orders`
- `order_items`
- `tickets`
- `waiting_queue`
- `audit_logs`

The SQL `user_roles` join table is represented by a `roles` ObjectId array on `users`, with role documents kept in the `roles` collection because Swagger exposes role IDs and role assignment. Payment models are not present because the migration defines mock checkout through orders and tickets, not a payments table.

The detailed SQL-to-MongoDB model mapping is documented in `docs/model-mapping.md`.

Business APIs for auth, events, bookings, tickets, payments, analytics, and admin workflows are not implemented yet.
