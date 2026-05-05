# Backend Integration Review - Phase 7.8

Review date: 2026-05-05  
Scope: `apps/api` backend after Phase 7.6 critical fixes and Phase 7.7 admin API coverage, compared against `docs/swagger.json`, `docs/requirements.md`, `docs/implementation-plan.md`, `docs/model-mapping.md`, and the current backend code.

## Executive Summary

The backend Swagger coverage improved materially since `docs/backend-integration-review.md`.

Current Swagger endpoint count remains 64:

- Implemented: 56
- Partially implemented: 7
- Not implemented: 0
- Intentionally skipped: 1

The previous review reported 46 implemented, 6 partial, 11 not implemented, and 1 intentionally skipped. Phase 7.7 closed all previously missing admin user, role, dashboard, and audit-log routes. Phase 7.6 also fixed the main critical data-integrity issues around event deletion, checkout seat updates, production transaction fallback, health response shape, event status lifecycle bypass through general update, and manual direct `Sold` seat status changes.

There are no remaining missing Swagger routes except the intentionally skipped SSE endpoint. Remaining concerns are mostly partial behavior or contract gaps: queue mode/token enforcement is still incomplete, direct admin seat status update can still set `Released`, audit logging only covers two admin-user operations, dashboard overview has a Swagger schema ambiguity and does not provide live-user/time-series data, and full API-level automated tests are still not configured.

## Runtime Route Prefix

All Express routes are mounted under `/api` by `apps/api/src/app.js`. Swagger paths below are documented without that runtime prefix. For example, Swagger `GET /events` runs as `GET /api/events`.

## Endpoint Coverage Table

Status meanings:

- Implemented: route exists and broadly matches method, path, validation, role protection, and DTO behavior.
- Partially implemented: route exists but has notable contract, response, validation, or business-rule limitations.
- Not implemented: Swagger endpoint has no backend route.
- Intentionally skipped: deliberately deferred behavior.

