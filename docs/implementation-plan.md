# Ticket Rush Implementation Plan

## 1. System Summary

Ticket Rush is an online ticket booking system for seat-based events. Customers can register, log in, browse public events, view event details and seat maps, lock seats for a limited time, create pending orders, complete mock checkout, and view electronic tickets with QR codes. Admins can log in, manage users, events, images, seat sections, generated seats, orders, sold tickets, virtual queue entries, analytics, and audit logs.

The implementation target is:

- Frontend: ReactJS with Vite, React Router, Axios, and plain CSS/CSS modules.
- Backend: ExpressJS with module-based architecture.
- Database: MongoDB with Mongoose.
- API source of truth: `docs/swagger.json`.
- Business source of truth: `docs/requirements.md`.
- Data model source of truth: `docs/database/migrations.sql`, converted to MongoDB/Mongoose models.
- UI source of truth: `docs/design/**/code.html`, `screen.png`, and `flat_editorial_bold/DESIGN.md`.

The system should use MongoDB transactions for multi-document booking flows such as seat locking, order creation, checkout, ticket creation, and release of expired locks.

## 2. Main Business Roles

- Customer
  - Register and log in.
  - Manage own profile and password.
  - Browse and search public events.
  - View event details, images, sections, seats, and seat map.
  - Join virtual waiting queue when needed.
  - Lock and release own seats.
  - Create and cancel own pending orders.
  - Confirm mock checkout.
  - View own tickets and QR payload/image.

- Admin
  - Log in through the same auth API, but access admin screens and protected admin APIs.
  - Manage users and roles.
  - Create, update, delete, publish, open selling, close, and cancel events.
  - Manage event images.
  - Configure seat sections (Divide the area into sections and assign prices to each type of seat) and generate seat matrices.
  - Update seat statuses.
  - Release expired locks manually or through worker logic.
  - View and manage orders, tickets, queue entries, analytics, and audit logs.
  - Track revenue fluctuations and seat occupancy in real time (Real-time Dashboard).
  - Audience statistics by age and gender.

Roles are `Customer` and `Admin`. Public admin registration is not defined; the initial admin should be seeded for development/demo.

## 3. MongoDB Collections Inferred From Migration

- `users`
  - From `users`.
  - Fields: `username`, `passwordHash` mapped from SQL `password`, `email`, `fullName`, `dateOfBirth`, `gender`, timestamps.
  - Unique indexes on `username` and `email`.
  - `gender` enum: `Male`, `Female`, `Other`.

- `roles`
  - From `roles`.
  - Fields: `name`.
  - Unique `name`.
  - Enum: `Customer`, `Admin`.

- `userRoles` or embedded user role references
  - From `user_roles`.
  - MongoDB option: store `roles: [ObjectId]` on `users`, or create a separate `userRoles` collection.
  - Recommended: embed role ObjectId references in `users` unless strict join-table auditing is needed, while keeping API output compatible with Swagger `roles`.

- `events`
  - From `events`.
  - Fields: `name`, `description`, `startTime`, `endTime`, `location`, `status`, `createdBy`, timestamps.
  - `status` enum: `Draft`, `Published`, `Selling`, `Closed`, `Cancelled`.
  - Constraint: `endTime > startTime`.
  - Indexes: `status`, `startTime`, `createdBy`.

- `eventImages`
  - From `event_images`.
  - Fields: `eventId`, `imageUrl`, `createdAt`.
  - Cascade behavior should be implemented in service logic when an event is deleted.

- `seatSections`
  - From `seat_sections`.
  - Fields: `eventId`, `name`, `description`, `price`, timestamps.
  - Unique compound index: `{ eventId, name }`.
  - Constraint: `price > 0`.

- `seats`
  - From `seats`.
  - Fields: `sectionId`, `rowNumber`, `seatNumber`, `status`, timestamps.
  - `status` enum: `Available`, `Locked`, `Sold`, `Released`.
  - Unique compound index: `{ sectionId, rowNumber, seatNumber }`.
  - Useful derived DTO fields: `code`, `price`.

