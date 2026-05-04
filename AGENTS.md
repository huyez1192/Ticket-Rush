# AGENTS.md

## Project Overview

This repository is for **Ticket Rush**, an online ticket booking system.

The system has two main business roles:

- **Customer**
- **Admin**

The project must be implemented with:

- **Frontend:** ReactJS
- **Backend:** ExpressJS
- **Database:** MongoDB

The repository already contains source documents under `docs/`:

```txt
docs/
├─ database/
│  └─ migrations.sql
├─ design/
│  ├─ flat_editorial_bold/
│  ├─ ticketrush_admin_analytics_dashboard/
│  ├─ ticketrush_admin_event_management/
│  ├─ ticketrush_admin_event_seating_config/
│  ├─ ticketrush_admin_login/
│  ├─ ticketrush_admin_sold_ticket_management/
│  ├─ ticketrush_customer_checkout/
│  ├─ ticketrush_customer_event_details/
│  ├─ ticketrush_customer_event_listing/
│  ├─ ticketrush_customer_login/
│  ├─ ticketrush_customer_my_tickets/
│  ├─ ticketrush_customer_register/
│  ├─ ticketrush_customer_select_your_seats/
│  ├─ ticketrush_customer_ticket_detail_with_qr/
│  └─ ticketrush_customer_waiting_room/
├─ requirements.md
└─ swagger.json
```

The codebase must be generated and maintained according to these documents.

---

## Absolute Source of Truth

When implementing features, follow this priority order:

1. `docs/swagger.json`
   - Source of truth for API endpoints.
   - Source of truth for request bodies, response bodies, HTTP methods, path params, query params, and status codes.

2. `docs/requirements.md`
   - Source of truth for functional requirements and business behavior.

3. `docs/database/migrations.sql`
   - Source of truth for entities, fields, relationships, constraints, enums, and intended data model.
   - Even though the target database is MongoDB, use this SQL migration as the reference for MongoDB schema design.

4. `docs/design/`
   - Source of truth for UI screens, layout, colors, typography, spacing, and screen flow.

Do not invent new APIs, new screens, new roles, new status values, or new database fields unless clearly required by the documents.

If there is a conflict between documents, stop and report the conflict before coding.

---

## Important Database Rule

The project uses **MongoDB**, not SQL.

However, `docs/database/migrations.sql` exists as the original database design reference.

When implementing MongoDB:

- Convert SQL tables into MongoDB collections.
- Convert SQL foreign keys into MongoDB `ObjectId` references where appropriate.
- Convert SQL enum/check constraints into Mongoose enum validation.
- Preserve business constraints from the SQL migration.
- Preserve required fields, unique fields, timestamps, and relationships.
- Do not run SQL migrations against MongoDB.
- Do not create a SQL database layer.
- Do not use PostgreSQL, MySQL, or SQL Server.

Use **Mongoose** unless the project already uses another MongoDB ODM.

---

## Expected Repository Structure

Create and maintain this monorepo structure:

```txt
TICKET_RUSH_3/
├─ AGENTS.md
├─ README.md
├─ package.json
├─ .gitignore
├─ .env.example
│
├─ docs/
│  ├─ requirements.md
│  ├─ swagger.json
│  ├─ database/
│  │  └─ migrations.sql
│  └─ design/
│
├─ apps/
│  ├─ api/
│  │  ├─ package.json
│  │  ├─ .env.example
│  │  ├─ src/
│  │  │  ├─ server.js
│  │  │  ├─ app.js
│  │  │  │
│  │  │  ├─ config/
│  │  │  │  ├─ env.js
│  │  │  │  └─ database.js
│  │  │  │
│  │  │  ├─ database/
│  │  │  │  ├─ connectMongo.js
│  │  │  │  └─ seed.js
│  │  │  │
│  │  │  ├─ common/
│  │  │  │  ├─ constants/
│  │  │  │  ├─ errors/
│  │  │  │  ├─ responses/
│  │  │  │  └─ utils/
│  │  │  │
│  │  │  ├─ middlewares/
│  │  │  │  ├─ auth.middleware.js
│  │  │  │  ├─ role.middleware.js
│  │  │  │  ├─ validate.middleware.js
│  │  │  │  ├─ error.middleware.js
│  │  │  │  └─ notFound.middleware.js
│  │  │  │
│  │  │  ├─ modules/
│  │  │  │  ├─ auth/
│  │  │  │  ├─ users/
│  │  │  │  ├─ events/
│  │  │  │  ├─ seats/
│  │  │  │  ├─ tickets/
│  │  │  │  ├─ bookings/
│  │  │  │  ├─ payments/
│  │  │  │  ├─ analytics/
│  │  │  │  └─ admin/
│  │  │  │
│  │  │  └─ routes/
│  │  │     └─ index.js
│  │  │
│  │  └─ tests/
│  │
│  └─ web/
│     ├─ package.json
│     ├─ .env.example
│     ├─ index.html
│     ├─ vite.config.js
│     ├─ src/
│     │  ├─ main.jsx
│     │  ├─ App.jsx
│     │  │
│     │  ├─ app/
│     │  │  ├─ router.jsx
│     │  │  ├─ store.js
│     │  │  └─ providers.jsx
│     │  │
│     │  ├─ api/
│     │  │  ├─ axiosClient.js
│     │  │  ├─ authApi.js
│     │  │  ├─ eventApi.js
│     │  │  ├─ bookingApi.js
│     │  │  ├─ ticketApi.js
│     │  │  └─ adminApi.js
│     │  │
│     │  ├─ layouts/
│     │  │  ├─ PublicLayout.jsx
│     │  │  ├─ CustomerLayout.jsx
│     │  │  └─ AdminLayout.jsx
│     │  │
│     │  ├─ pages/
│     │  │  ├─ public/
│     │  │  ├─ customer/
│     │  │  └─ admin/
│     │  │
│     │  ├─ features/
│     │  │  ├─ auth/
│     │  │  ├─ events/
│     │  │  ├─ booking/
│     │  │  ├─ tickets/
│     │  │  └─ admin/
│     │  │
│     │  ├─ components/
│     │  │  ├─ common/
│     │  │  ├─ event/
│     │  │  ├─ booking/
│     │  │  ├─ ticket/
│     │  │  └─ admin/
│     │  │
│     │  ├─ hooks/
│     │  ├─ utils/
│     │  ├─ constants/
│     │  └─ styles/
│     │
│     └─ tests/
│
└─ packages/
   └─ shared/
      ├─ package.json
      └─ src/
         ├─ roles.js
         ├─ statuses.js
         └─ constants.js
```

If a simpler structure is enough for the task, keep the architecture simple but do not mix frontend and backend source files.

---

## Package Manager Rule

Use the existing package manager if the repo already has one.

If no package manager is configured yet, use:

```txt
npm
```

Do not switch package managers without asking.

---

## JavaScript Rules

Use modern JavaScript.

- Use ESM `import/export`.
- Do not use CommonJS `require/module.exports` unless the existing project already uses CommonJS.
- Use async/await.
- Keep files small and focused.
- Prefer readable code over clever code.
- Do not add TypeScript unless explicitly asked.
- Do not add unnecessary dependencies.

---

## Backend Architecture Rules

The backend must use **ExpressJS** with module-based architecture.

Each backend module should follow this pattern:

```txt
modules/module-name/
├─ module.model.js
├─ module.routes.js
├─ module.controller.js
├─ module.service.js
├─ module.repository.js
└─ module.validation.js
```

Responsibilities:

### Routes

Routes only define endpoint paths and attach middlewares/controllers.

Do not put business logic in route files.

### Controllers

Controllers should:

- Read `req.body`, `req.params`, `req.query`, and `req.user`.
- Call the service layer.
- Return HTTP responses.
- Not contain database queries.
- Not contain complex business logic.

### Services

Services should:

- Contain business logic.
- Check permissions when needed.
- Handle booking rules.
- Handle ticket availability rules.
- Handle event status rules.
- Coordinate multiple repositories.
- Use MongoDB transactions when multiple writes must be atomic.

### Repositories

Repositories should:

- Contain Mongoose queries.
- Not contain HTTP logic.
- Not access `req` or `res`.
- Not throw HTTP-specific responses unless using shared application errors.

### Models

Models should:

- Use Mongoose schemas.
- Reflect `docs/database/migrations.sql`.
- Use enums from requirements/migration/swagger.
- Use timestamps where appropriate.
- Use indexes for unique fields and frequently queried fields.

### Validations

Validation files should:

- Validate body, params, and query.
- Match `docs/swagger.json`.
- Reject unknown or invalid fields where appropriate.

---

## Backend Required Middleware

Implement and use these middlewares:

```txt
auth.middleware.js
role.middleware.js
validate.middleware.js
error.middleware.js
notFound.middleware.js
```

### Auth Middleware

Should:

- Read JWT from `Authorization: Bearer <token>`.
- Verify token.
- Attach authenticated user info to `req.user`.
- Reject missing or invalid token with 401.

### Role Middleware

Should:

- Check `req.user.role`.
- Allow only required roles.
- Reject wrong role with 403.

Example:

```js
requireRole("Admin")
requireRole("Customer")
```

### Error Middleware

All errors should return consistent JSON:

```json
{
  "status": "failed",
  "message": "Error message"
}
```

Validation errors should return:

```json
{
  "status": "failed",
  "message": "Validation failed.",
  "errors": {
    "fieldName": ["Error message"]
  }
}
```

Successful responses should use a consistent format:

```json
{
  "status": "success",
  "message": "Operation completed successfully.",
  "data": {}
}
```

If `docs/swagger.json` defines a different response shape, follow Swagger instead.

---

## Backend Security Rules

The backend must follow these rules:

- Hash passwords with bcrypt.
- Never store plain text passwords.
- Never return password hashes in API responses.
- Read secrets from environment variables.
- Do not hard-code JWT secrets.
- Do not commit `.env`.
- Protect admin APIs with Admin role.
- Protect customer private APIs with authentication.
- A customer must never access another customer's bookings, tickets, or private data.
- Validate all request bodies, params, and query strings.
- Avoid NoSQL injection by validating input and not passing arbitrary client objects directly into MongoDB queries.
- Use safe pagination for list APIs.
- Use CORS config from environment variables.
- Add rate limiting for auth endpoints if practical.

---

## MongoDB Modeling Rules

Use MongoDB/Mongoose schemas derived from:

- `docs/database/migrations.sql`
- `docs/swagger.json`
- `docs/requirements.md`

Common expected collections may include:

```txt
users
events
seats
ticketTypes
bookings
bookingItems
tickets
payments
```

Only create collections that are supported by the migration, Swagger, requirements, or UI screens.

### ID Rules

- Use MongoDB `_id` as the primary identifier.
- API responses should use the ID shape expected by `docs/swagger.json`.
- If Swagger expects `id`, map `_id` to `id` in response DTOs.
- Do not expose internal Mongoose metadata like `__v`.

### Timestamp Rules

Use Mongoose timestamps where appropriate:

```js
{
  timestamps: true
}
```

### Enum Rules

All status and role values must come from the documents.

Do not invent new values.

Expected role values:

```txt
Customer
Admin
```

If the documents use lowercase values such as `customer` and `admin`, follow the documents.

---

## Auth and Role Business Rules

There are two business roles:

```txt
Customer
Admin
```

### Customer

A customer can usually:

- Register.
- Login.
- Browse public events.
- View event details.
- Select seats if the event supports seating.
- Checkout.
- Book tickets.
- View their own tickets/bookings.
- View ticket details and QR code.
- Enter waiting room if the business requirements support it.

### Admin

An admin can usually:

- Login.
- View analytics dashboard.
- Manage events.
- Configure seating.
- Manage sold tickets.
- View booking/ticket data.
- Update event configuration.
- Manage event status if requirements support it.

Do not allow public admin registration unless `docs/swagger.json` explicitly defines it.

Prefer seeding an initial admin account for development/demo.

---

## Booking and Ticketing Rules

When implementing booking or checkout:

- Customer must be authenticated.
- Customer can only create bookings for themselves.
- Validate event exists.
- Validate event status allows booking.
- Validate selected seats exist if seat selection is used.
- Validate selected seats are available.
- Validate ticket quantity is available.
- Prevent double booking.
- Use MongoDB transactions when booking touches multiple collections.
- Generate tickets only after successful booking/payment logic according to requirements.
- Generate QR code only if required by Swagger/requirements/UI.
- Do not mark tickets as sold unless the booking flow succeeds.

For seat-based booking:

- Seat status updates must be atomic.
- Do not allow two users to reserve or buy the same seat.
- Respect waiting room rules if defined.

For quantity-based ticket booking:

- Decrease available quantity safely.
- Do not allow overbooking.
- Reject booking when requested quantity exceeds availability.

---

## API Contract Rules

`docs/swagger.json` is the source of truth.

Before implementing any API module:

