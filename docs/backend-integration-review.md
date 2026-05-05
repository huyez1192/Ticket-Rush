# Backend Integration Review

Phase: 7.5 Backend Integration Review  
Review date: 2026-05-05  
Scope: `apps/api` backend after Phases 1-7, compared against `docs/swagger.json`, `docs/requirements.md`, and `docs/model-mapping.md`.

## Executive Summary

The backend has a working Express/Mongoose foundation and covers the main customer flow: auth, public event browsing, seat sections/seats, seat locking, order creation, mock checkout, ticket creation, ticket QR payload, and minimal waiting queue behavior. Admin event management and seat configuration are also mostly present.

The backend is not yet fully Swagger-complete. Out of 64 Swagger endpoints:

- Implemented: 46
- Partially implemented: 6
- Not implemented: 11
- Intentionally skipped/deferred: 1

The largest gaps are admin users/roles, dashboard analytics, audit logs, the SSE seat-map stream, and several contract/business-rule mismatches. The biggest technical risks before frontend integration are event hard delete data integrity, incomplete admin/dashboard API coverage, checkout/seat state edge cases, and health/response contract mismatches.

Recommendation: Phase 8 frontend foundation can start only as a shell/routing/auth-client foundation. Full frontend API integration should wait until the critical and high priority backend issues below are resolved or explicitly accepted.

## Runtime Route Prefixes

Express mounts all backend routes under `/api` in `apps/api/src/app.js`.

Current route aggregator in `apps/api/src/routes/index.js` mounts:

- `/api/health`
- `/api/auth/*`
- `/api/users/*`
- `/api/events/*`
- `/api/orders/*`
- `/api/tickets/*`
- `/api/queue/*`
- `/api/admin/*`

Swagger server URL is `http://localhost:8080/api`, while the project environment default is currently port `5000`. This is not a route bug, but frontend configuration must use `VITE_API_BASE_URL`, not hard-code Swagger's server port.

## Endpoint Coverage Table

Status meanings:

- Implemented: route exists and broadly matches method/path/security/DTO.
- Partially implemented: route exists but has notable contract, validation, response, or business-rule gaps.
- Not implemented: Swagger endpoint has no backend route.
- Intentionally skipped: deliberately deferred behavior.