- `orders`
  - From `orders`.
  - Fields: `userId`, `eventId`, `totalAmount`, `status`, timestamps.
  - `status` enum: `Pending`, `Paid`, `Expired`, `Cancelled`.
  - Indexes: `userId`, `eventId`, `status`, `{ eventId, status }`.

- `orderItems`
  - From `order_items`.
  - Fields: `orderId`, `seatId`, `priceSnapshot`, `createdAt`.
  - Unique compound index: `{ orderId, seatId }`.
  - Constraint: `priceSnapshot > 0`.

- `seatLocks`
  - From `seat_locks`.
  - Fields: `seatId`, `userId`, `lockedAt`, `expiresAt`, `status`.
  - `status` enum: `Active`, `Released`, `Paid`, `Expired`.
  - Constraint: `expiresAt > lockedAt`.
  - MongoDB equivalent to SQL partial unique index: unique partial index on `{ seatId: 1 }` with filter `{ status: "Active" }`.

- `tickets`
  - From `tickets`.
  - Fields: `orderItemId`, `qrCode`, `issuedAt`.
  - Unique indexes on `orderItemId` and `qrCode`.

- `waitingQueue`
  - From `waiting_queue`.
  - Fields: `userId`, `eventId`, `position`, `token`, `status`, `createdAt`, `admittedAt`, `expiredAt`.
  - `status` enum: `Waiting`, `Admitted`, `Expired`.
  - Unique compound index: `{ userId, eventId }`.
  - Indexes: `eventId`, `status`, `{ eventId, status, position }`.

- `auditLogs`
  - From `audit_logs`.
  - Fields: `userId`, `action`, `entityType`, `entityId`, `metadata`, `createdAt`.
  - Indexes: `userId`, `createdAt`.

## 4. API Groups Inferred From Swagger

- System
  - `GET /health`

