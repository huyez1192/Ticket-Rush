# Virtual Queue API

## Concept

Virtual queue is an event-level gate for seat locking. When `virtualQueueEnabled` is `false`, customers use seat selection exactly as before. When it is `true`, customers must join the event waiting room, wait until an admin admits them, receive a short-lived queue token, and include that token when locking seats.

Queue access only permits a customer to attempt seat locking. It does not reserve seats and does not change existing seat-lock expiry, order, checkout, or ticket behavior.

## Event Queue Config

Events may include these optional fields:

- `virtualQueueEnabled`: boolean, default `false`
- `queueBatchSize`: number, default `50`
- `queueAccessTtlMinutes`: number, default `10`
- `queueMaxActiveUsers`: optional number
- `queueAdmissionMode`: `"Manual"` or `"Auto"`, default `"Manual"`

Admin event DTOs expose the full queue config. Public event DTOs expose enough information for the frontend to route queue-enabled Selling events to the waiting room.

## Customer Endpoints

### `POST /api/events/:eventId/queue/join`

Authenticated customers join or re-check the queue for an event.

If the event does not require a queue:

```json
{
  "queueRequired": false,
  "accessGranted": true,
  "queue": null
}
```

If the customer is waiting:

```json
{
  "queueRequired": true,
  "accessGranted": false,
  "queue": {
    "id": "...",
    "eventId": "...",
    "status": "Waiting",
    "position": 105,
    "createdAt": "..."
  }
}
```

If the customer is admitted:

```json
{
  "queueRequired": true,
  "accessGranted": true,
  "queueToken": "...",
  "expiresAt": "...",
  "queue": {
    "status": "Admitted",
    "position": 0
  }
}
```

### `GET /api/events/:eventId/queue/me`

Returns the current customer queue state, including `position`, `accessGranted`, `expiresAt`, and `queueToken` only when the user currently has valid admitted access.

Expired admitted entries are marked `Expired` during this check.

### `DELETE /api/events/:eventId/queue/me`

Cancels the current customer active queue entry for the event. This does not alter paid orders, sold tickets, or existing seat-lock expiry behavior.

## Admin Endpoints

### `GET /api/admin/events/:eventId/queue`

Lists queue entries for an event.

Query parameters:

- `status`
- `page`
- `limit`

Each entry includes a safe user summary without password fields.

### `POST /api/admin/events/:eventId/queue/admit-batch`

Body:

```json
{
  "limit": 50
}
```

Admits the next Waiting entries ordered by sequence/join order. If `limit` is omitted, the event `queueBatchSize` is used. Admitted entries receive token hashes and expiry timestamps. Raw queue tokens are not exposed to admins; customers retrieve their own token through `queue/me`.

### `PATCH /api/admin/events/:eventId/queue/config`

Body:

```json
{
  "virtualQueueEnabled": true,
  "queueBatchSize": 50,
  "queueAccessTtlMinutes": 10,
  "queueMaxActiveUsers": 200,
  "queueAdmissionMode": "Manual"
}
```

Strictly validates queue config and updates the event without changing event lifecycle status.

## Seat-Lock Enforcement

`POST /api/events/:eventId/seat-locks` accepts optional `queueToken`.

For non-queue events, behavior is unchanged.

For queue-enabled events, the API validates that:

- `queueToken` is present
- the token hash belongs to the current user
- the token belongs to the event
- the queue entry status is `Admitted`
- `expiresAt` is in the future

Missing or invalid access returns `403`. Expired access returns `409` and marks the queue entry `Expired`.

## Frontend Token Storage

The waiting room stores admitted queue access in `sessionStorage`:

- `ticketRush.queueToken.<eventId>`
- `ticketRush.queueTokenExpiresAt.<eventId>`

The seat selection page checks local expiry before loading and asks the backend to confirm current queue access. Invalid or expired access is cleared and redirects back to the waiting room.

## Manual Test Flow

1. Login admin.
2. Open a Selling event detail.
3. Enable virtual queue.
4. Set batch size to `1` or `2`.
5. Login customer 1 and join the waiting room.
6. Login customer 2 in another browser/incognito and join the waiting room.
7. Confirm the positions differ.
8. Try opening `/events/:eventId/seats` directly before admission.
9. Confirm the user is redirected to the waiting room or cannot lock seats.
10. Admin admits the next batch.
11. Confirm admitted customers redirect to seat selection and can lock seats.
12. Confirm non-admitted customers remain waiting and cannot lock seats.
13. Let token access expire and confirm seat locking requires rejoining.
14. Disable virtual queue and confirm normal seat selection works.

## Limitations

- No real database load detection.
- Admission is manual/admin batch based.
- No Redis, WebSocket, or SSE.
- No infrastructure-level traffic shaping.
- Queue tokens are stored client-side in session storage and validated server-side by hash.