| # | Method | Swagger path | Status | Backend route file | Notes |
|---:|---|---|---|---|---|
| 1 | GET | `/health` | Partially implemented | `apps/api/src/routes/index.js` | Runtime path exists at `/api/health`, but response is wrapped in `ApiSuccess`; Swagger `HealthResponse` expects top-level `status`, `service`, `timestamp`. |
| 2 | POST | `/auth/register` | Implemented | `apps/api/src/modules/auth/auth.routes.js` | Public customer registration. |
| 3 | POST | `/auth/login` | Implemented | `apps/api/src/modules/auth/auth.routes.js` | Single login endpoint for Customer/Admin. |
| 4 | GET | `/auth/me` | Implemented | `apps/api/src/modules/auth/auth.routes.js` | Requires bearer token. |
| 5 | POST | `/auth/logout` | Implemented | `apps/api/src/modules/auth/auth.routes.js` | Stateless JWT logout response. |
| 6 | GET | `/users/me` | Implemented | `apps/api/src/modules/users/user.routes.js` | Requires bearer token. |
| 7 | PUT | `/users/me` | Implemented | `apps/api/src/modules/users/user.routes.js` | Requires bearer token. |
| 8 | PUT | `/users/me/password` | Implemented | `apps/api/src/modules/users/user.routes.js` | Requires bearer token. |
| 9 | GET | `/admin/users` | Not implemented | - | Required by Swagger for admin user management. |
| 10 | GET | `/admin/users/{id}` | Not implemented | - | Required by Swagger. |
| 11 | DELETE | `/admin/users/{id}` | Not implemented | - | Required by Swagger. |
| 12 | PUT | `/admin/users/{id}/roles` | Not implemented | - | Required by Swagger; important because roles are modeled as documents. |
| 13 | GET | `/admin/roles` | Not implemented | - | Required by Swagger. |
| 14 | GET | `/admin/roles/{id}` | Not implemented | - | Required by Swagger. |
| 15 | GET | `/events` | Implemented | `apps/api/src/modules/events/event.routes.js` | Public route; filters implemented: `page`, `limit`, `keyword`, `status`, `from`, `to`. |
| 16 | POST | `/events` | Implemented | `apps/api/src/modules/events/event.routes.js` | Admin only. |
| 17 | GET | `/events/{eventId}` | Implemented | `apps/api/src/modules/events/event.routes.js` | Public detail only for `Published`/`Selling`. |
| 18 | PUT | `/events/{eventId}` | Partially implemented | `apps/api/src/modules/events/event.routes.js` | Admin only. Allows direct `status` update without lifecycle transition enforcement. |
| 19 | DELETE | `/events/{eventId}` | Implemented with risk | `apps/api/src/modules/events/event.routes.js` | Admin only. Hard deletes event-related images/seats/sections; see critical issue. |
| 20 | POST | `/events/{eventId}/publish` | Implemented | `apps/api/src/modules/events/event.routes.js` | Admin only; enforces `Draft -> Published`. |
| 21 | POST | `/events/{eventId}/open-selling` | Implemented | `apps/api/src/modules/events/event.routes.js` | Admin only; enforces `Published -> Selling`. |
| 22 | POST | `/events/{eventId}/close` | Implemented | `apps/api/src/modules/events/event.routes.js` | Admin only; enforces `Selling -> Closed`. |
| 23 | POST | `/events/{eventId}/cancel` | Implemented | `apps/api/src/modules/events/event.routes.js` | Admin only; enforces `Published/Selling -> Cancelled`. |
| 24 | GET | `/events/{eventId}/images` | Implemented | `apps/api/src/modules/events/event.routes.js` | Public route. |
| 25 | POST | `/events/{eventId}/images` | Implemented | `apps/api/src/modules/events/event.routes.js` | Admin only, URL-based image creation. |
| 26 | DELETE | `/events/{eventId}/images/{id}` | Implemented | `apps/api/src/modules/events/event.routes.js` | Admin only. |
| 27 | GET | `/events/{eventId}/sections` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Public route. |
| 28 | POST | `/events/{eventId}/sections` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Admin only. |
| 29 | GET | `/events/{eventId}/sections/{sectionId}` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Public route. |
| 30 | PUT | `/events/{eventId}/sections/{sectionId}` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Admin only. |
| 31 | DELETE | `/events/{eventId}/sections/{sectionId}` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Admin only; rejects delete when seats exist. |
| 32 | POST | `/events/{eventId}/sections/{sectionId}/generate-seats` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Admin only. |
| 33 | GET | `/events/{eventId}/seat-map` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Public route. |
| 34 | GET | `/events/{eventId}/seats` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Public route; supports `sectionId`, `status`, `page`, `limit`. |
| 35 | GET | `/events/{eventId}/seats/{seatId}` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Public route. |
| 36 | PATCH | `/events/{eventId}/seats/{seatId}` | Partially implemented | `apps/api/src/modules/seats/seat.routes.js` | Admin only. Allows any `SeatStatus`, including risky manual `Sold`/`Released` changes without lock/order checks. |
| 37 | POST | `/events/{eventId}/seat-locks` | Partially implemented | `apps/api/src/modules/seats/seatLock.routes.js` | Customer-only. Does not validate/enforce `queueToken` when queue mode is active because no queue-mode source exists. |
| 38 | GET | `/events/{eventId}/seat-locks` | Implemented | `apps/api/src/modules/seats/seatLock.routes.js` | Customer-only, own active locks. |
| 39 | DELETE | `/events/{eventId}/seat-locks/{seatId}` | Implemented | `apps/api/src/modules/seats/seatLock.routes.js` | Customer-only, own lock release. |
| 40 | POST | `/admin/seat-locks/release-expired` | Implemented | `apps/api/src/modules/seats/seatLock.routes.js` | Admin only. |
| 41 | GET | `/orders` | Implemented | `apps/api/src/modules/bookings/order.routes.js` | Customer-only, own orders. |
| 42 | POST | `/orders` | Partially implemented | `apps/api/src/modules/bookings/order.routes.js` | Customer-only. Allows multiple pending orders for the same active locks. |
| 43 | GET | `/orders/{orderId}` | Implemented | `apps/api/src/modules/bookings/order.routes.js` | Customer-only, own order. |
| 44 | DELETE | `/orders/{orderId}` | Implemented | `apps/api/src/modules/bookings/order.routes.js` | Customer-only, pending order cancel. |
| 45 | POST | `/orders/{orderId}/checkout` | Partially implemented | `apps/api/src/modules/bookings/order.routes.js` | Customer-only. Does not verify seat update modified count before marking paid/generating tickets. |
| 46 | GET | `/admin/orders` | Implemented | `apps/api/src/modules/bookings/order.routes.js` | Admin only. |
| 47 | GET | `/admin/orders/{orderId}` | Implemented | `apps/api/src/modules/bookings/order.routes.js` | Admin only. |
| 48 | GET | `/tickets` | Implemented | `apps/api/src/modules/tickets/ticket.routes.js` | Customer-only, own tickets. |
| 49 | GET | `/tickets/{ticketId}` | Implemented | `apps/api/src/modules/tickets/ticket.routes.js` | Customer-only, own ticket. |
| 50 | GET | `/tickets/{ticketId}/qr` | Implemented | `apps/api/src/modules/tickets/ticket.routes.js` | Customer-only, returns JSON QR payload. |
| 51 | POST | `/admin/tickets/verify` | Implemented | `apps/api/src/modules/tickets/ticket.routes.js` | Admin only, verifies QR token existence. |
| 52 | POST | `/queue/join` | Implemented | `apps/api/src/modules/waiting-queue/waitingQueue.routes.js` | Customer-only. |
| 53 | GET | `/queue/{queueId}` | Implemented | `apps/api/src/modules/waiting-queue/waitingQueue.routes.js` | Customer-only, own entry. |
| 54 | DELETE | `/queue/{queueId}` | Implemented | `apps/api/src/modules/waiting-queue/waitingQueue.routes.js` | Customer-only, own entry delete. |
| 55 | GET | `/queue/events/{eventId}/me` | Implemented | `apps/api/src/modules/waiting-queue/waitingQueue.routes.js` | Customer-only, own entry for event. |
| 56 | GET | `/admin/events/{eventId}/queue` | Implemented | `apps/api/src/modules/waiting-queue/waitingQueue.routes.js` | Admin only. |
| 57 | POST | `/admin/events/{eventId}/queue/admit-batch` | Implemented | `apps/api/src/modules/waiting-queue/waitingQueue.routes.js` | Admin only. |
| 58 | GET | `/admin/dashboard/events/{eventId}/revenue` | Not implemented | - | Required by Swagger and requirements FR-18. |
| 59 | GET | `/admin/dashboard/events/{eventId}/seat-occupancy` | Not implemented | - | Required by Swagger and requirements FR-19. |
| 60 | GET | `/admin/dashboard/events/{eventId}/demographics` | Not implemented | - | Required by Swagger and requirements FR-20. |
| 61 | GET | `/admin/dashboard/overview` | Not implemented | - | Required by Swagger/admin dashboard. |
| 62 | GET | `/admin/audit-logs` | Not implemented | - | AuditLog model exists, but no admin route/service. |
| 63 | GET | `/events/{eventId}/seat-map/changes` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Public polling endpoint. |
| 64 | GET | `/events/{eventId}/seat-map/stream` | Intentionally skipped | - | SSE stream not implemented; polling endpoint exists. Needs explicit acceptance or implementation. |