- Auth
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me`
  - `POST /auth/logout`

- Users and roles
  - `GET /users/me`
  - `PUT /users/me`
  - `PUT /users/me/password`
  - `GET /admin/users`
  - `GET /admin/users/{id}`
  - `DELETE /admin/users/{id}`
  - `PUT /admin/users/{id}/roles`
  - `GET /admin/roles`
  - `GET /admin/roles/{id}`

- Events and images
  - `GET /events`
  - `POST /events`
  - `GET /events/{eventId}`
  - `PUT /events/{eventId}`
  - `DELETE /events/{eventId}`
  - `POST /events/{eventId}/publish`
  - `POST /events/{eventId}/open-selling`
  - `POST /events/{eventId}/close`
  - `POST /events/{eventId}/cancel`
  - `GET /events/{eventId}/images`
  - `POST /events/{eventId}/images`
  - `DELETE /events/{eventId}/images/{id}`

- Seat sections and seats
  - `GET /events/{eventId}/sections`
  - `POST /events/{eventId}/sections`
  - `GET /events/{eventId}/sections/{sectionId}`
  - `PUT /events/{eventId}/sections/{sectionId}`
  - `DELETE /events/{eventId}/sections/{sectionId}`
  - `POST /events/{eventId}/sections/{sectionId}/generate-seats`
  - `GET /events/{eventId}/seat-map`
  - `GET /events/{eventId}/seats`
  - `GET /events/{eventId}/seats/{seatId}`
  - `PATCH /events/{eventId}/seats/{seatId}`
  - `GET /events/{eventId}/seat-map/changes`
  - `GET /events/{eventId}/seat-map/stream`

- Seat locks
  - `POST /events/{eventId}/seat-locks`
  - `GET /events/{eventId}/seat-locks`
  - `DELETE /events/{eventId}/seat-locks/{seatId}`
  - `POST /admin/seat-locks/release-expired`

- Orders and checkout
  - `GET /orders`
  - `POST /orders`
  - `GET /orders/{orderId}`
  - `DELETE /orders/{orderId}`
  - `POST /orders/{orderId}/checkout`
  - `GET /admin/orders`
  - `GET /admin/orders/{orderId}`

- Tickets
  - `GET /tickets`
  - `GET /tickets/{ticketId}`
  - `GET /tickets/{ticketId}/qr`
  - `POST /admin/tickets/verify`

- Waiting queue
  - `POST /queue/join`
  - `GET /queue/{queueId}`
  - `DELETE /queue/{queueId}`
  - `GET /queue/events/{eventId}/me`
  - `GET /admin/events/{eventId}/queue`
  - `POST /admin/events/{eventId}/queue/admit-batch`

- Dashboard and audit logs
  - `GET /admin/dashboard/events/{eventId}/revenue`
  - `GET /admin/dashboard/events/{eventId}/seat-occupancy`
  - `GET /admin/dashboard/events/{eventId}/demographics`
  - `GET /admin/dashboard/overview`
  - `GET /admin/audit-logs`

Swagger defines shared success/error response wrappers, pagination metadata, JWT bearer auth, role metadata through `x-required-roles`, and enums for roles/statuses.

## 5. Customer Features

- Customer registration with username, email, password, optional full name, date of birth, and gender.
- Login with `usernameOrEmail` and password.
- Authenticated profile view/update and password change.
- Event listing with keyword, status, date range, and pagination support.
- Event details with images, seat sections, seat map, and public availability.
- Seat map display with statuses `Available`, `Locked`, `Sold`, `Released`.
- Seat locking for 10 minutes using `POST /events/{eventId}/seat-locks`.
- Active lock display and cancellation/release.
- Pending order creation from locked seats.
- Mock checkout confirmation that marks seats sold and creates tickets.
- My orders and order detail.
- My tickets, ticket detail, and QR endpoint.
- Waiting room entry, status display, and leave queue.
- Seat-map realtime update via polling endpoint or optional SSE endpoint.

## 6. Admin Features

- Admin login using auth API and role-based route protection.
- Dashboard overview, revenue stats, seat occupancy stats, demographics.
- User and role management.
- Event CRUD plus status transitions: publish, open selling, close, cancel.
- Event image management.
- Seat section creation/update/deletion.
- Seat generation by rows and seats per row.
- Seat status management.
- Expired lock release action for admin/worker.
- All order listing and order detail.
- Ticket verification by QR code.
- Sold ticket/order management screen.
- Queue listing and admit-batch operation.
- Audit log listing and filtering.

## 7. Frontend Screens Found In `docs/design`

- `flat_editorial_bold`
  - Contains `DESIGN.md`, the visual system: Outfit typography, high-contrast flat editorial style, strong borders, color blocking, no shadows/gradients as core style guidance, 8px spacing unit.

- `ticketrush_customer_login`
  - Customer login page, Vietnamese text "Dang Nhap", TicketRush branding, concert visual, login form.

- `ticketrush_customer_register`
  - Customer registration page, Vietnamese text "Dang ky tai khoan", account details form.

- `ticketrush_customer_event_listing`
  - Public/customer event discovery page with hero search, categories, filters, event cards, load more, avatar/header navigation.

- `ticketrush_customer_event_details`
  - Event detail page for a sample "Cyberpunk Symphony", hero media, event metadata, CTA into seat selection.

- `ticketrush_customer_select_your_seats`
  - Seat selection page with event summary, seat matrix, legend, selected seats panel.

- `ticketrush_customer_checkout`
  - Checkout page with event details, selected tickets, payment method, order summary, countdown/timer cues.

- `ticketrush_customer_my_tickets`
  - My tickets list with purchased ticket cards/statuses.

- `ticketrush_customer_ticket_detail_with_qr`
  - Ticket detail page with QR code, ticket metadata, download/action controls.

- `ticketrush_customer_waiting_room`
  - Waiting room page showing queue position/status.

- `ticketrush_admin_login`
  - Admin portal login page.

- `ticketrush_admin_analytics_dashboard`
  - Admin dashboard with revenue, tickets sold, live users, virtual queue, charts.

- `ticketrush_admin_event_management`
  - Admin event management page with event cards/list and create/manage actions.

- `ticketrush_admin_event_seating_config`
  - Admin event and seat map configuration page for sections and generated seating.

- `ticketrush_admin_sold_ticket_management`
  - Admin orders and tickets management page.

## 8. Design Folder To React Route/Page Mapping

| Design folder | Route | Page component |
|---|---|---|
| `ticketrush_customer_login` | `/login` | `pages/public/LoginPage.jsx` |
| `ticketrush_customer_register` | `/register` | `pages/public/RegisterPage.jsx` |
| `ticketrush_customer_event_listing` | `/` and `/events` | `pages/public/EventListingPage.jsx` |
| `ticketrush_customer_event_details` | `/events/:eventId` | `pages/public/EventDetailsPage.jsx` |
| `ticketrush_customer_select_your_seats` | `/events/:eventId/seats` | `pages/customer/SeatSelectionPage.jsx` |
| `ticketrush_customer_checkout` | `/checkout/:eventId` or `/orders/:orderId/checkout` | `pages/customer/CheckoutPage.jsx` |
| `ticketrush_customer_my_tickets` | `/my-tickets` | `pages/customer/MyTicketsPage.jsx` |
| `ticketrush_customer_ticket_detail_with_qr` | `/my-tickets/:ticketId` | `pages/customer/TicketDetailPage.jsx` |
| `ticketrush_customer_waiting_room` | `/waiting-room` or `/events/:eventId/waiting-room` | `pages/customer/WaitingRoomPage.jsx` |
| `ticketrush_admin_login` | `/admin/login` | `pages/admin/AdminLoginPage.jsx` |
| `ticketrush_admin_analytics_dashboard` | `/admin/dashboard` | `pages/admin/AdminAnalyticsDashboardPage.jsx` |
| `ticketrush_admin_event_management` | `/admin/events` | `pages/admin/AdminEventManagementPage.jsx` |
| `ticketrush_admin_event_seating_config` | `/admin/events/:eventId/seating` | `pages/admin/AdminEventSeatingConfigPage.jsx` |
| `ticketrush_admin_sold_ticket_management` | `/admin/sold-tickets` | `pages/admin/AdminSoldTicketManagementPage.jsx` |

Routes should be confirmed before implementation because Swagger defines API paths, not frontend routes. AGENTS.md suggests `/checkout`, `/checkout/:eventId`, and `/waiting-room`; the designs imply event-specific seat and queue context.

## 9. Backend Modules To Implement

- `auth`
  - Register, login, current user, logout/audit.

- `users`
  - Profile, password change, admin user list/detail/delete, role assignment.

- `roles`
  - Seed/list/get roles. No role creation/update/delete endpoint is defined.

- `events`
  - Public listing/detail, admin CRUD, status transitions.

- `event-images`
  - List/add/delete event images.

- `seat-sections`
  - Section CRUD and validation.

- `seats`
  - Seat generation, seat listing/detail, seat map, admin seat status update, polling/SSE changes.

- `seat-locks`
  - Lock seats, get my locks, release own lock, release expired locks.

- `orders`
  - My orders, create pending order, order detail, cancel pending order, mock checkout, admin orders.

- `tickets`
  - My tickets, ticket detail, ticket QR, admin verify ticket.

- `waiting-queue`
  - Join, status, leave, get my event queue entry, admin list queue, admit batch.

- `dashboard`
  - Revenue, seat occupancy, demographics, overview.

- `audit-logs`
  - Admin audit log listing and audit write helpers for sensitive/admin actions.

- `common`
  - `AppError`, response helpers, async handler, DTO mappers, pagination helpers, constants.

- `middlewares`
  - Auth, role, validation, not found, error handling.

- `database`
  - Mongo connection, seed roles/admin/demo data, optional lock release worker.

## 10. Frontend Modules, Pages, And Components To Implement

- App foundation
  - `app/router.jsx`, `app/providers.jsx`, auth provider/store, route guards.
  - `api/axiosClient.js` with bearer token interceptor.
  - API files: `authApi.js`, `userApi.js`, `eventApi.js`, `seatApi.js`, `seatLockApi.js`, `orderApi.js`, `ticketApi.js`, `queueApi.js`, `adminApi.js`.

- Layouts
  - `PublicLayout.jsx`
  - `CustomerLayout.jsx`
  - `AdminLayout.jsx`

- Public/customer pages
  - `LoginPage.jsx`
  - `RegisterPage.jsx`
  - `EventListingPage.jsx`
  - `EventDetailsPage.jsx`
  - `SeatSelectionPage.jsx`
  - `CheckoutPage.jsx`
  - `MyTicketsPage.jsx`
  - `TicketDetailPage.jsx`
  - `WaitingRoomPage.jsx`

- Admin pages
  - `AdminLoginPage.jsx`
  - `AdminAnalyticsDashboardPage.jsx`
  - `AdminEventManagementPage.jsx`
  - `AdminEventSeatingConfigPage.jsx`
  - `AdminSoldTicketManagementPage.jsx`

- Shared/common components
  - Button, input, select, modal/dialog, badge/status badge, page header, loading state, error state, pagination controls.

- Event components
  - Event card, event filters/search, event hero, event metadata, event image gallery.

- Booking components
  - Seat map, seat legend, selected seats panel, lock countdown, checkout summary, payment confirmation panel.

- Ticket components
  - Ticket card, ticket detail panel, QR card.

- Admin components
  - Admin sidebar/navigation, admin topbar, admin table/list, event form, section form, seat config matrix, dashboard metric cards, chart placeholders or lightweight CSS/chart implementation.

- Utilities/constants
  - Roles, statuses, date/time formatting, currency formatting, API error mapping, local storage token helpers.

## 11. Recommended Implementation Phases

1. Documentation review and plan
   - Complete this implementation plan.
   - Resolve open questions before coding.

2. Repository setup
   - Create root package, `.gitignore`, `.env.example`, README, `apps/api`, `apps/web`, and optional `packages/shared`.
   - Do not implement business logic in this phase beyond basic scripts.

3. Backend foundation
   - Express app, env config, Mongo connection, health route, error/not-found middleware, response helper, route aggregator.

4. Shared constants and Mongoose models
   - Implement schemas and indexes from migration/Swagger.
   - Seed roles and a development admin.

5. Auth, users, and roles
   - JWT auth, bcrypt hashing, register/login/me/logout, profile, password, admin users and roles.

6. Events, images, seat sections, and seats
   - Public event APIs, admin event management, image management, section CRUD, seat generation, seat map.

7. Seat locking and realtime seat updates
   - MongoDB transaction-based locks, partial unique indexes, release own locks, release expired locks, polling endpoint first.
   - Treat SSE as optional unless explicitly required for the first delivery.

8. Orders, checkout, and tickets
   - Create orders from active locks, cancel pending orders, mock checkout, mark seats sold, create tickets/QR payloads.

9. Waiting queue
   - Join/status/leave/admit-batch and queue token checks if virtual queue mode is active.

10. Admin analytics and audit logs
   - Aggregation-based revenue, seat occupancy, demographics, overview, audit log list.

11. Frontend foundation
   - Vite React app, routing, auth state, Axios client, layouts, route guards, global styles using design tokens.

12. Customer UI
   - Implement customer/public screens mapped from design exports and integrate with APIs.

13. Admin UI
   - Implement admin screens mapped from design exports and integrate with APIs.

14. Integration review
   - Compare frontend API calls against `docs/swagger.json`.
   - Verify response DTOs do not expose password hashes or Mongoose internals.

15. Testing and polish
   - Add focused backend tests for auth, role guards, seat locking, checkout, ownership checks.
   - Add frontend build checks and manual demo flow verification.

## 12. Conflicts Or Missing Information

- Swagger says it is aligned with PostgreSQL migration, but the implementation must use MongoDB. This is not a business conflict, but all transaction and row-lock language must be translated to MongoDB sessions, atomic updates, and unique partial indexes.

- Swagger `User` schema includes a `password` property with a note that it is only accepted in write requests and never returned. Backend DTOs must never return `password` or `passwordHash`, even if the schema lists the property.

- Requirements mention event search by name, time, location, and status, and filtering by category. Swagger `GET /events` includes `keyword`, `status`, `from`, and `to`, but no explicit `location` or `category` query parameter. Since Swagger is the API source of truth, do not add `location` or `category` filters unless approved.

- Design event listing includes categories such as concerts, sports, theater, comedy, and filters such as relevance, price, and popularity. Migration and Swagger do not define `category`, event popularity, or ticket price sorting directly. These UI controls may need to be static or omitted/limited unless new API fields are approved.

- Requirements mention admin delete or hide/soft delete for events, especially when tickets exist. Swagger exposes `DELETE /events/{eventId}` with `204` but does not specify soft delete fields. Migration has no `deletedAt` or `isDeleted`. Clarify hard delete vs soft delete behavior before implementation.

- Requirements say initial event status can be `Draft`, while Swagger `CreateEventRequest` requires `status` but notes backend may default to Draft if omitted. Because the schema marks `status` required, validation should require it unless the team approves honoring the description instead.

- Requirements discuss real-time updates using polling or WebSocket. Swagger defines polling and SSE endpoints, and mentions WebSocket as an alternative in description only. Implement polling first and treat SSE as optional unless real-time strictness is required.

- Requirements define Virtual Queue as advanced, while Swagger includes full queue APIs. Because Swagger is source of truth, queue endpoints should be implemented, but exact trigger rules for when queue mode is active are not defined.

- Swagger `LockSeatsRequest.queueToken` is required only when virtual waiting queue is enabled, but there is no event field or system setting that says queue is enabled. This requires clarification.

- Waiting room design has a generic queue screen, but frontend route and event context are not explicit. It likely needs an `eventId` context to call queue APIs.

- Admin analytics design shows "Live Users" and virtual queue metrics. Swagger overview schema needs to be checked during implementation for exact fields; migration has no sessions/live-user collection. Live users may need to be derived or represented as a placeholder if not supported by API data.

- Requirements mention customer can cancel selected seats before payment. Swagger supports `DELETE /events/{eventId}/seat-locks/{seatId}` and `DELETE /orders/{orderId}`, but no bulk release endpoint.

- Requirements mention ticket QR code can contain ticket code or verification URL. Swagger stores `qrCode` text and has `GET /tickets/{ticketId}/qr`, but exact QR image generation method and payload format are not specified.

- Design exports use remote Google-hosted image URLs. The repo has no local asset folder yet. The implementation should either reference those URLs as design-derived placeholders or replace them with locally stored/generated assets after approval.

- Some design text is Vietnamese for login/register while other screens are English. The product language should be clarified before frontend implementation.

- Requirements and migration use SQL terms such as row locking and cronjob/background worker. MongoDB implementation needs MongoDB-specific semantics, and scheduled worker behavior needs a chosen runtime strategy.

## 13. Questions To Clarify Before Coding

1. Should frontend copy be English, Vietnamese, or mixed exactly as exported in the design HTML?

2. Should event deletion be a hard delete matching Swagger `204`, or a soft delete/hidden state as recommended by requirements?

3. Should `CreateEventRequest.status` be required exactly as Swagger schema says, or should backend default to `Draft` as Swagger description allows?

4. Should virtual queue be always available, event-specific and manually enabled, or only used as a demo feature? If event-specific, what field controls it since migration/Swagger do not define one?

5. What should a valid QR payload contain: raw `qrCode` token, ticket ID, or a verification URL?

6. Should `GET /tickets/{ticketId}/qr` return JSON with QR payload, an SVG/PNG image, or both? Swagger allows "QR code image or QR code payload" but is not strict.

7. Should we implement SSE in the first build, or is the polling endpoint sufficient for "realtime" seat-map updates?

8. Should design remote images be used directly, downloaded into local assets, or replaced with generated/local placeholders?

9. Should categories, price sorting, popularity, and "near me" controls shown in the design be static visual controls until matching API fields are approved?

10. Should role assignment use a separate `userRoles` collection to mirror SQL exactly, or embedded role references in `users` for a simpler MongoDB model?

11. Should a background worker be part of the Express process for expired seat locks, or should expired locks only be released through the admin/worker endpoint for the first implementation?

12. Should admin-created demo data be seeded so the design screens have realistic events, seats, orders, and tickets immediately after setup?