| # | Method | Swagger path | Status | Backend route file | Notes |
|---:|---|---|---|---|---|
| 1 | GET | `/health` | Implemented | `apps/api/src/routes/index.js` | Fixed since previous review. Returns top-level `status`, `service`, and `timestamp` without the generic success wrapper. |
| 2 | POST | `/auth/register` | Implemented | `apps/api/src/modules/auth/auth.routes.js` | Public customer registration. |
| 3 | POST | `/auth/login` | Implemented | `apps/api/src/modules/auth/auth.routes.js` | Shared Customer/Admin login endpoint. |
| 4 | GET | `/auth/me` | Implemented | `apps/api/src/modules/auth/auth.routes.js` | Requires bearer token. |
| 5 | POST | `/auth/logout` | Implemented | `apps/api/src/modules/auth/auth.routes.js` | Stateless JWT logout response. |
| 6 | GET | `/users/me` | Implemented | `apps/api/src/modules/users/user.routes.js` | Requires bearer token. |
| 7 | PUT | `/users/me` | Implemented | `apps/api/src/modules/users/user.routes.js` | Requires bearer token and validates profile fields. |
| 8 | PUT | `/users/me/password` | Implemented | `apps/api/src/modules/users/user.routes.js` | Requires bearer token and old-password verification. |
| 9 | GET | `/admin/users` | Implemented | `apps/api/src/modules/admin/adminUser.routes.js` | Added in Phase 7.7. Admin only; supports pagination, `keyword`, and `role`. |
| 10 | GET | `/admin/users/{id}` | Implemented | `apps/api/src/modules/admin/adminUser.routes.js` | Added in Phase 7.7. Admin only. |
| 11 | DELETE | `/admin/users/{id}` | Implemented | `apps/api/src/modules/admin/adminUser.routes.js` | Added in Phase 7.7. Blocks self-delete, last-admin deletion, and users with orders/tickets/blocking order items. |
| 12 | PUT | `/admin/users/{id}/roles` | Implemented | `apps/api/src/modules/admin/adminUser.routes.js` | Added in Phase 7.7. Validates role IDs and protects own/last Admin role. |
| 13 | GET | `/admin/roles` | Implemented | `apps/api/src/modules/admin/adminRole.routes.js` | Added in Phase 7.7. Admin only. |
| 14 | GET | `/admin/roles/{id}` | Implemented | `apps/api/src/modules/admin/adminRole.routes.js` | Added in Phase 7.7. Admin only. |
| 15 | GET | `/events` | Implemented | `apps/api/src/modules/events/event.routes.js` | Public list; supports `page`, `limit`, `keyword`, `status`, `from`, `to`. |
| 16 | POST | `/events` | Implemented | `apps/api/src/modules/events/event.routes.js` | Admin only. |
| 17 | GET | `/events/{eventId}` | Implemented | `apps/api/src/modules/events/event.routes.js` | Public detail only for public event statuses. |
| 18 | PUT | `/events/{eventId}` | Partially implemented | `apps/api/src/modules/events/event.routes.js` | Critical lifecycle bypass fixed by rejecting `status`; partial because Swagger still documents `status` in the update request. |
| 19 | DELETE | `/events/{eventId}` | Implemented | `apps/api/src/modules/events/event.routes.js` | Critical hard-delete risk fixed by blocking deletion when related orders, order items, tickets, or seat locks exist. |
| 20 | POST | `/events/{eventId}/publish` | Implemented | `apps/api/src/modules/events/event.routes.js` | Admin only; enforces lifecycle transition. |
| 21 | POST | `/events/{eventId}/open-selling` | Implemented | `apps/api/src/modules/events/event.routes.js` | Admin only; enforces lifecycle transition. |
| 22 | POST | `/events/{eventId}/close` | Implemented | `apps/api/src/modules/events/event.routes.js` | Admin only; enforces lifecycle transition. |
| 23 | POST | `/events/{eventId}/cancel` | Implemented | `apps/api/src/modules/events/event.routes.js` | Admin only; enforces lifecycle transition. |
| 24 | GET | `/events/{eventId}/images` | Implemented | `apps/api/src/modules/events/event.routes.js` | Public route. |
| 25 | POST | `/events/{eventId}/images` | Implemented | `apps/api/src/modules/events/event.routes.js` | Admin only. |
| 26 | DELETE | `/events/{eventId}/images/{id}` | Implemented | `apps/api/src/modules/events/event.routes.js` | Admin only. |
| 27 | GET | `/events/{eventId}/sections` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Public route. |
| 28 | POST | `/events/{eventId}/sections` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Admin only. |
| 29 | GET | `/events/{eventId}/sections/{sectionId}` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Public route. |
| 30 | PUT | `/events/{eventId}/sections/{sectionId}` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Admin only. |
| 31 | DELETE | `/events/{eventId}/sections/{sectionId}` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Admin only; blocks deletion when seats exist. |
| 32 | POST | `/events/{eventId}/sections/{sectionId}/generate-seats` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Admin only; blocks regeneration when seats already exist. |
| 33 | GET | `/events/{eventId}/seat-map` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Public route. |
| 34 | GET | `/events/{eventId}/seats` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Public route; supports `sectionId`, `status`, `page`, `limit`. |
| 35 | GET | `/events/{eventId}/seats/{seatId}` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Public route. |
| 36 | PATCH | `/events/{eventId}/seats/{seatId}` | Partially implemented | `apps/api/src/modules/seats/seat.routes.js` | Direct `Sold` status is now blocked. Still partial because direct `Released` remains allowed and Swagger accepts all `SeatStatus` values. |
| 37 | GET | `/events/{eventId}/seat-locks` | Implemented | `apps/api/src/modules/seats/seatLock.routes.js` | Customer only; returns own active locks. |
| 38 | POST | `/events/{eventId}/seat-locks` | Partially implemented | `apps/api/src/modules/seats/seatLock.routes.js` | Locking is atomic enough for normal flow, but `queueToken` is accepted by Swagger conditionally and still not enforced because queue mode is undefined. |
| 39 | DELETE | `/events/{eventId}/seat-locks/{seatId}` | Implemented | `apps/api/src/modules/seats/seatLock.routes.js` | Customer only; releases own active lock. |
| 40 | POST | `/admin/seat-locks/release-expired` | Implemented | `apps/api/src/modules/seats/seatLock.routes.js` | Admin only. No automatic worker is present. |
| 41 | GET | `/orders` | Implemented | `apps/api/src/modules/bookings/order.routes.js` | Customer only; own orders. |
| 42 | POST | `/orders` | Implemented | `apps/api/src/modules/bookings/order.routes.js` | Duplicate pending/paid order items for selected seats are now blocked. |
| 43 | GET | `/orders/{orderId}` | Implemented | `apps/api/src/modules/bookings/order.routes.js` | Customer only; own order. |
| 44 | DELETE | `/orders/{orderId}` | Implemented | `apps/api/src/modules/bookings/order.routes.js` | Customer only; pending order cancel. |
| 45 | POST | `/orders/{orderId}/checkout` | Implemented | `apps/api/src/modules/bookings/order.routes.js` | Critical seat-update verification fixed. Checks lock ownership/expiry, locked seat count, and update result before tickets are created. |
| 46 | GET | `/admin/orders` | Implemented | `apps/api/src/modules/bookings/order.routes.js` | Admin only. |
| 47 | GET | `/admin/orders/{orderId}` | Implemented | `apps/api/src/modules/bookings/order.routes.js` | Admin only. |
| 48 | GET | `/tickets` | Implemented | `apps/api/src/modules/tickets/ticket.routes.js` | Customer only; own tickets. |
| 49 | GET | `/tickets/{ticketId}` | Implemented | `apps/api/src/modules/tickets/ticket.routes.js` | Customer only; own ticket. |
| 50 | GET | `/tickets/{ticketId}/qr` | Implemented | `apps/api/src/modules/tickets/ticket.routes.js` | Customer only; returns JSON QR payload/token. |
| 51 | POST | `/admin/tickets/verify` | Implemented | `apps/api/src/modules/tickets/ticket.routes.js` | Admin only; verifies QR token existence. |
| 52 | POST | `/queue/join` | Partially implemented | `apps/api/src/modules/waiting-queue/waitingQueue.routes.js` | Basic join/status creation exists. Partial because queue activation rules, expiry, and concurrency-safe position allocation are incomplete. |
| 53 | GET | `/queue/{queueId}` | Implemented | `apps/api/src/modules/waiting-queue/waitingQueue.routes.js` | Customer only; own queue entry. |
| 54 | DELETE | `/queue/{queueId}` | Implemented | `apps/api/src/modules/waiting-queue/waitingQueue.routes.js` | Customer only; deletes own queue entry. |
| 55 | GET | `/queue/events/{eventId}/me` | Implemented | `apps/api/src/modules/waiting-queue/waitingQueue.routes.js` | Customer only; own queue entry for event. |
| 56 | GET | `/admin/events/{eventId}/queue` | Implemented | `apps/api/src/modules/waiting-queue/waitingQueue.routes.js` | Admin only; list by event/status with pagination. |
| 57 | POST | `/admin/events/{eventId}/queue/admit-batch` | Partially implemented | `apps/api/src/modules/waiting-queue/waitingQueue.routes.js` | Admits waiting entries and writes tokens. Partial because tokens are not consumed/enforced by seat locking. |
| 58 | GET | `/admin/dashboard/events/{eventId}/revenue` | Implemented | `apps/api/src/modules/admin/dashboard.routes.js` | Added in Phase 7.7. Admin only; supports optional `from`/`to`. |
| 59 | GET | `/admin/dashboard/events/{eventId}/seat-occupancy` | Implemented | `apps/api/src/modules/admin/dashboard.routes.js` | Added in Phase 7.7. Admin only. |
| 60 | GET | `/admin/dashboard/events/{eventId}/demographics` | Implemented | `apps/api/src/modules/admin/dashboard.routes.js` | Added in Phase 7.7. Admin only. |
| 61 | GET | `/admin/dashboard/overview` | Partially implemented | `apps/api/src/modules/admin/dashboard.routes.js` | Added in Phase 7.7. Backend returns useful overview stats, but Swagger currently describes `data` as `ApiSuccess`, and design live-user/time-series values are not represented. |
| 62 | GET | `/admin/audit-logs` | Partially implemented | `apps/api/src/modules/admin/auditLog.routes.js` | Added in Phase 7.7. Listing/filtering works, but audit writes are limited to admin user deletion and role assignment. |
| 63 | GET | `/events/{eventId}/seat-map/changes` | Implemented | `apps/api/src/modules/seats/seat.routes.js` | Public polling endpoint for seat-map changes. |
| 64 | GET | `/events/{eventId}/seat-map/stream` | Intentionally skipped | - | SSE stream remains deferred. Polling endpoint exists and can support Phase 8/9 frontend updates. |