1. Read the relevant paths in `docs/swagger.json`.
2. Identify:
   - HTTP method
   - URL path
   - path params
   - query params
   - request body
   - response body
   - status codes
   - auth requirements if documented
3. Implement only those endpoints.
4. Keep the response shape compatible with Swagger.

Do not rename fields casually.

Do not change API paths unless explicitly asked.

Do not create extra APIs unless required for frontend functionality and approved.

---

## Frontend Architecture Rules

The frontend must use **ReactJS**.

Use:

- Vite
- React Router
- Axios
- Plain CSS, CSS Modules, or extracted CSS from design
- State management only when needed

Do not add a UI library such as Ant Design, Material UI, Chakra UI, or Bootstrap unless explicitly asked.

If the exported Stitch design already contains styling conventions, follow those conventions.

---

## Frontend Folder Rules

Use this organization:

```txt
src/
├─ app/
├─ api/
├─ layouts/
├─ pages/
│  ├─ public/
│  ├─ customer/
│  └─ admin/
├─ features/
├─ components/
├─ hooks/
├─ utils/
├─ constants/
└─ styles/
```

### Pages

Pages should represent route-level screens.

Examples:

```txt
pages/public/HomePage.jsx
pages/public/EventListingPage.jsx
pages/public/EventDetailsPage.jsx
pages/customer/CheckoutPage.jsx
pages/customer/MyTicketsPage.jsx
pages/customer/TicketDetailPage.jsx
pages/customer/WaitingRoomPage.jsx
pages/admin/AdminLoginPage.jsx
pages/admin/AdminAnalyticsDashboardPage.jsx
pages/admin/AdminEventManagementPage.jsx
pages/admin/AdminEventSeatingConfigPage.jsx
pages/admin/AdminSoldTicketManagementPage.jsx
```

### Components

Components should be reusable UI parts.

Examples:

```txt
components/common/Button.jsx
components/common/Input.jsx
components/common/Modal.jsx
components/event/EventCard.jsx
components/event/EventFilter.jsx
components/booking/SeatMap.jsx
components/booking/CheckoutSummary.jsx
components/ticket/TicketQrCard.jsx
components/admin/AdminSidebar.jsx
components/admin/AdminTable.jsx
components/admin/StatusBadge.jsx
```

### API Layer

Frontend API calls must be centralized in `src/api`.

Do not call Axios directly inside many components unless it is a very small one-off case.

Use files like:

```txt
api/axiosClient.js
api/authApi.js
api/eventApi.js
api/bookingApi.js
api/ticketApi.js
api/adminApi.js
```

---

## Frontend Routing Rules

Use React Router.

Expected route groups:

```txt
Public routes:
- /
- /login
- /register
- /events
- /events/:eventId

Customer routes:
- /checkout
- /checkout/:eventId
- /my-tickets
- /my-tickets/:ticketId
- /waiting-room

Admin routes:
- /admin/login
- /admin/dashboard
- /admin/events
- /admin/events/:eventId
- /admin/events/:eventId/seating
- /admin/sold-tickets
```

The actual route paths should follow `docs/swagger.json`, `docs/requirements.md`, and `docs/design/`.

Use route guards:

- `ProtectedRoute`
- `CustomerRoute`
- `AdminRoute`

Do not allow customer users to access admin pages.

Do not allow unauthenticated users to access customer-private pages.

---

## Frontend Auth Rules

Implement frontend auth with:

- Login API call.
- Store access token.
- Store current user/role.
- Add Axios `Authorization: Bearer <token>` interceptor.
- Logout clears auth state.
- Redirect user based on role.

Expected behavior:

- Customer login redirects to customer/home or event listing.
- Admin login redirects to admin dashboard.
- Customer cannot open admin pages.
- Admin should not use customer checkout flow unless requirements allow it.

---

## Design Implementation Rules

The UI must follow the design folders in `docs/design/`.

Before coding a screen:

1. Inspect the corresponding design folder.
2. Identify layout.
3. Identify colors.
4. Identify typography.
5. Identify spacing.
6. Identify reusable components.
7. Map design screen to React route.

Design folder mapping:

```txt
ticketrush_customer_login
→ Customer login page

ticketrush_customer_register
→ Customer register page

ticketrush_customer_event_listing
→ Event listing page

ticketrush_customer_event_details
→ Event details page

ticketrush_customer_select_your_seats
→ Seat selection page

ticketrush_customer_checkout
→ Checkout page

ticketrush_customer_my_tickets
→ My tickets page

ticketrush_customer_ticket_detail_with_qr
→ Ticket detail with QR page

ticketrush_customer_waiting_room
→ Waiting room page

ticketrush_admin_login
→ Admin login page

ticketrush_admin_analytics_dashboard
→ Admin dashboard page

ticketrush_admin_event_management
→ Admin event management page

ticketrush_admin_event_seating_config
→ Admin event seating configuration page

ticketrush_admin_sold_ticket_management
→ Admin sold ticket management page
```

Do not redesign the UI from scratch unless the design is incomplete.

If assets or fonts are present, use them from the project.

Do not delete design files.

---

## Feature Implementation Order

Implement the project in phases.

### Phase 0: Documentation Review

Before writing code:

- Read `docs/requirements.md`.
- Read `docs/swagger.json`.
- Read `docs/database/migrations.sql`.
- Inspect `docs/design/`.
- Create or update `docs/implementation-plan.md`.
- List any conflicts between requirements, swagger, migration, and design.

Do not code before understanding the docs.

### Phase 1: Repository Setup

Create:

- root `package.json`
- `apps/api`
- `apps/web`
- `.gitignore`
- `.env.example`
- README setup guide

Do not implement business features yet.

### Phase 2: Backend Foundation

Implement:

- Express app
- MongoDB connection
- environment config
- global error middleware
- 404 middleware
- response helper
- route aggregator
- health check endpoint

### Phase 3: MongoDB Models

Implement Mongoose models based on:

- `docs/database/migrations.sql`
- `docs/swagger.json`
- `docs/requirements.md`

### Phase 4: Auth Module

Implement:

- register if supported
- login
- logout if supported
- get current user/profile if supported
- password hashing
- JWT
- auth middleware
- role middleware

### Phase 5: Public Customer APIs

Implement:

- event listing
- event details
- seat/ticket availability if supported
- public data only

### Phase 6: Admin APIs

Implement:

- admin dashboard APIs if supported
- event management
- seating configuration
- sold ticket management
- ticket/booking management

### Phase 7: Booking APIs

Implement:

- seat selection or reservation if supported
- checkout
- booking creation
- ticket generation
- ticket detail
- QR information if supported
- waiting room if supported

### Phase 8: Frontend Foundation

Implement:

- Vite React app
- routing
- layouts
- auth state
- Axios client
- route guards

### Phase 9: Customer UI

Implement screens from design:

- login
- register
- event listing
- event details
- select seats
- checkout
- my tickets
- ticket detail with QR
- waiting room

### Phase 10: Admin UI

Implement screens from design:

- admin login
- analytics dashboard
- event management
- event seating config
- sold ticket management

### Phase 11: Integration Review

Compare:

- frontend API calls
- backend implemented routes
- `docs/swagger.json`

Fix mismatches.

### Phase 12: Testing and Polish

Add tests where practical.

Review:

- auth
- roles
- booking safety
- API response consistency
- frontend loading/error states
- README instructions

---

## Testing Rules

After changing backend code, run available checks:

```txt
npm test
npm run lint
npm run dev
```

After changing frontend code, run available checks:

```txt
npm test
npm run lint
npm run build
```

If scripts do not exist yet, create reasonable scripts in the appropriate `package.json`.

Do not claim tests passed unless they were actually run.

If a command cannot run because dependencies are missing or environment variables are missing, clearly report that.

---

## Manual Test Scenarios

The completed project should support these manual demo flows.

### Customer Flow

```txt
1. Open customer login/register.
2. Register or login as customer.
3. View event listing.
4. Open event details.
5. Select seats or ticket quantity.
6. Checkout.
7. Complete booking.
8. Open my tickets.
9. Open ticket detail.
10. View QR code if supported.
```

### Admin Flow

```txt
1. Login as admin.
2. Open admin analytics dashboard.
3. Open event management.
4. Create or update event if supported.
5. Configure seating if supported.
6. View sold tickets.
7. Confirm customer booking appears in admin view.
```

### Authorization Flow

```txt
1. Unauthenticated user cannot access customer private pages.
2. Customer cannot access admin pages.
3. Customer cannot access another customer's tickets/bookings.
4. Admin can access admin pages.
```

---

## Environment Variables

Use environment variables.

Backend `.env.example` should include:

```txt
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ticket_rush
JWT_ACCESS_SECRET=change_me
JWT_ACCESS_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:5173
BCRYPT_SALT_ROUNDS=10
```

