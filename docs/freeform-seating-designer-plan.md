# Freeform Seating Designer Plan

Phase: 14.1 Freeform Seating Designer Planning  
Scope: documentation only. No backend code, frontend code, dependencies, protected docs, or existing source files are changed in this phase.

## 1. Executive Summary

Ticket Rush currently supports section-based seat creation through rectangular row/seat matrices. That is enough for a simple venue, but it cannot represent irregular concert, stadium, theater, or festival layouts where seats curve, split around aisles, or sit in multiple non-rectangular blocks around one stage.

Freeform seating requires backend and frontend changes because the layout must be saved as durable event data and returned by the same seat-map APIs that customer seat selection uses. A frontend-only positioning layer would be fragile: it would disappear on refresh, differ between admin and customer screens, fail in seed/demo data, and create mismatches between what admins design and what customers buy. The backend must persist seat coordinates and venue map configuration, while the frontend must render and edit those coordinates.

The upgrade affects:

- Admin seating: needs a visual designer, stage config, saved seat positions, auto-arrange tools, and layout validation.
- Customer seat selection: must render saved coordinates when present and keep matrix fallback when coordinates are missing.
- Checkout, seat locks, orders, tickets, and ticket verification: should continue using `seatId` and existing status fields. They do not need to know `x`/`y`.
- Seed data: can remain matrix-only at first, then add demo coordinates non-destructively for one or more events.

Important finding: the current backend does not already have seat layout fields such as `x`, `y`, `width`, `height`, `rotation`, `label`, or venue canvas/stage config. The current implementation is row/number only.

## 2. Current Seating Architecture

### Backend Models

Relevant files:

- `apps/api/src/modules/seats/seat.model.js`
- `apps/api/src/modules/seats/seatSection.model.js`
- `apps/api/src/modules/seats/seatLock.model.js`
- `apps/api/src/modules/bookings/order.model.js`
- `apps/api/src/modules/tickets/ticket.model.js`
- `docs/database/migrations.sql`
- `docs/model-mapping.md`

Current `Seat` fields:

- `eventId`: `ObjectId<Event>`, required, denormalized for event-level queries.
- `sectionId`: `ObjectId<SeatSection>`, required.
- `rowNumber`: required positive number.
- `seatNumber`: required positive number.
- `status`: enum `Available`, `Locked`, `Sold`, `Released`.
- timestamps.

Current indexes:

- `{ sectionId: 1 }`
- `{ status: 1 }`
- `{ sectionId: 1, status: 1 }`
- `{ eventId: 1, status: 1 }`
- unique `{ sectionId: 1, rowNumber: 1, seatNumber: 1 }`

Current `SeatSection` fields:

- `eventId`
- `name`
- `description`
- `price`
- timestamps
- unique `{ eventId, name }`

Current `SeatLock` fields:

- `seatId`
- `userId`
- `lockedAt`
- `expiresAt`
- `status`
- partial unique active lock index on `{ seatId: 1 }`

Checkout/order/ticket relationships:

- `OrderItem` references `seatId`.
- `Ticket` stores `orderItemId`, `orderId`, `userId`, `eventId`, `seatId`, and `qrCode`.
- This means layout coordinates can be visual-only and should not alter existing transaction flow.

### Backend APIs

Relevant files:

- `apps/api/src/modules/seats/seat.routes.js`
- `apps/api/src/modules/seats/seat.controller.js`
- `apps/api/src/modules/seats/seat.service.js`
- `apps/api/src/modules/seats/seat.repository.js`
- `apps/api/src/modules/seats/seat.validation.js`
- `apps/api/src/modules/seats/seat.mapper.js`
- `apps/api/src/modules/seats/seatLock.routes.js`
- `apps/api/src/modules/seats/seatLock.service.js`

Current section/seat APIs:

- `GET /events/:eventId/sections`
- `POST /events/:eventId/sections` Admin
- `GET /events/:eventId/sections/:sectionId`
- `PUT /events/:eventId/sections/:sectionId` Admin
- `DELETE /events/:eventId/sections/:sectionId` Admin; blocked when seats exist.
- `POST /events/:eventId/sections/:sectionId/generate-seats` Admin; creates a rectangular matrix.
- `GET /events/:eventId/seat-map`
- `GET /events/:eventId/seat-map/changes`
- `GET /events/:eventId/seats`
- `GET /events/:eventId/seats/:seatId`
- `PATCH /events/:eventId/seats/:seatId` Admin; status only.