## What Improved Since Previous Review

- Swagger missing endpoint count dropped from 11 to 0.
- Implemented endpoint count increased from 46 to 56.
- All admin user and role routes are now present.
- All admin dashboard routes are now present.
- Admin audit-log listing is now present.
- Health response now matches the Swagger top-level shape.
- Event deletion no longer hard-deletes events with related order/ticket/lock history.
- Checkout now verifies selected seats are still locked and verifies `updateMany` changed every seat before marking locks/order paid and creating tickets.
- MongoDB transaction fallback now only downgrades in development; non-development environments fail fast when transactions are unsupported.
- General event update no longer allows status lifecycle bypass.
- Admin seat patch no longer allows direct `Sold` status.

## Fixed Issues From Previous Review

### Event Hard Delete Corrupting Historical Data

Status: Fixed.

`deleteAdminEvent` now calls `assertEventCanBeDeleted` before deleting. It blocks deletion when related orders, order items, tickets, or seat locks exist. This prevents historical orders/tickets from being orphaned by an event hard delete. The implementation still uses hard delete when no dependencies exist, which is consistent enough with Swagger `DELETE /events/{eventId}` while respecting the requirements warning for ticketed events.

### Checkout Paid/Ticket Creation Without Verifying Seat Updates

Status: Fixed.