Frontend `.env.example` should include:

```txt
VITE_API_BASE_URL=http://localhost:5000/api
```

Never commit real `.env` files.

---

## Git and File Safety Rules

Before making large changes:

- Inspect existing files.
- Explain what will be changed.
- Avoid unrelated refactors.
- Do not delete docs.
- Do not delete design folders.
- Do not rewrite `swagger.json` unless explicitly asked.
- Do not rewrite `migrations.sql` unless explicitly asked.
- Keep changes scoped to the requested task.

When finished, summarize:

```txt
Changed files:
- ...

Implemented:
- ...

How to test:
- ...

Assumptions:
- ...

Remaining issues:
- ...
```

---

## Dependency Rules

Before adding a new dependency:

- Check whether the project already has an equivalent dependency.
- Prefer minimal dependencies.
- Explain why the dependency is needed.

Allowed common dependencies for backend:

```txt
express
mongoose
dotenv
cors
bcryptjs or bcrypt
jsonwebtoken
zod or joi
morgan
helmet
express-rate-limit
```

Allowed common dependencies for frontend:

```txt
react
react-dom
react-router-dom
axios
```

Do not add Redux unless state complexity requires it.

Do not add Tailwind, Material UI, Ant Design, or other UI frameworks unless asked or clearly required by the design export.

---

## Code Style Rules

Use consistent naming.

### Backend

Files:

```txt
auth.controller.js
auth.service.js
auth.repository.js
auth.routes.js
auth.model.js
auth.validation.js
```

Functions:

```txt
registerCustomer
loginUser
getCurrentUser
createEvent
getEvents
createBooking
getMyTickets
```

### Frontend

Components:

```txt
EventCard.jsx
CheckoutSummary.jsx
SeatMap.jsx
AdminSidebar.jsx
```

Hooks:

```txt
useAuth.js
useFetchEvents.js
```

Utilities:

```txt
formatDate.js
formatCurrency.js
mapApiError.js
```

---

## API Response Mapping Rule

Mongoose documents should not be returned directly when the response shape matters.

Use DTO/mapping functions when needed.

Example:

```js
function mapUserToDto(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    fullName: user.fullName,
    role: user.role
  };
}
```

Do not return:

```txt
passwordHash
__v
internal fields
```

---

## Error Handling Rule

Use application errors instead of throwing random strings.

Example:

```js
throw new AppError("Event not found.", 404);
```

Do not leak internal errors to users.

For server errors, return a generic message.

---

## Pagination and Filtering Rules

For list APIs:

- Support pagination if Swagger defines it.
- Support filters if Swagger defines them.
- Validate page and limit.
- Use safe default limits.
- Do not return huge unpaginated admin lists unless Swagger requires it.

Expected response shape should follow Swagger.

---

## Admin Analytics Rules

For analytics dashboard:

- Use aggregation queries where appropriate.
- Do not calculate analytics on the frontend if the API supports backend analytics.
- Match the design widgets and Swagger response.

If Swagger does not define analytics endpoints, do not invent them without asking.

---

## QR Ticket Rule

For ticket detail with QR:

- Implement QR code only if required by requirements, design, or Swagger.
- QR payload should not expose sensitive data.
- Prefer a ticket verification token or ticket ID according to requirements.
- Do not put raw user private data in QR payload.

---

## Waiting Room Rule

Implement waiting room only if requirements or Swagger define it.

If waiting room behavior is unclear, ask before coding.

Possible waiting room concerns:

- queue position
- event capacity
- reservation timeout
- seat lock expiration
- auto redirect to checkout

Do not invent these rules without confirmation.

---

## First Codex Prompt

After this file is created, the first prompt should be:

```txt
Read AGENTS.md and the docs folder. Do not code yet.

Create docs/implementation-plan.md with:

1. System summary.
2. MongoDB collections inferred from docs/database/migrations.sql.
3. API groups from docs/swagger.json.
4. Customer features.
5. Admin features.
6. Frontend screens from docs/design.
7. Implementation phases.
8. Conflicts or missing information between requirements, swagger, migration, and design.

Wait for my review before writing code.
```

---

## When Unsure

If something is missing, inconsistent, or ambiguous:

1. Stop.
2. Explain the issue.
3. List the possible interpretations.
4. Recommend the safest option.
5. Ask for confirmation before coding.

Do not guess critical business rules.