Current seat-lock APIs:

- `POST /events/:eventId/seat-locks` Customer; locks by `seatIds`.
- `GET /events/:eventId/seat-locks` Customer; own active locks.
- `DELETE /events/:eventId/seat-locks/:seatId` Customer.
- `POST /admin/seat-locks/release-expired` Admin or worker.

Current `GET /events/:eventId/seat-map` response shape:

```json
{
  "event": {},
  "sections": [
    {
      "section": {},
      "seats": []
    }
  ]
}
```

Each seat DTO currently includes `id`, `sectionId`, `rowNumber`, `seatNumber`, derived `code`, `status`, `price`, `createdAt`, and `updatedAt`. It does not include layout data.

### Admin Seating Frontend

Relevant files:

- `apps/web/src/pages/admin/AdminEventSeatingPage.jsx`
- `apps/web/src/components/admin/AdminSectionList.jsx`
- `apps/web/src/components/admin/AdminSectionForm.jsx`
- `apps/web/src/components/admin/AdminSeatMatrixGenerator.jsx`
- `apps/web/src/components/admin/AdminSeatMapPreview.jsx`
- `apps/web/src/components/admin/AdminSeatCell.jsx`
- `apps/web/src/components/admin/AdminSeatStatusControls.jsx`
- `apps/web/src/utils/adminSeatMappers.js`

Current admin behavior:

- Loads event, sections, and seat map.
- Creates/updates/deletes sections.
- Generates seats for one selected section using `rows` and `seatsPerRow`.
- Displays all sections together in `AdminSeatMapPreview`.
- Groups seats by row with `groupSeatsByRow`.
- Allows admin to select one seat and patch safe status values, with manual `Sold` blocked by the backend.

Limitations:

- The preview is still matrix-based inside each section.
- There is a visual stage block, but it is hardcoded UI, not persisted event layout config.
- No drag, canvas, coordinate, or saved viewport concept exists.
- Section identity is rendered as separate row groups, not as one shared coordinate venue map.

### Customer Seat Selection Frontend

Relevant files:

- `apps/web/src/pages/customer/SeatSelectionPage.jsx`
- `apps/web/src/components/seat/SeatMap.jsx`
- `apps/web/src/components/seat/Seat.jsx`
- `apps/web/src/components/seat/SeatLegend.jsx`
- `apps/web/src/components/seat/SeatSummary.jsx`
- `apps/web/src/components/seat/SectionSelector.jsx`
- `apps/web/src/utils/seatMappers.js`

Current customer behavior:

- Loads event, sections, seat map, and own locks.
- Polls seat-map data every 12 seconds.
- Shows one active section at a time.
- Groups seats by `rowNumber`, sorted by `seatNumber`.
- Selects available seats locally, then locks by `seatId`.
- Creates orders from locked `seatId` values.

Limitations:

- Customer sees only one section at a time, not a shared venue map.
- Seat map is rendered as a CSS grid based on row/number.
- Missing `x`/`y` data cannot represent aisles, angled blocks, curved rows, or irregular layouts.

## 3. Proposed Data Model Changes

### Seat Layout Fields

Add optional layout fields to `Seat`. Keep all current fields for backward compatibility.

Recommended `Seat` additions:

```js
layout: {
  x: Number,
  y: Number,
  rotation: Number,
  width: Number,
  height: Number,
  label: String,
  rowLabel: String,
  isPlaced: Boolean
}
```

Alternative flat fields are also viable:

```js
x, y, rotation, width, height, label, rowLabel, isPlaced
```

Recommendation: use a nested `layout` object because these fields are visual metadata. It keeps business fields (`eventId`, `sectionId`, `rowNumber`, `seatNumber`, `status`) distinct from visual fields and allows returning `seat.layout` without confusing seat status or ownership logic.

Field rules:

- `layout.x` and `layout.y`: optional finite numbers in canvas coordinates.
- `layout.rotation`: optional finite number, default `0`. Defer actual rotation UI for MVP unless needed.
- `layout.width` and `layout.height`: optional positive numbers, default to section or map defaults.
- `layout.label`: optional display label. If absent, use existing derived code.
- `layout.rowLabel`: optional display row label, useful when row numbers still exist but visual rows are irregular.
- `layout.isPlaced`: optional boolean. If absent, infer placed as both `x` and `y` being finite numbers.

