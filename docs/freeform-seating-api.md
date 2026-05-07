# Freeform Seating API Contract

Phase: 14.2 Backend Freeform Seating Model/API Upgrade  
Status: backend contract extension beyond `docs/swagger.json`, explicitly approved for this phase.

## Overview

The seating backend now supports persisted freeform layout metadata while preserving the existing row/seat matrix model. Seat locks, orders, checkout, tickets, and ticket verification continue to use `seatId` and seat `status`; layout coordinates are visual metadata only.

## Extended Models

### Seat

Existing fields remain:

- `id`
- `eventId`
- `sectionId`
- `rowNumber`
- `seatNumber`
- `status`
- `createdAt`
- `updatedAt`

New optional field:

```json
{
  "layout": {
    "x": 120,
    "y": 220,
    "rotation": 0,
    "width": 32,
    "height": 32,
    "label": "A1",
    "rowLabel": "A",
    "isPlaced": true
  }
}
```

Validation:

- `x`, `y`, and `rotation` must be finite numbers if provided.
- `width` and `height` must be positive finite numbers if provided.
- `label` max length is 80.
- `rowLabel` max length is 40.
- `isPlaced` is boolean if provided.

### SeatSection

Existing fields remain:

- `id`
- `eventId`
- `name`
- `description`
- `price`
- `createdAt`
- `updatedAt`

New optional visual fields:

```json
{
  "color": "#0058be",
  "displayOrder": 1,
  "defaultSeatWidth": 32,
  "defaultSeatHeight": 32
}
```

Validation:

- `color` is a trimmed string, max length 32.
- `displayOrder` must be a finite number if provided.
- `defaultSeatWidth` and `defaultSeatHeight` must be positive finite numbers if provided.

### EventSeatMapLayout

One layout config is stored per event.

```json
{
  "id": "layoutId",
  "eventId": "eventId",
  "canvasWidth": 1200,
  "canvasHeight": 800,
  "gridSize": 16,
  "stage": {
    "x": 360,
    "y": 40,
    "width": 480,
    "height": 80,
    "label": "Stage"
  },
  "defaultZoom": 1,
  "viewport": {
    "x": 0,
    "y": 0,
    "zoom": 1
  },
  "version": 1,
  "updatedBy": "adminUserId",
  "createdAt": "2026-05-07T00:00:00.000Z",
  "updatedAt": "2026-05-07T00:00:00.000Z"
}
```

## Extended Existing Endpoints

### GET `/api/events/:eventId/seat-map`

Access: public under the same visibility rules as the existing seat-map endpoint.

Response now includes `layout` and seat/section visual metadata:

```json
{
  "status": "success",
  "message": "Seat map fetched successfully.",
  "data": {
    "event": {},
    "layout": {
      "eventId": "eventId",
      "canvasWidth": 960,
      "canvasHeight": 640,
      "gridSize": 16,
      "stage": {
        "x": 280,
        "y": 48,
        "width": 400,
        "height": 72,
        "label": "Stage"
      },
      "defaultZoom": 1,
      "version": 1
    },
    "sections": [
      {
        "section": {
          "id": "sectionId",
          "name": "VIP",
          "price": 1500000,
          "color": "#0058be",
          "displayOrder": 1,
          "defaultSeatWidth": 32,
          "defaultSeatHeight": 32
        },
        "seats": [
          {
            "id": "seatId",
            "sectionId": "sectionId",
            "rowNumber": 1,
            "seatNumber": 1,
            "code": "VIP-R1-1",
            "status": "Available",
            "price": 1500000,
            "layout": {
              "x": 180,
              "y": 180,
              "rotation": 0,
              "width": 32,
              "height": 32,
              "label": "A1",
              "rowLabel": "A",
              "isPlaced": true
            }
          }
        ]
      }
    ]
  }
}
```

Backward compatibility:

- If no event layout exists, `layout` is `null`.
- If a seat has no layout coordinates, `layout` may be omitted or contain only available layout fields.
- Matrix clients can continue using `rowNumber` and `seatNumber`.

### GET `/api/events/:eventId/seats`

Existing behavior is preserved. Seat DTOs now include optional `layout`.

### GET `/api/events/:eventId/seats/:seatId`

Existing behavior is preserved. Seat DTO now includes optional `layout`.

### POST `/api/events/:eventId/sections/:sectionId/generate-seats`

Existing matrix generation is preserved.

Optional `autoLayout` can be supplied:

```json
{
  "rows": 8,
  "seatsPerRow": 12,
  "initialStatus": "Available",
  "autoLayout": {
    "enabled": true,
    "startX": 120,
    "startY": 200,
    "seatGapX": 40,
    "seatGapY": 40,
    "seatWidth": 32,
    "seatHeight": 32
  }
}
```