## Route Correctness

No exact duplicate method/path pairs were found among implemented Express routes.

No currently mounted route is using a different path from Swagger, once the `/api` prefix is applied. Runtime examples:

- Swagger `/auth/login` -> runtime `/api/auth/login`
- Swagger `/events/{eventId}/seat-locks` -> runtime `/api/events/:eventId/seat-locks`
- Swagger `/admin/events/{eventId}/queue` -> runtime `/api/admin/events/:eventId/queue`

Important route-order observations:

- `seatLockRoutes`, `orderRoutes`, `ticketRoutes`, and `waitingQueueRoutes` are mounted before `/events` routes. This prevents `/admin/events/:eventId/queue` from being interpreted as an event route.
- `seatRoutes` is mounted before `eventRoutes`, so `/events/:eventId/sections`, `/seat-map`, `/seats`, and `/seat-map/changes` are reached before the generic `/events/:eventId` detail route.
- `/queue/:queueId` is declared before `/queue/events/:eventId/me`, but Express exact matching means `/queue/:queueId` does not consume the longer `/queue/events/:eventId/me` path.

Path parameter assumptions:

- Swagger documents legacy integer IDs. Backend correctly uses MongoDB ObjectId strings per `docs/model-mapping.md`.
- All implemented resource validators currently reject non-ObjectId IDs. This is intentional for MongoDB, but frontend code must treat all IDs as strings.

