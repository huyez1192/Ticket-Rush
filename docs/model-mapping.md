# Ticket Rush Model Mapping

This document maps the SQL reference schema in `docs/database/migrations.sql` to the MongoDB/Mongoose model layer. The SQL file remains a design reference only; the application uses MongoDB.

| SQL table | MongoDB strategy | Mongoose model/file | Embedded or separate collection | Reason |
|---|---|---|---|---|
| `users` | Convert to `users` collection with MongoDB `_id`; SQL `password` is stored as `passwordHash`; role membership is stored as role ObjectId refs. | `User` in `apps/api/src/modules/users/user.model.js` | Separate collection | Users are top-level authenticated actors, are queried directly by auth/profile/admin APIs, and require unique `username` and `email` indexes. |
| `roles` | Convert to `roles` collection seeded with `Customer` and `Admin`. | `Role` in `apps/api/src/modules/users/role.model.js` | Separate collection | Swagger exposes role IDs through role APIs and role assignment, so keeping roles as documents preserves the API shape. |
| `user_roles` | Represent as `roles: [ObjectId<Role>]` on each user. | Field on `User` in `apps/api/src/modules/users/user.model.js` | Embedded references on `users` | The join table exists for SQL normalization. MongoDB can store role memberships directly on the user while still allowing multiple roles because Swagger uses `User.roles` and `AssignRolesRequest.roleIds`. |
| `events` | Convert to `events` collection with ObjectId `createdBy` reference to `users`. | `Event` in `apps/api/src/modules/events/event.model.js` | Separate collection | Events are top-level resources with public and admin APIs, status/date indexes, and independent lifecycle transitions. |
| `event_images` | Convert to `event_images` collection with ObjectId `eventId` reference. | `EventImage` in `apps/api/src/modules/events/eventImage.model.js` | Separate collection | Swagger has independent event image list/add/delete APIs, and migration gives images their own IDs and timestamps. |
| `seat_sections` | Convert to `seat_sections` collection with ObjectId `eventId` reference. | `SeatSection` in `apps/api/src/modules/seats/seatSection.model.js` | Separate collection | Sections are independently managed by admin APIs and own pricing; unique `{ eventId, name }` is preserved. |
| `seats` | Convert to `seats` collection with ObjectId `sectionId` reference and denormalized `eventId` for event-level lookups. | `Seat` in `apps/api/src/modules/seats/seat.model.js` | Separate collection | Seats need direct status updates, locking, seat-map queries, and unique seat identity within a section using `{ sectionId, rowNumber, seatNumber }`. |
| `orders` | Convert to `orders` collection with ObjectId `userId` and `eventId` references. | `Order` in `apps/api/src/modules/bookings/order.model.js` | Separate collection | Swagger names this API group and schema `Orders`; the file is named `order.model.js` to match the API contract while remaining inside the `bookings` module folder. |
| `order_items` | Convert to `order_items` collection with ObjectId `orderId` and `seatId` references. | `OrderItem` in `apps/api/src/modules/bookings/order.model.js` | Separate collection | Tickets reference `order_item_id` uniquely, so order items need their own IDs instead of being embedded inside orders. |
| `seat_locks` | Convert to `seat_locks` collection with ObjectId `seatId` and `userId` references; active-lock partial unique index is preserved. | `SeatLock` in `apps/api/src/modules/seats/seatLock.model.js` | Separate collection | Temporary locks have lifecycle, expiry, ownership checks, and conflict-prevention indexes. TTL deletion is not used because requirements need status transitions such as `Expired` and `Released`. |
| `tickets` | Convert to `tickets` collection with unique `orderItemId` and `qrCode`; includes derived refs to order/user/event/seat for efficient ownership and admin queries. | `Ticket` in `apps/api/src/modules/tickets/ticket.model.js` | Separate collection | Tickets are top-level customer/admin resources and QR verification targets. QR generation is not implemented; the schema only stores the required field. |
| `waiting_queue` | Convert to `waiting_queue` collection with ObjectId `userId` and `eventId` references. | `WaitingQueueEntry` in `apps/api/src/modules/waiting-queue/waitingQueue.model.js` | Separate collection | Queue entries have positions, tokens, statuses, and event/user uniqueness, and Swagger exposes queue status/admin queue APIs. |
| `audit_logs` | Convert to `audit_logs` collection with optional ObjectId `userId`, action/entity fields, and flexible metadata. | `AuditLog` in `apps/api/src/modules/admin/auditLog.model.js` | Separate collection | Migration uses `metadata jsonb`; Mongoose `Mixed` preserves flexible audit detail without inventing new fields. |

## Role Decision

The app has two role values, `Customer` and `Admin`, but Swagger models users with `roles` and role assignment with `roleIds`. For that reason the model keeps a `roles` collection plus a `roles` array on `users`. A single `role` string would be simpler, but it would not match Swagger's role assignment contract.

## Order Naming Decision

The implementation plan uses a `bookings` module folder, but Swagger and the migration call the persisted resource `orders`. The model file is therefore `apps/api/src/modules/bookings/order.model.js`, exporting `Order` and `OrderItem`. This keeps the broader module aligned with the project folder plan while making the model names match the API and database contract.

## Separate vs Embedded Decisions

`event_images`, `seat_sections`, `seat_locks`, `order_items`, `tickets`, `waiting_queue`, and `audit_logs` are separate collections because the migration gives them independent primary keys and Swagger exposes or relies on them as independently addressable resources. `user_roles` is the only embedded/reference-array mapping because it is a pure SQL join table with no additional fields.
