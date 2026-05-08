# Seat Lock Concurrency

Phase 14.5 hardens seat locking and checkout against concurrent customers selecting the same seat.

## Why This Race Can Happen

If the backend first reads a seat as `Available` and later updates it to `Locked`, two requests can both pass the read before either write commits. That can create duplicate active locks, duplicate order items, or duplicate tickets for the same physical seat.

## Database-Level Strategy

The seat document is the source of truth for lock eligibility. Locking a seat must be a single conditional database update:

```js
await Seat.updateOne(
  { _id: seatId, eventId, status: "Available" },
  { status: "Locked" },
  { session }
);
```

The request succeeds only when `modifiedCount === 1`. Any other result means the seat is not available and the API returns `409 Conflict` with:

```json
{
  "status": "failed",
  "message": "One or more seats are no longer available.",
  "errors": {
    "seatIds": ["..."]
  }
}
```

## Active Lock Unique Index

`SeatLock` has a partial unique index on `{ seatId: 1 }` where `status` is `Active`. This prevents two active lock records for the same seat even if two application processes race.

## Multi-Seat All-Or-Nothing

`POST /api/events/:eventId/seat-locks` locks seats inside `runWithOptionalTransaction`.

- With MongoDB transactions, any failure aborts all seat and lock writes.
- In local standalone MongoDB development, the fallback explicitly marks locks created by the failed request as `Released` and returns seats changed by that request back to `Available`.
- In non-development environments, transaction support is required by the existing transaction policy.

The endpoint no longer returns partial success for a multi-seat request. If one requested seat is unavailable, the whole request fails with `409`.

## Order Safeguards

`POST /api/orders` now requires every selected seat to:

- belong to the requested event,
- still have status `Locked`,
- have an unexpired active lock owned by the current customer,
- have no existing blocking pending/paid order item.

`order_items` has a partial unique index for active item states: one `Pending` or `Paid` order item per `seatId`. Cancelled/expired historical rows are outside that active uniqueness constraint.

## Checkout Safeguards

`POST /api/orders/:orderId/checkout` re-checks that:

- the order belongs to the current customer and is still `Pending`,
- every order seat has an active, unexpired lock owned by the current customer,
- each order seat belongs to the order event and is still `Locked`,
- each `Locked -> Sold` seat update modifies exactly one document,
- no ticket already exists for the selected seats.

Tickets are created only after all seat updates succeed. `tickets.seatId` is unique so one seat cannot receive two tickets.

## Expired Lock Release

Expired lock release only selects active locks whose `expiresAt` is in the past, marks those lock records `Expired`, and only updates seats currently in `Locked` status back to `Available`. It does not overwrite `Sold` seats.

## Smoke Test

Run:

```bash
npm run seed --workspace @ticket-rush/api
npm run smoke:seat-lock-race --workspace @ticket-rush/api
```

The smoke test is service-level, not HTTP-level. It connects to MongoDB, finds a `Selling` event with an `Available` seat, creates two demo customers, fires many parallel `lockSeatsForUser` calls for the same `seatId`, and verifies:

- exactly one request succeeds,
- every other request fails with an expected conflict,
- the final seat status is `Locked`,
- exactly one active `SeatLock` exists for the seat.

Expected result:

```txt
PASS: exactly one concurrent lock succeeded and one active lock remains.
```