Missing routes:

- All `/admin/users*` and `/admin/roles*`
- All `/admin/dashboard*`
- `/admin/audit-logs`
- `/events/{eventId}/seat-map/stream`

## Request Validation Correctness

General findings:

- Implemented validators use Zod and `.strict()` for bodies/query objects, which is good for NoSQL injection resistance.
- ObjectId validation is consistently applied for implemented MongoDB resource IDs.
- Query pagination limits are capped at 100 for implemented list endpoints.

Validation mismatches and gaps:

- `GET /health`: no request validation needed, but response shape differs from Swagger.
- `PUT /events/{eventId}`: Swagger allows optional `status`; code accepts `status` but bypasses the explicit status transition service. This can undermine lifecycle endpoints.
- `PATCH /events/{eventId}/seats/{seatId}`: code accepts every `SeatStatus`. Requirements warn that sold seats should not be freely edited; current validation does not restrict unsafe transitions.
- `POST /events/{eventId}/seat-locks`: code accepts optional `queueToken` but ignores it. Swagger says it is required when virtual queue mode is enabled; backend has no queue-mode setting to know when to enforce it.
- `POST /orders`: validation matches Swagger fields, but service does not reject duplicate pending orders for seats already in a pending order by the same user.
- `POST /orders/{orderId}/checkout`: validation matches Swagger, but service should check all seat status updates actually succeeded.
- `GET /admin/users`: not implemented, so Swagger query params `page`, `limit`, `keyword`, `role` are not validated.
- `PUT /admin/users/{id}/roles`: not implemented, so `AssignRolesRequest.roleIds` is not validated.
- Dashboard and audit log query params are not validated because routes are missing.
- `GET /events/{eventId}/seat-map/stream`: not implemented, so no params/security behavior exists.

Fields accepted by code but not material to Swagger:

- `POST /events` accepts `imageUrls`, which is present in Swagger `CreateEventRequest`.
- `POST /events/{eventId}/sections/{sectionId}/generate-seats` accepts `initialStatus`, which is present in Swagger.
- `POST /events/{eventId}/seat-locks` accepts nullable `queueToken`; Swagger defines string but does not explicitly mark nullable.

Wrong enum values:

- No wrong enum values found in constants. Current values match Swagger/migration style: `Customer`, `Admin`, `Draft`, `Published`, `Selling`, `Closed`, `Cancelled`, `Available`, `Locked`, `Sold`, `Released`, `Pending`, `Paid`, `Expired`, `Cancelled`, `Active`, `Released`, `Paid`, `Expired`, `Waiting`, `Admitted`, `Expired`.

## Response Shape Correctness

General findings:

- Most mappers convert `_id` to `id`.
- Mappers avoid returning `passwordHash` and `__v`.
- User auth/profile responses return role DTOs and do not expose password hashes.
- Ticket QR endpoint returns JSON `{ ticketId, qrCode }`, which is allowed by Swagger's "QR code image or QR code payload" intent.

Response mismatches and risks:

- `GET /health` is the clearest Swagger mismatch. Code returns:
  - `status`
  - `message`
  - `data.service`
  - `data.environment`
  - `data.timestamp`
  Swagger expects `HealthResponse` with top-level:
  - `status`
  - `service`
  - `timestamp`
- Event DTO includes `createdBy` but not `createdByUser`. Swagger includes optional `createdByUser`. This is acceptable for required fields but may limit admin UI richness.
- `mapSeatMapChangeToDto` returns no `oldStatus`. Swagger makes `oldStatus` optional, so this is acceptable.
- Some delete endpoints correctly return `204 No Content`, matching Swagger.
- `POST /events`, `POST /events/{eventId}/sections`, and other creates return `200` in Swagger and code, so no 201 mismatch.
- Admin dashboard/audit response shapes cannot be checked because routes are missing.

Internal field exposure:

- No mapper was found returning `passwordHash`.
- No mapper was found returning `__v`.
- Raw Mongoose documents are generally mapped before response.

## Auth And Role Protection

Implemented public endpoints are public in code:

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /events`
- `GET /events/{eventId}`
- `GET /events/{eventId}/images`
- `GET /events/{eventId}/sections`
- `GET /events/{eventId}/sections/{sectionId}`
- `GET /events/{eventId}/seat-map`
- `GET /events/{eventId}/seat-map/changes`
- `GET /events/{eventId}/seats`
- `GET /events/{eventId}/seats/{seatId}`

Implemented customer-private endpoints require `authenticate` and `requireRole(ROLES.CUSTOMER)`:

- Seat locks
- Orders
- Tickets
- Waiting queue customer endpoints

Implemented admin endpoints require `authenticate` and `requireRole(ROLES.ADMIN)`:

- Event create/update/delete/status endpoints
- Event image create/delete
- Seat section create/update/delete
- Seat generation
- Seat status update
- Admin orders
- Admin ticket verification
- Expired lock release
- Admin queue list/admit

Ownership checks:

- Customer orders use `userId` filters for list/detail/cancel/checkout.
- Customer tickets use `userId` filters for list/detail/QR.
- Customer seat lock release uses `userId`, `seatId`, `Active` status.
- Customer queue entry lookup/delete uses `userId`.

Expected auth status behavior:

- Missing/invalid bearer token returns 401 through `authenticate`.
- Wrong role returns 403 through `requireRole`.

Gaps:

- Swagger does not mark customer endpoints with `x-required-roles`, but code requires Customer role. This matches business requirements but is stricter than Swagger metadata.
- Admin user/role/dashboard/audit endpoints cannot be checked because they are missing.

## Business Rules Review

### Event Visibility

Public event listing/detail only returns `Published` and `Selling` events. This matches the public browsing requirement and avoids exposing `Draft`/`Cancelled`.

Potential issue: requirements mention upcoming/open events and search by location/category. Swagger only supports `keyword`, `status`, `from`, and `to`; backend follows Swagger and does not add `category`.

### Event Status Transitions

Dedicated endpoints enforce:

- `Draft -> Published`
- `Published -> Selling`
- `Selling -> Closed`
- `Published/Selling -> Cancelled`

Gaps:

- `PUT /events/{eventId}` can update `status` directly without transition enforcement.
- No route returns allowed next transitions to help frontend disable invalid actions.

### Seat Locks

Implemented behavior:

- Only `Selling` events can be locked.
- Seat must belong to event.
- Seat must be `Available`.
- Seat is atomically changed from `Available` to `Locked`.
- Active lock unique partial index on `{ seatId }` prevents two active locks for one seat.
- Lock expires after 10 minutes.
- Customer can release only own active lock.
- Admin can release expired active locks.

Gaps:

- No background worker/cron exists for automatic expired lock release. Requirements SYS-03 says this is mandatory.
- `queueToken` is ignored because there is no event/system queue mode flag.
- Released/expired seats are moved directly back to `Available`; the `Released` seat status exists but is not used in this path.
- Transaction fallback allows local standalone MongoDB to work, but this is weaker than true transaction guarantees for multi-document changes.

### Checkout / Orders / Tickets

Implemented behavior:

- Customer creates a pending order from seats actively locked by the same user.
- Total is calculated from section price snapshots.
- Checkout requires `confirm: true`.
- Checkout validates locks are active and not expired.
- Checkout marks seats `Sold`, locks `Paid`, order `Paid`, and creates one ticket per order item.
- Ticket QR token is unique and non-sensitive.

Gaps:

- Same active locks can be used to create multiple pending orders by the same customer.
- Checkout does not verify that `updateMany` actually changed every selected seat to `Sold`.
- There is no explicit index preventing a seat from appearing in multiple orders across different orders.
- There is no automatic expiration/cancellation of pending orders when locks expire.

### Admin Verification

Admin QR verification checks whether a ticket exists for the QR token and returns `{ valid, ticket }`. It does not mark tickets as used/checked in because Swagger does not define a ticket usage state.

### Event Hard Delete Risk

`DELETE /events/{eventId}` currently hard deletes event images, seats, seat sections, and the event. It does not check for existing orders, order items, tickets, or locks. This can orphan order/ticket records or make ticket detail responses lose event/seat context.

Requirements explicitly say event delete should likely be soft delete/hidden if tickets exist. This is a critical data integrity risk.

## MongoDB / Mongoose Consistency

Model mapping is mostly aligned with `docs/model-mapping.md`:

- `Role` collection exists.
- `User.roles: [ObjectId<Role>]` is preserved.
- Events, event images, seat sections, seats, seat locks, orders, order items, tickets, waiting queue, and audit logs are separate collections.
- Important unique indexes exist for username, email, role name, section name per event, seat position per section, active seat lock, order item per order+seat, ticket order item, ticket QR code, and waiting queue user+event.

Index and integrity concerns:

- No unique or partial index prevents the same seat from appearing in multiple active/pending order items across different orders.
- Waiting queue position assignment uses "latest position + 1" without a unique `{ eventId, position }` index or transaction, so concurrent joins can produce duplicate positions.
- `AuditLog` model exists, but no audit write helpers/routes are used.

Transaction behavior:

- `runWithOptionalTransaction` uses MongoDB transactions when available.
- On standalone MongoDB, it retries without a transaction. This is pragmatic for local development but weaker than requirements SYS-01 for production.
- This fallback should be documented in README or environment notes, and production should run MongoDB as a replica set if strict multi-document transaction semantics are required.

## Seed Consistency

Seed behavior is mostly good:

- Seeds `Customer` and `Admin` roles.
- Seeds one admin account: `admin@example.com / Admin@123456`.
- Seeds one customer account: `customer@example.com / Customer@123456`.
- Seeds two public demo events with images, sections, and seats.
- Uses upsert/find-one patterns for roles, users, events, event images, sections, and seats.
- Re-running seed does not duplicate normal seeded roles/users/events/sections/seats.

Seed gaps:

- Seed does not create a demo order/ticket. This is acceptable but admin sold-ticket screens require a manual checkout flow before showing sold data.
- Seed does not create queue entries. Waiting room screens require manual queue join.
- Seed does not clean up smoke-test events/orders created during manual tests.

## Critical Issues

1. Event hard delete can corrupt historical order/ticket data.
   - File: `apps/api/src/modules/events/event.service.js`
   - `deleteAdminEvent` deletes event images, seats, sections, and event without checking orders/tickets.
   - Risk: ticket/order detail can lose seat/event references; sold ticket history becomes inconsistent.
   - Recommended fix: block delete when orders/tickets/locks exist, or implement soft delete/status-based cancellation instead.

2. Checkout can mark an order paid and create tickets without confirming all seats were changed to `Sold`.
   - File: `apps/api/src/modules/bookings/order.service.js`
   - `updateMany` result is ignored.
   - Risk: if seat state has drifted, tickets can be generated for seats not successfully sold in the same operation.
   - Recommended fix: check `matchedCount`/`modifiedCount` equals selected seat count or use per-seat conditional updates inside a transaction.

3. Production transaction semantics are not guaranteed on standalone MongoDB.
   - File: `apps/api/src/common/utils/runWithOptionalTransaction.js`
   - Fallback is useful locally but does not meet the strongest reading of SYS-01 for multi-document booking consistency.
   - Recommended fix: document local fallback, require replica set for production, and consider failing fast in production if transactions are unavailable.

## High Priority Issues

1. Missing Swagger admin APIs.
   - Missing: `/admin/users`, `/admin/users/{id}`, `/admin/users/{id}/roles`, `/admin/roles`, `/admin/dashboard/*`, `/admin/audit-logs`.
   - Impact: admin frontend screens cannot be fully wired.

2. `PUT /events/{eventId}` can bypass status lifecycle.
   - File: `apps/api/src/modules/events/event.service.js`
   - Recommended fix: either remove `status` from update validation or run `assertStatusTransition` for body status.

3. Duplicate pending orders can be created from the same active locks.
   - File: `apps/api/src/modules/bookings/order.service.js`
   - Recommended fix: check for existing pending/paid order items for selected seats before creating a new order, or add a lifecycle-aware seat/order uniqueness strategy.

4. No automatic expired seat lock release worker.
   - Requirement: SYS-03.
   - Current: admin endpoint exists, but nothing runs automatically.
   - Recommended fix: add a small scheduler or document an external cron calling `/admin/seat-locks/release-expired`.

5. Admin seat status update is too permissive.
   - File: `apps/api/src/modules/seats/seat.service.js`
   - Risk: admin can manually set seats to `Sold` or `Released` without order/ticket/lock consistency.
   - Recommended fix: restrict direct patch to safe operational states or enforce transition rules.

## Medium / Low Priority Issues

1. Health response does not match Swagger.
   - Low effort, visible to automated health checks.

2. SSE seat-map stream is not implemented.
   - Swagger defines it, but polling endpoint exists.
   - Decide whether to implement before frontend or standardize frontend on polling.

3. Queue token is not enforced for seat locks.
   - No event/system field currently defines queue mode.
   - Requires product decision before strict enforcement.

4. Waiting queue positions can duplicate under concurrent joins.
   - Add unique `{ eventId, position }` index and transaction/atomic counter strategy if queue becomes important.

5. `Released` seat status is not used during lock release.
   - Requirements describe Released as an intermediate state before Available.
   - Current API moves seats directly to Available.

6. Audit logging model exists but no operations create audit logs.
   - Consider adding minimal audit writes for admin event/seat/order actions.

7. No real tests are configured.
   - `npm test` currently runs placeholder scripts.
   - Add focused backend tests before frontend relies on these contracts.

8. Swagger integer ID examples conflict with MongoDB ObjectId runtime.
   - This is expected by model mapping, but frontend and docs should treat IDs as strings from the API.

## Recommended Fixes

Before full frontend API integration:

1. Fix `GET /health` response shape or update Swagger later with approval.
2. Block or soften event deletion when dependent orders/tickets/seats exist.
3. Harden checkout: verify seat updates, prevent duplicate pending orders from the same locks, and add stronger seat/order consistency checks.
4. Decide how to handle MongoDB transactions in production vs local development.
5. Implement missing admin users/roles endpoints because auth/role management is foundational for admin UI.
6. Implement dashboard endpoints needed by `ticketrush_admin_analytics_dashboard`.
7. Implement audit log list or explicitly remove/defer audit UI integration.
8. Decide between implementing SSE or using polling only for frontend seat-map updates.
9. Decide queue mode/token rules before wiring a strict waiting-room frontend flow.
10. Add minimal tests for auth, role guards, event visibility, seat locking, checkout, ownership checks, and admin restrictions.

## Frontend Readiness

Frontend Phase 8 foundation can start with constraints:

- Safe to start: Vite app foundation, routing structure, layouts, auth state shape, Axios client, protected route guards, static design implementation.
- Not safe to fully wire yet: admin users/roles, dashboard, audit logs, event delete behavior, and strict checkout/seat-lock edge cases.

Recommendation: start Phase 8 only if frontend API clients are written defensively and the missing/partial backend endpoints are tracked as blockers before Phase 9/10 screen integration.