`checkoutMyOrder` now verifies:

- order belongs to the customer and is `Pending`
- each selected seat is unique
- active locks exist for all order seats
- locks are not expired
- all seats are still `Locked`
- `updateMany` matched and modified exactly the expected number of seats

Only after those checks does it mark locks `Paid`, mark order `Paid`, and create tickets.

### Production Transaction Fallback Policy

Status: Fixed.

`runWithOptionalTransaction` still supports standalone MongoDB in `development`, but it now throws an `AppError` when transactions are unsupported outside development. This avoids silent production downgrade away from transaction semantics.

### Health Response Shape Mismatch

Status: Fixed.

`GET /api/health` now returns:

```json
{
  "status": "ok",
  "service": "ticket-rush-api",
  "timestamp": "..."
}
```

This matches the Swagger `HealthResponse` shape.

### `PUT /events/{eventId}` Status Lifecycle Bypass

Status: Fixed, with a Swagger contract note.

The update validator no longer accepts `status`, and the service rejects status changes through the general update flow. Status changes must use dedicated lifecycle endpoints. This fixes the business-rule issue, but Swagger still documents `status` as an updatable field, so the endpoint remains marked partial for contract alignment.

### `PATCH /events/{eventId}/seats/{seatId}` Direct `Sold` Status

Status: Partially fixed.

The service now rejects manual `Sold` updates and requires checkout/order flow to sell seats. However, the endpoint still accepts direct `Released` updates, so the endpoint remains partial because a manual release can still bypass lock/order semantics.

