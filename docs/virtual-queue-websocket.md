# Virtual Queue WebSocket

## Connection Auth

The web client connects to the API Socket.IO server and passes the JWT access token in socket auth:

```js
io(socketUrl, {
  auth: { accessToken }
});
```

The server verifies the token with the same access secret used by HTTP auth, resolves the user, and attaches only safe socket user data:

- `id`
- `username`
- `roles`

Unauthenticated sockets are rejected.

## Rooms

- `queue:event:<eventId>`: customer queue summary room for one event.
- `queue:user:<eventId>:<userId>`: private customer room. Queue tokens are only sent here.
- `queue:admin:<eventId>`: admin-only queue dashboard room.

## Client Events

### `queue:subscribe`

Payload:

```json
{ "eventId": "..." }
```

Customer-only. Joins the event and private user rooms, emits the current `queue:state`, and triggers Auto admission when the event is configured for Auto mode.

### `queue:unsubscribe`

Payload:

```json
{ "eventId": "..." }
```

Leaves the event and private user rooms.

### `admin:queue:subscribe`

Payload:

```json
{ "eventId": "..." }
```

Admin-only. Joins the admin room and emits an `admin:queue:update` snapshot.

### `admin:queue:unsubscribe`

Payload:

```json
{ "eventId": "..." }
```

Leaves the admin room.

## Server Events

### `queue:state`

Private customer state. If admitted, includes `queueToken` and `expiresAt`.

```json
{
  "eventId": "...",
  "queueRequired": true,
  "status": "Admitted",
  "position": 0,
  "accessGranted": true,
  "queueToken": "...",
  "expiresAt": "..."
}
```

### `queue:summary`

Broadcast to event/admin rooms.

```json
{
  "eventId": "...",
  "waiting": 10,
  "admitted": 3,
  "expired": 2,
  "cancelled": 1
}
```

### `queue:position-updated`

Private customer position update.

```json
{
  "eventId": "...",
  "position": 5,
  "status": "Waiting"
}
```

### `admin:queue:update`

Admin-only snapshot with summary, visible entries, and pagination.

### `queue:error`

Socket-level queue error.

## Manual Mode Flow

1. Customer joins through `POST /api/events/:eventId/queue/join`.
2. Waiting room subscribes with `queue:subscribe`.
3. Admin subscribes with `admin:queue:subscribe`.
4. Admin calls `POST /api/admin/events/:eventId/queue/admit-batch`.
5. Backend admits the next FIFO batch.
6. Admitted customers receive private `queue:state` with `queueToken`.
7. Waiting customers receive realtime position and summary updates.
8. Admin receives `admin:queue:update`.

## Auto Mode Flow

When `queueAdmissionMode` is `Auto`, the backend admits users whenever a trigger finds capacity:

- customer join
- customer `queue/me`
- customer socket subscribe
- queue access expiry cleanup
- queue config update
- customer leave

Available slots are calculated as:

```txt
queueMaxActiveUsers - activeAdmittedCount
```

If `queueMaxActiveUsers` is missing or invalid, `queueBatchSize` is used as the safe max-active fallback. Users are admitted in FIFO order by `sequenceNumber`/`position`.

## Token Privacy And Enforcement

Raw `queueToken` values are only sent to:

```txt
queue:user:<eventId>:<userId>
```

Tokens are never sent to event rooms, admin rooms, or public payloads. The queue token is still enforced by `POST /api/events/:eventId/seat-locks`; WebSocket messages are notifications only and cannot grant seat-lock access by themselves.

## Fallback Behavior

The waiting room keeps REST as the source of truth:

- `POST /queue/join` on load
- `GET /queue/me` via the manual Check button
- low-frequency fallback polling only while the socket is disconnected
- `DELETE /queue/me` for Leave queue

## Limitations

- No Redis Socket.IO adapter, so multi-instance realtime scaling is not supported yet.
- No infrastructure-level traffic detection or load-shedding.
- Queue token expiry does not release seat locks; seat lock expiry remains separate.
- Queue token enforcement remains HTTP seat-lock protection.