Keep existing required fields:

- `rowNumber`
- `seatNumber`
- `sectionId`
- `eventId`
- `status`

This avoids breaking existing generated seats, existing unique row/seat constraints, current checkout, current tickets, and seed data.

### Section Layout Fields

Add optional fields to `SeatSection`:

```js
color: String,
displayOrder: Number,
defaultSeatWidth: Number,
defaultSeatHeight: Number
```

Notes:

- `color` should identify section grouping in admin tools and legends only. It must not override status colors on actual seats because status color communicates availability.
- `displayOrder` should replace name-only sorting when admins want stable section ordering.
- `defaultSeatWidth` and `defaultSeatHeight` let different sections have different seat sizes without copying values onto every seat.

### Event Seat Map Layout Config

Two options exist.

#### Option A: Embed `seatMapConfig` inside `Event`

Example:

```js
seatMapConfig: {
  canvasWidth: Number,
  canvasHeight: Number,
  gridSize: Number,
  stage: {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    label: String
  },
  defaultZoom: Number,
  viewport: {
    x: Number,
    y: Number,
    zoom: Number
  },
  version: Number,
  updatedBy: ObjectId,
  updatedAt: Date
}
```

Pros:

- Simple to fetch with event.
- No new collection.
- Good fit for one layout per event.

Cons:

- Event model grows with layout-specific concerns.
- Layout updates write to the event document even if event details do not change.
- Harder to version/audit layouts later.

#### Option B: Create `EventSeatMapLayout` model

Example collection: `event_seat_map_layouts`