## Missing Admin API Verification

All previously missing admin endpoints are now implemented:

| Method | Path | Status | Route file |
|---|---|---|---|
| GET | `/admin/users` | Implemented | `apps/api/src/modules/admin/adminUser.routes.js` |
| GET | `/admin/users/{id}` | Implemented | `apps/api/src/modules/admin/adminUser.routes.js` |
| DELETE | `/admin/users/{id}` | Implemented | `apps/api/src/modules/admin/adminUser.routes.js` |
| PUT | `/admin/users/{id}/roles` | Implemented | `apps/api/src/modules/admin/adminUser.routes.js` |
| GET | `/admin/roles` | Implemented | `apps/api/src/modules/admin/adminRole.routes.js` |
| GET | `/admin/roles/{id}` | Implemented | `apps/api/src/modules/admin/adminRole.routes.js` |
| GET | `/admin/dashboard/overview` | Partially implemented | `apps/api/src/modules/admin/dashboard.routes.js` |
| GET | `/admin/dashboard/events/{eventId}/revenue` | Implemented | `apps/api/src/modules/admin/dashboard.routes.js` |
| GET | `/admin/dashboard/events/{eventId}/seat-occupancy` | Implemented | `apps/api/src/modules/admin/dashboard.routes.js` |
| GET | `/admin/dashboard/events/{eventId}/demographics` | Implemented | `apps/api/src/modules/admin/dashboard.routes.js` |
| GET | `/admin/audit-logs` | Partially implemented | `apps/api/src/modules/admin/auditLog.routes.js` |

## Remaining Critical Issues

No unresolved critical backend issue from the previous review remains in the same severity form.

The highest residual risk is queue/seat-lock integration: admitted queue tokens are generated but not enforced by seat locking because no queue-mode setting exists. This is not a core checkout data-integrity blocker unless the frontend depends on strict waiting-room gating.

## Remaining High Priority Issues

1. `GET /events/{eventId}/seat-map/stream` is not implemented.
   - Swagger defines the SSE route.
   - Polling through `GET /events/{eventId}/seat-map/changes` exists.
   - Frontend should use polling unless SSE is explicitly required.

2. Queue behavior remains partial.
   - Queue join/list/admit routes exist.
   - There is no event/system flag for queue mode.
   - `queueToken` is not enforced by `POST /events/{eventId}/seat-locks`.
   - Queue positions are assigned by reading the latest position and adding one, without a transaction-safe counter or unique `{ eventId, position }` index.
   - Queue entries do not expire automatically.

3. Audit logging is limited.
   - Audit listing exists.
   - Writes currently cover admin user deletion and role assignment only.
   - Event create/update/delete/status changes, seat section changes, seat generation, seat status changes, admin order actions, queue admit, and ticket verification are not audited.

4. Dashboard overview is partial for product/design expectations.
   - Event revenue, occupancy, and demographics endpoints are implemented.
   - Overview returns useful aggregate counts, but Swagger defines the `data` schema as `ApiSuccess`, which appears inconsistent.
   - The admin analytics design includes live users and chart-style realtime trends; no sessions/live-users model or time-series revenue buckets exist.

5. `PATCH /events/{eventId}/seats/{seatId}` still allows direct `Released`.
   - Direct `Sold` is blocked.
   - Direct `Released` can still bypass lock lifecycle semantics.
   - Treat this admin action carefully in the frontend.

## Medium / Low Issues

1. Swagger/request mismatch on `PUT /events/{eventId}`.
   - Backend rejects `status`.
   - Swagger still documents update status.
   - This is a deliberate backend safety choice, but docs and generated frontend clients must account for it.

2. No automatic expired-lock worker is present.
   - Admin endpoint `POST /admin/seat-locks/release-expired` exists.
   - Requirements call for automatic background release.
   - A frontend can still operate if it calls current APIs defensively, but stale locks may remain until the endpoint is invoked.