When `autoLayout.enabled` is true:

- Generated seats receive `layout.x` and `layout.y`.
- `layout.width` and `layout.height` use the supplied seat size or defaults.
- `layout.label` uses row label plus seat number.
- `layout.rowLabel` is generated from `rowNumber`.
- `layout.isPlaced` is set to `true`.

When `autoLayout` is missing or disabled, current matrix-only behavior is preserved.

### POST/PUT `/api/events/:eventId/sections`

Section create/update can now accept optional visual fields:

```json
{
  "name": "VIP",
  "price": 1500000,
  "description": "Front section",
  "color": "#0058be",
  "displayOrder": 1,
  "defaultSeatWidth": 32,
  "defaultSeatHeight": 32
}
```

## New Admin Endpoints

All endpoints below require Admin authentication.

### PUT `/api/events/:eventId/seat-map/layout`

Create or replace event layout config.

Request:

```json
{
  "canvasWidth": 1200,
  "canvasHeight": 800,
  "gridSize": 16,
  "stage": {
    "x": 360,
    "y": 40,
    "width": 480,
    "height": 80,
    "label": "Stage"
  },
  "defaultZoom": 1,
  "viewport": {
    "x": 0,
    "y": 0,
    "zoom": 1
  }
}
```

Response:

```json
{
  "status": "success",
  "message": "Seat map layout updated successfully.",
  "data": {
    "eventId": "eventId",
    "canvasWidth": 1200,
    "canvasHeight": 800,
    "gridSize": 16,
    "stage": {},
    "defaultZoom": 1,
    "viewport": {},
    "version": 2
  }
}
```

Validation:

- `canvasWidth` and `canvasHeight` are required positive finite numbers.
- `gridSize` is optional positive finite number.
- `stage.width` and `stage.height` are positive finite numbers.
- `stage.x`, `stage.y`, viewport `x`, and viewport `y` are finite numbers.
- `defaultZoom` and `viewport.zoom` are positive finite numbers.

### PATCH `/api/events/:eventId/seat-map/stage`

Update only stage config. This endpoint creates a default layout container if none exists.

Request:

```json
{
  "x": 280,
  "y": 48,
  "width": 400,
  "height": 72,
  "label": "Main Stage"
}
```

Response: updated layout DTO.

### PATCH `/api/events/:eventId/seats/:seatId/layout`

Update one seat's visual layout only.

Request:

```json
{
  "x": 180,
  "y": 220,
  "rotation": 0,
  "width": 32,
  "height": 32,
  "label": "A1",
  "rowLabel": "A",
  "isPlaced": true
}
```

Response: updated seat DTO.

Validation:

- Seat must belong to the event.
- Body is strict.
- `status`, `eventId`, `sectionId`, `rowNumber`, and `seatNumber` are rejected.
- This endpoint never mutates seat availability.

### PATCH `/api/events/:eventId/seats/layout/bulk`

Update many seat layouts atomically where MongoDB transactions are available.

Request:

```json
{
  "seats": [
    {
      "seatId": "seatId1",
      "x": 180,
      "y": 220,
      "width": 32,
      "height": 32,
      "label": "A1",
      "rowLabel": "A",
      "isPlaced": true
    }
  ]
}
```

Response:

```json
{
  "status": "success",
  "message": "Seat layouts updated successfully.",
  "data": {
    "updatedCount": 1,
    "seats": []
  }
}
```

Validation:

- `seats` array min 1, max 1000.
- Duplicate `seatId` values are rejected.
- Every seat must belong to the event.
- Body is strict.
- Status, event, section, row, and seat number fields are rejected.

## Backward Compatibility

- Existing matrix-generated seats remain valid.
- Existing customer seat selection can continue grouping by `rowNumber` and `seatNumber`.
- Existing seat locks continue to use `seatId`.
- Existing order creation continues to send `seatIds`.
- Checkout and ticket generation are unchanged.
- Events without layout config return `layout: null`.
- Seats without coordinates can be rendered through matrix fallback in Phase 14.4.

## Frontend Notes for Phase 14.3 and 14.4

- Admin designer should save canvas/stage config with `PUT /seat-map/layout`.
- Admin designer should save dragged seats with `PATCH /seats/layout/bulk`.
- Customer renderer should use coordinate mode only when seats have finite `layout.x` and `layout.y`.
- Customer renderer should preserve current matrix mode for legacy events.
- Seat status colors must remain status-based; section colors are for grouping/filtering only.
- Checkout flow should continue reading selected `seatId` values only.