```js
{
  eventId: ObjectId,
  canvasWidth: Number,
  canvasHeight: Number,
  gridSize: Number,
  stage: {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    label: String
  },
  defaultZoom: Number,
  viewport: {
    x: Number,
    y: Number,
    zoom: Number
  },
  version: Number,
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

- unique `{ eventId: 1 }`

Pros:

- Clear ownership boundary: event data vs seating layout data.
- Easier to add layout versioning, audit logging, draft/published layout states, or revision history later.
- Avoids rewriting event documents for layout-only edits.
- Keeps `Event` model aligned with existing migration-derived fields.

Cons:

- Requires one new collection and model.
- Requires one more repository in seat-map read/update flow.

Recommendation: use Option B, `EventSeatMapLayout`. It is more maintainable and keeps layout configuration separate from core event lifecycle data. The app already uses separate collections where Swagger/migration resources have independent lifecycles, and seat layout behaves more like a seating subresource than event core metadata.

## 4. Proposed API Changes

Swagger does not currently define freeform layout endpoints. Phase 14.2 should add backend routes first, then Swagger should be updated in a documentation-alignment phase if approved. All proposed admin write endpoints require `authenticate` and `requireRole(Admin)`.

### Required: Extend `GET /events/{eventId}/seat-map`

- Access: Public/customer/admin read, subject to current event visibility rules.
- Request body: none.
- Response shape:

```json
{
  "event": {},
  "layout": {
    "eventId": "string",
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
    "version": 1,
    "updatedAt": "date-time"
  },
  "sections": [
    {
      "section": {
        "id": "string",
        "name": "VIP",
        "price": 1500000,
        "color": "#0058be",
        "displayOrder": 1,
        "defaultSeatWidth": 32,
        "defaultSeatHeight": 32
      },
      "seats": [
        {
          "id": "string",
          "sectionId": "string",
          "rowNumber": 1,
          "seatNumber": 1,
          "code": "VIP-R1-1",
          "status": "Available",
          "price": 1500000,
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
      ]
    }
  ]
}
```

Validation rules:

- No request validation change.
- Response should include `layout: null` or default layout if no layout config exists.
- Seats without coordinates must still be returned.

Affected backend files:

- `apps/api/src/modules/seats/seat.mapper.js`
- `apps/api/src/modules/seats/seat.service.js`
- `apps/api/src/modules/seats/seat.repository.js`
- new `eventSeatMapLayout.model.js` and repository if Option B is accepted.

### Required: `PUT /events/{eventId}/seat-map/layout`

- Access: Admin only.
- Purpose: create or replace event-level layout config.
- Request body:

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

- Response shape: same `layout` object returned by `GET /seat-map`.
- Validation rules:
  - `canvasWidth`, `canvasHeight`: positive finite numbers, recommended min 320, max 10000.
  - `gridSize`: optional positive number, recommended 4-100.
  - stage dimensions: positive finite numbers.
  - stage coordinates: finite numbers within a reasonable canvas margin.
  - `label`: trimmed string, max 80.
- Affected files:
  - `seat.routes.js`
  - `seat.controller.js`
  - `seat.service.js`
  - `seat.validation.js`
  - new `eventSeatMapLayout.model.js`
  - new layout repository
- Required: yes.

### Optional: `PATCH /events/{eventId}/seat-map/stage`

- Access: Admin only.
- Purpose: update only stage placement/label.
- Request body:

```json
{
  "x": 360,
  "y": 40,
  "width": 480,
  "height": 80,
  "label": "Main Stage"
}
```

- Response shape: updated `layout`.
- Validation rules: same as stage fields above.
- Affected files: same as layout update endpoint.
- Required: optional. It improves UX but can be folded into `PUT /seat-map/layout` for MVP.

### Required: `PATCH /events/{eventId}/seats/{seatId}/layout`

- Access: Admin only.
- Purpose: update one seat's visual placement.
- Request body:

```json
{
  "x": 120,
  "y": 220,
  "rotation": 0,
  "width": 32,
  "height": 32,
  "label": "A1",
  "rowLabel": "A",
  "isPlaced": true
}
```

- Response shape: updated seat DTO with layout fields.
- Validation rules:
  - `seatId` must belong to `eventId`.
  - Coordinates must be finite.
  - Width/height must be positive.
  - Label fields are optional trimmed strings with sensible max length.
  - Must not accept `status`; layout update cannot mutate availability.
- Affected files:
  - `seat.routes.js`
  - `seat.controller.js`
  - `seat.service.js`
  - `seat.repository.js`
  - `seat.validation.js`
  - `seat.mapper.js`
- Required: yes.

### Required: `PATCH /events/{eventId}/seats/layout/bulk`

- Access: Admin only.
- Purpose: save many seat positions after drag/auto-arrange.
- Request body:

```json
{
  "seats": [
    {
      "seatId": "string",
      "x": 120,
      "y": 220,
      "rotation": 0,
      "width": 32,
      "height": 32,
      "label": "A1",
      "rowLabel": "A",
      "isPlaced": true
    }
  ]
}
```

- Response shape:

```json
{
  "updatedCount": 24,
  "seats": []
}
```

- Validation rules:
  - array min 1, max recommended 1000 per request.
  - every `seatId` must belong to the event.
  - no duplicate `seatId` in request.
  - no `status`, `sectionId`, `rowNumber`, or `seatNumber` mutation through this endpoint.
  - run inside a transaction where available or fail atomically if any seat does not belong to the event.
- Affected files: same as single-seat layout endpoint.
- Required: yes for a useful designer.

### Required: Extend `POST /events/{eventId}/sections/{sectionId}/generate-seats`

- Access: Admin only.
- Purpose: preserve current matrix generation and optionally seed layout coordinates.
- Request body extension:

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

- Response shape: existing `SeatMapSection` with layout fields in seats.
- Validation rules:
  - existing row/seat validations remain.
  - `autoLayout` optional.
  - default to no coordinates if omitted, or default auto layout if the product decides new generated seats should be immediately placed.
- Affected files:
  - `seat.validation.js`
  - `seat.service.js`
  - `seat.mapper.js`
- Required: recommended. It preserves existing API while giving matrix-generated seats a bridge into freeform layout.

### Optional: `POST /events/{eventId}/seats/manual`

- Access: Admin only.
- Purpose: create individual seats or a small manual batch without rectangular generation.
- Request body:

```json
{
  "sectionId": "string",
  "seats": [
    {
      "rowNumber": 1,
      "seatNumber": 1,
      "label": "Box A",
      "x": 200,
      "y": 300,
      "width": 32,
      "height": 32
    }
  ]
}
```

- Response shape: created seats.
- Validation rules:
  - section must belong to event.
  - generated row/seat uniqueness still applies.
  - status defaults to `Available`; do not allow direct `Sold`.
- Required: optional for MVP. Auto-arranging generated seats plus drag is enough for first delivery.

### Optional: `DELETE /events/{eventId}/seats/{seatId}`

- Access: Admin only.
- Purpose: remove unsold/unreferenced seats.
- Validation rules:
  - block if seat has tickets, order items, active locks, historical locks, or paid/pending order references.
  - allow only unreferenced seats, ideally `Available` or `Released`.
- Required: optional. High data-integrity risk; defer unless the designer needs manual seat creation/removal.

### Seat Lock, Checkout, Order, Ticket APIs

No request changes should be required:

- `POST /events/{eventId}/seat-locks` still accepts `seatIds`.
- `POST /orders` still accepts `seatIds`.
- Checkout still validates locks and updates statuses by `seatId`.
- Ticket verification still uses `qrCode`.

Only display DTOs may optionally include layout data when tickets include seat details.

## 5. Migration and Backward Compatibility Strategy

Use a non-destructive upgrade.

Existing data:

- All existing seats have `rowNumber` and `seatNumber`.
- Existing seats do not have layout coordinates.
- Existing sections do not have `color`, `displayOrder`, or default seat dimensions.
- Existing events do not have layout config.

Backward-compatible rendering strategy:

- If a seat has finite `layout.x` and `layout.y`, render it in coordinate mode.
- If no seats have coordinates, render using current matrix grouping by section, row, and seat number.
- If some seats have coordinates and some do not, show coordinate seats and expose an admin warning: "Some seats are unplaced." Customer UI should either matrix-render unplaced seats in a fallback panel or ask admin to auto-arrange before selling.

Recommended migration/seed strategy:

1. Add optional fields and new layout collection. Do not require them.
2. Update DTOs to return layout fields when present.
3. Add an "Auto arrange" admin action that computes coordinates from existing `rowNumber` and `seatNumber`.
4. Update seed data to include demo coordinates for one event after model/API support exists.
5. Keep existing seed generation for current demo sections so old environments still work.
6. Do not rewrite existing MongoDB documents unless an explicit migration script is run.

Auto-arrange algorithm for existing seats:

- Sort sections by `displayOrder`, then name.
- Assign each section a block below the stage.
- For each row, compute `x = blockStartX + (seatNumber - 1) * gapX`.
- Compute `y = blockStartY + (rowNumber - 1) * gapY`.
- Assign `layout.label` from existing `code` or row label plus seat number.
- Set `layout.isPlaced = true`.

No data loss:

- Do not drop `rowNumber` or `seatNumber`.
- Do not alter seat statuses.
- Do not delete existing seats.
- Do not change order/ticket references.

## 6. Backend Implementation Plan

### Phase 14.2 - Backend Freeform Seating Model/API Upgrade

Tasks:

- Add optional `layout` fields to `Seat`.
- Add optional visual fields to `SeatSection`: `color`, `displayOrder`, `defaultSeatWidth`, `defaultSeatHeight`.
- Add `EventSeatMapLayout` model with unique `eventId`.
- Add layout DTO mappers for layout config, section visual fields, and seat visual fields.
- Add Zod validation schemas for layout config, stage updates, single-seat layout update, and bulk layout update.
- Add repository methods:
  - find layout by event.
  - upsert layout by event.
  - update one seat layout.
  - bulk update seat layouts for an event.
  - optionally find blocking references before deleting seats.
- Add service methods:
  - assert event exists for admin writes.
  - update layout config.
  - update stage.
  - update one seat layout.
  - bulk update layouts without mutating status.
  - auto-arrange generated seats when requested.
- Extend `GET /events/:eventId/seat-map` response with layout fields.
- Extend `GET /events/:eventId/seats` and `GET /events/:eventId/seats/:seatId` with layout fields.
- Extend `generate-seats` with optional `autoLayout`.
- Update seed data with one demo layout after the model exists.
- Add safeguards:
  - status cannot be changed through layout endpoints.
  - bulk update validates all seats belong to event.
  - sold seats can be moved visually but not deleted casually.
  - generated seats never overwrite existing sold seats.

### Phase 14.3 - Admin Freeform Seating Designer UI

Tasks:

- Replace or augment `AdminSeatMapPreview` with a freeform designer mode.
- Load shared venue map with all sections at once.
- Render stage block using persisted config.
- Render seats by coordinates when present.
- Provide matrix fallback or "auto arrange" prompt for unplaced seats.
- Implement native pointer-event dragging for individual seats.
- Add save layout and discard changes.
- Add auto-arrange from current matrix data.
- Add reset layout to clear unsaved local changes, not destructive backend delete.
- Add section filter/palette.
- Add validation/error states for unplaced seats, invalid canvas size, and failed saves.
- Add optional align tools if scope allows: align left, align row, distribute horizontally.

### Phase 14.4 - Customer Freeform Seat Map Rendering

Tasks:

- Update customer seat map normalization to preserve layout fields.
- Render `CustomerSeatMapCanvas` when map has placed seats.
- Keep current `SeatMap` matrix renderer for events without coordinates.
- Preserve selection, lock, checkout, and active-lock logic.
- Keep status colors from shared seat status rules.
- Show selected and locked-by-you states over coordinate seats.
- Add responsive fit-to-view or internal scroll for wide maps.
- Continue polling status via current seat-map refresh.

### Phase 14.5 - Integration QA

Test scenarios:

- Admin creates sections.
- Admin generates matrix seats.
- Admin auto-arranges matrix seats into coordinates.
- Admin drags seats and saves layout.
- Customer opens event and sees saved coordinate layout.
- Customer selects and locks seats by `seatId`.
- Checkout creates order and tickets.
- Admin orders show seat data.
- Admin ticket verification validates QR token.
- Matrix-only old event still renders and works.
- Seat-map polling still updates status.
- Attempted layout save with invalid seat/event IDs fails cleanly.

## 7. Frontend Implementation Plan

### Admin Designer Components

Recommended new components:

- `AdminFreeformSeatDesigner.jsx`: page-level composer inside admin seating page.
- `SeatMapCanvas.jsx`: canvas-like coordinate surface using HTML/CSS, not `<canvas>` initially, so buttons remain accessible.
- `DraggableSeat.jsx`: coordinate-positioned seat button with native pointer events.
- `StageEditor.jsx`: stage block and simple position/size controls.
- `SeatToolbar.jsx`: selected seat metadata, label, dimensions, and position fields.
- `SeatLayoutToolbar.jsx`: save, discard, auto-arrange, fit-to-view, snap toggle.
- `SectionSeatPalette.jsx`: section list/filter, color swatches, section counts.
- `SeatBulkActions.jsx`: align/distribute/place selected seats if multi-select is implemented.
- `AutoArrangePanel.jsx`: settings for start position, gap, seat size, and section spacing.

Recommended customer renderer components:

- `CustomerSeatMapCanvas.jsx`: read-only coordinate map with selectable seats.
- `SeatMapViewport.jsx`: scroll/fit wrapper for freeform maps.
- `CoordinateSeat.jsx`: customer seat button at `layout.x`/`layout.y`.

Dependency recommendation:

- Do not add a drag/drop library for MVP.
- Native pointer events are feasible because the first version only needs dragging seat elements inside a bounded coordinate surface.
- A dependency such as `dnd-kit` may be justified later if the product needs keyboard-accessible multi-drag, collision constraints, advanced drag handles, or complex reorder/palette interactions.
- Alternative without dependency: pointer events plus local reducer state, keyboard arrow nudging for accessibility, and form inputs for exact `x`/`y`.

State strategy:

- Keep designer state route-local in `AdminEventSeatingPage` or a child reducer.
- Track `savedLayout`, `draftLayout`, `dirtySeatIds`, `selectedSeatIds`, `activeSectionId`, `snapToGrid`, and `zoom`.
- Save via bulk endpoint.
- Use URL only for event route, not for transient selected seats.

## 8. UI/UX Rules

Designer UX:

- Stage appears at the top of the venue map by default.
- Seats can be placed anywhere around the stage within canvas bounds.
- Selected seat has a strong primary outline and visible handles or focus state.
- Seat fill color remains status-based:
  - Available: green.
  - Selected: primary blue.
  - Locked: warning/muted.
  - Sold: danger or dark unavailable style.
  - Released: muted.
- Section identity should be shown through labels, side filters, outline tint, or small section tags, not by overriding status colors.
- All sections appear on one shared venue map.
- Snap-to-grid is optional but useful for a clean demo.
- Zoom/pan is optional for MVP; internal scroll plus fit-to-view is acceptable first.
- Provide save and discard controls.
- Show an unsaved changes warning if feasible.
- Auto-center or fit-to-view should be available after loading and after auto-arrange.
- Do not hide unplaced seats; show an "Unplaced seats" warning and an action to auto-arrange.
- Preserve the flat editorial admin design system: 2px borders, dense controls, sharp 6-8px radius, no UI library.

Customer UX:

- Coordinate map should be read-only except seat selection.
- Seat labels must remain legible or accessible by `aria-label`/tooltip when zoomed out.
- Customer should not need to understand section layout tooling.
- Fallback matrix rendering should look like the current seat selection screen.

## 9. Data Integrity and Business Rules

- `seatId` remains the source of truth for locking, orders, checkout, tickets, and ticket verification.
- `layout.x`/`layout.y` are visual metadata only.
- Bulk layout updates must never change `status`, `sectionId`, `eventId`, order data, ticket data, locks, or prices.
- Sold seats can be moved visually, but the UI should warn admins because customers may already have tickets referencing those seat labels.
- Moving sold seats must not change order or ticket ownership.
- Deleting seats with order items, tickets, locks, or historical references must be blocked.
- Generating new seats must not overwrite existing seats, especially sold or locked seats.
- Auto-arrange should only update layout fields.
- Existing unique row/seat constraints should remain for generated seats.
- If manual seat creation is added, it must still produce unique row/seat numbers within the section or adopt a clear manual numbering strategy.
- Customer locking must continue to verify event status and seat availability server-side.
- The frontend must not rely on `x`/`y` for availability decisions.

## 10. Risks and Tradeoffs

- Complexity risk: a visual designer is materially larger than the current matrix UI. The backend and frontend need a stable layout contract first.
- Responsive canvas risk: a coordinate map can be too large for mobile. MVP should use internal scrolling and fit-to-view before advanced pan/zoom.
- Concurrency risk: layout edits and customer seat locks can happen at the same time. This is acceptable because layout edits are visual-only and status locks remain transactional.
- Backward compatibility risk: existing events have no coordinates. Fallback rendering and auto-arrange are mandatory.
- Demo timeline risk: full drag/drop, multi-select, zoom/pan, curved rows, and deletion workflows can exceed a short phase. Keep MVP focused.
- Product clarity risk: manual seat creation/deletion rules are not in current Swagger or migration. Treat as optional until confirmed.
- Audit risk: current audit logging is sparse. Layout saves should ideally create audit logs later, but do not block MVP on full audit coverage.
- Swagger alignment risk: proposed endpoints are not in current `docs/swagger.json`. Phase 14.2 should implement only after explicit approval to extend the API contract or should include a Swagger update task in the same approved phase.

Recommended tradeoff: implement simple coordinate layout first before a full venue editor. The first version should support auto-arrange, drag individual seats, save, and customer coordinate rendering. Defer advanced venue design tools.

## 11. Recommended MVP

MVP includes:

- Add optional `layout` object to seats.
- Add `EventSeatMapLayout` with canvas and stage config.
- Add optional section visual fields.
- Extend `GET /seat-map` to return layout data.
- Add admin layout update endpoints.
- Admin can auto-arrange existing matrix seats.
- Admin can drag individual seats.
- Admin can save layout.
- Customer renders saved coordinates.
- Customer falls back to current matrix renderer when no coordinates exist.
- Existing checkout, tickets, seat locks, orders, and ticket verification remain unchanged.

Explicitly defer:

- Curved rows.
- Polygon sections.
- True venue CAD editor.
- Real-time collaboration.
- Advanced zoom/pan.
- Drag-select multi-edit if too large.
- Seat rotation unless needed for demo.
- Manual seat deletion unless product confirms rules.
- Manual seat creation unless auto-arranged generated seats are insufficient.
- Full audit coverage for every layout edit.

## 12. Open Questions

- Should layout edits be allowed after an event is `Selling`, or only before sales open?
- Should moving sold seats require a confirmation modal or be blocked after tickets exist?
- Should customer coordinate rendering show all sections at once or keep a section filter in addition to all-sections view?
- Should layout saves be audited immediately in Phase 14.2?
- Should manual seat creation/deletion be part of the first designer release?
- Should `rowNumber`/`seatNumber` remain required forever, or can future manual seats use generated numeric placeholders?

## 13. Exact Next Codex Prompt Recommendation

Recommended next prompt title:

```txt
Phase 14.2 — Backend Freeform Seating Model/API Upgrade
```

Suggested implementation order:

1. Backend model fields.
2. Backend APIs.
3. Seed demo coordinates.
4. Admin canvas.
5. Customer renderer.
6. Integration test.