3. Seat release state is simplified.
   - Lock release and expired-lock release move seats directly back to `Available`.
   - Requirements describe `Released` as an intermediate lifecycle state.

4. Response shape should be smoke-tested against Swagger examples before frontend lock-in.
   - Mappers generally convert `_id` to `id` and hide password hashes.
   - MongoDB ObjectId strings intentionally replace Swagger integer examples.
   - Dashboard overview Swagger schema is ambiguous.

5. Auth endpoints are not rate-limited.
   - AGENTS.md says rate limiting is practical if possible.
   - No rate limiter is configured yet.

6. Real tests are still not configured.
   - `npm test` and `npm run lint` for API currently run placeholder scripts.
   - The app import check passed after Phase 7.7, but there is no behavioral test suite for route contracts or booking race cases.

## Authorization Review

Public endpoints remain public:

- health
- register/login
- public event list/detail/images
- public sections/seats/seat-map/seat-map changes

Customer-private endpoints require `authenticate` and `requireRole(ROLES.CUSTOMER)`:

- seat locks
- orders
- tickets
- customer queue endpoints

Admin endpoints require `authenticate` and `requireRole(ROLES.ADMIN)`:

- admin users/roles
- event mutations
- event image mutations
- seat section mutations
- seat generation and seat status patch
- expired lock release
- admin orders
- ticket verification
- admin queue
- dashboard
- audit logs

Ownership checks remain present for customer orders, tickets, seat locks, and queue entries.

## Frontend Readiness Recommendation

### Can Phase 8 Frontend Foundation start?

Yes.

Phase 8 can start now for Vite setup, routing, layouts, auth state, Axios client, route guards, shared API client modules, design tokens, and static shell work. The backend no longer has missing admin routes that would block basic API-client scaffolding.

### Can full customer frontend integration start?

Partially.

The main customer flow can be integrated with caution:

- register/login/me
- event listing/detail/images
- sections/seats/seat-map
- polling seat-map changes
- seat locking/release
- create pending order
- checkout
- my orders
- my tickets
- ticket detail/QR

Risky or partially blocked customer screens:

- Waiting room: queue APIs exist, but token enforcement and queue activation rules are incomplete.
- Seat selection during high-demand queue mode: do not rely on `queueToken` security yet.
- Realtime seat map: use polling, not SSE.
- Checkout countdown/expired-lock handling: no automatic background worker is present.

### Can full admin frontend integration start?

Partially.

Most admin API integration can start:

- admin login
- dashboard revenue/occupancy/demographics/overview
- event management
- event images
- seating sections and seat generation
- sold-ticket/order management
- admin users and roles
- queue listing/admit batch
- audit-log list

Risky or partially blocked admin screens:

- Analytics dashboard: overview/live users/time-series chart data may need frontend placeholders or additional API design.
- Event seating config: avoid exposing direct `Sold`; be cautious with direct `Released`.
- Audit logs: list exists, but many admin actions will not appear because writes are sparse.
- Queue management: admitted tokens are not enforced by seat locking.
- Real-time dashboard/seat updates: use polling; SSE stream is not available.

## Recommended Next Phase

Proceed to Phase 8 Frontend Foundation with defensive API clients and clear feature flags/notes for partial areas.

Before full Phase 9/10 frontend integration is treated as complete, address or explicitly accept:

1. Implement SSE or standardize frontend on polling only.
2. Decide queue-mode activation and enforce admitted queue tokens in seat locking when queue mode is active.
3. Add automatic expired-lock release or document/run an external scheduler.
4. Expand audit writes for admin event, seat, queue, order, and ticket operations.
5. Align `PUT /events/{eventId}` Swagger contract with the safer dedicated status endpoints.
6. Decide whether direct `Released` seat status should be blocked or constrained.
7. Add real backend tests for auth, role guards, event lifecycle, seat locking, duplicate order prevention, checkout, ownership, and admin APIs.

