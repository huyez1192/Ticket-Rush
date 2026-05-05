# Frontend Component Plan

Phase: 7.9 UI Consistency and Design System Planning  
Purpose: define React frontend component architecture before coding. This is a planning document only.

## Component Architecture Principles

- Build reusable primitives first.
- Page components should compose components and call API hooks/services; they should not define unique button/input/table/sidebar styles.
- CSS variables and global design tokens should be created before pages.
- No UI library should be added without approval.
- Axios calls should be centralized in `src/api`.
- Keep state local unless shared across routes or workflows.
- Use Context/useReducer before considering external state management.

## A. Layout Components

| Component | Proposed file | Responsibility |
|---|---|---|
| PublicLayout | `src/layouts/PublicLayout.jsx` | Public pages with optional CustomerHeader/Footer. |
| CustomerLayout | `src/layouts/CustomerLayout.jsx` | Authenticated customer shell with CustomerHeader and outlet. |
| AdminLayout | `src/layouts/AdminLayout.jsx` | Admin shell with AdminSidebar, top/content region, and route guard expectation. |
| AdminSidebar | `src/components/admin/AdminSidebar.jsx` | Admin navigation, active route state, support/settings/logout area. |
| CustomerHeader | `src/components/common/CustomerHeader.jsx` | TicketRush brand, customer nav, notifications, avatar/menu. |

Additional layout helpers:

- `AuthLayout` for customer/admin login/register.
- `PageShell` for constrained customer pages.
- `AdminContentShell` for admin page spacing.
- `Footer` for customer/public pages.

## B. Common Components

| Component | Responsibility |
|---|---|
| Button | Unified button variants: primary, secondary, outline, ghost, danger. |
| Input | Text/email/password field with label, helper, error. |
| Select | Native select wrapper with label/helper/error. |
| Textarea | Multi-line field with shared validation styling. |
| Card | Generic bordered card/panel shell. |
| Modal | Overlay dialog with title, content, actions. |
| Badge | Generic non-status label/chip. |
| StatusBadge | Status-specific badge using backend status constants. |
| LoadingState | Skeleton/spinner states for pages, panels, tables. |
| EmptyState | Reusable empty panel with optional action. |
| ErrorState | Alert/panel for API and route errors. |
| Pagination | Bordered page controls. |
| Table | Admin table primitives: container, header, rows, cells, actions. |
| IconButton | Accessible icon-only button. |

Supporting common utilities:

- `Tabs`
- `SearchInput`
- `FilterBar`
- `ConfirmDialog`
- `FormField`
- `Avatar`

## C. Event Components

| Component | Responsibility |
|---|---|
| EventCard | Customer event listing card with image, date, location, price/CTA. |
| EventFilters | Keyword/status/date filters compatible with Swagger. |
| EventDetailsHeader | Event hero/header with event metadata and image. |
| EventImageGallery | Gallery/hero image handling using API image URLs. |
| EventStatusBadge | Thin wrapper around StatusBadge for event statuses. |

Admin event components:

- `AdminEventRow`
- `AdminEventFilters`
- `EventLifecycleActions`

## D. Seat Components

| Component | Responsibility |
|---|---|
| SeatMap | Visual grid grouped by sections, with zoom/scroll support. |
| Seat | Individual seat with status, selected state, disabled state. |
| SeatLegend | Status legend for Available, Selected, Locked, Sold, Released. |
| SectionSelector | Seat section filter/tabs. |
| SeatSummary | Selected seats and subtotal panel. |
| SeatLockTimer | Countdown from lock expiry. |

Admin-specific seat helpers:

- `AdminSeatStatusControls`
- `SeatMapToolbar`

## E. Order/Checkout Components

| Component | Responsibility |
|---|---|
| CheckoutSummary | Sticky/fixed order total panel with confirm action. |
| SelectedSeatsList | Seats included in order/checkout. |
| PaymentMockPanel | Mock payment method selector and confirmation note. |
| OrderStatusBadge | StatusBadge wrapper for Pending, Paid, Expired, Cancelled. |

Additional:

- `OrderDetailPanel`
- `CancelOrderDialog`
- `CheckoutCountdownAlert`

## F. Ticket Components

| Component | Responsibility |
|---|---|
| TicketCard | My Tickets list item with date block, event info, QR action. |
| TicketQrCard | QR payload display area and scan instructions. |
| TicketDetailPanel | Full ticket details with event, seat, ticket ID, barcode/QR area. |

Notes:

- Backend currently returns QR payload/token, not a QR image. The first implementation should display the payload safely and leave image QR rendering as a later enhancement unless a small approved QR dependency is added.

## G. Admin Components

| Component | Responsibility |
|---|---|
| AdminPageHeader | Admin title, subtitle, primary action area. |
| AdminDataTable | Admin table wrapper using common Table primitives. |
| AdminEventForm | Create/update event fields; excludes status update field. |
| AdminEventStatusActions | Publish/open-selling/close/cancel actions. |
| AdminSectionForm | Seat section name/description/price form. |
| AdminSeatMatrixGenerator | Rows/seats-per-row generation form. |
| AdminDashboardMetricCard | Dashboard KPI card. |
| AdminChartPlaceholder | Bordered chart panel for data not yet charted. |

Additional admin components:

- `AdminFilterBar`
- `AdminOrderDetailModal`
- `AdminTicketVerifyModal`
- `AdminRoleAssignmentModal`
- `AuditLogTable`
- `QueueManagementPanel`

## Derived Screen Implementation Rules

- Derived screens must be assembled from shared layout and common components.
- Do not create one-off styling for derived screens.
- Prefer existing components:
  - Button
  - Card
  - Table
  - StatusBadge
  - EmptyState
  - ErrorState
  - LoadingState
  - Modal
  - AdminPageHeader
  - AdminDataTable
- If a derived screen needs a new component, add it to the component plan before implementation.
- If a missing flow has unclear behavior, stop and ask before coding.
- Derived admin screens should start from `AdminLayout`, `AdminSidebar`, `AdminPageHeader`, filters, tables, and modals.
- Derived public/customer screens should start from `PublicLayout` or `CustomerLayout`, `CustomerHeader`, `Card`, state components, and standard CTAs.
- Utility screens such as unauthorized, not found, checkout success/failure, loading, empty, and error states should reuse shared state components and should not define page-specific visual systems.

## H. API Client Files To Create Later

Create under `src/api`:

- `axiosClient.js`
- `authApi.js`
- `userApi.js`
- `eventApi.js`
- `seatApi.js`
- `seatLockApi.js`
- `orderApi.js`
- `ticketApi.js`
- `adminUserApi.js`
- `adminRoleApi.js`
- `dashboardApi.js`
- `auditLogApi.js`
- `queueApi.js`

API module responsibilities:

- Export named functions, not raw Axios calls.
- Return `response.data.data` or a normalized object consistently.
- Map backend validation errors into a shared UI error shape.
- Never hard-code `/api` if `VITE_API_BASE_URL` is configured.
- Attach bearer token through Axios interceptor.

## I. State Management Plan

### Auth state

Use React Context plus `useReducer`:

- access token
- current user
- roles
- auth loading state
- login/logout/register actions

Persist token in localStorage for first implementation unless a more secure storage plan is approved.

### Selected seats state

Use route-local reducer in `SeatSelectionPage`:

- selected seat IDs
- active locks
- lock expiry
- seat-map polling state
- failed lock attempts

Persist selected seats only while user remains in the flow. Do not make selected seats global app state.

### Checkout state

Use route-local state:

- current order
- selected payment method
- confirm loading/error
- countdown derived from locks/order

Checkout should prefer `orderId` route state once order is created.

### Admin filters state

Use URL query params for list pages where practical:

- event filters
- order filters
- audit-log filters
- pagination

This keeps admin views bookmarkable and refresh-safe.

### External state management

Context/useReducer is enough for Phase 8-13. Do not add Redux/Zustand/Jotai unless cross-route state becomes difficult after implementation.

## J. Phase Implementation Order

### Phase 8: Frontend foundation

- Vite app verification.
- Routing shell.
- Layouts.
- Auth provider skeleton.
- Axios client.
- Route guards.
- Global CSS tokens.
- Common components: Button, Input, Select, Textarea, Card, Modal, Badge, StatusBadge, LoadingState, EmptyState, ErrorState, Pagination, Table, IconButton.

### Phase 9: Auth pages and auth wiring

- Customer login/register.
- Admin login.
- Login redirects based on role.
- Logout.
- Protected route behavior.

### Phase 10: Customer event browsing

- Event listing.
- Event filters supported by Swagger.
- Event cards.
- Event details.
- Event image gallery.
- Public seat map preview where useful.

### Phase 11: Customer seat selection and checkout

- Seat map.
- Seat lock/release.
- Polling seat-map changes.
- Selected seats summary.
- Create order.
- Checkout mock confirmation.
- Error handling for expired/missing locks.

### Phase 12: Customer tickets

- My tickets.
- Ticket detail.
- QR payload panel.
- Waiting room basic display if accepted as partial.

### Phase 13: Admin dashboard/events/seating/orders

- Admin dashboard with current backend metrics and placeholders for missing live/time-series values.
- Event management and lifecycle actions.
- Seating config normalized to unified admin style.
- Orders/sold tickets table using available admin order APIs.
- Admin users/roles if needed for admin management.
- Audit logs as a limited list.

### Phase 14: Polish and integration review

- Compare frontend API calls to Swagger and Phase 7.8 review.
- Responsive pass.
- Loading/empty/error pass.
- Accessibility pass.
- Manual demo flows.
- Add frontend tests where practical.

## Implementation Risks To Track

- SSE stream is intentionally skipped; use polling.
- Queue token enforcement is incomplete; waiting room is partial.
- Dashboard live-user/time-series data is not fully backed.
- Audit logs do not cover all admin actions.
- Admin sold-ticket screen lacks a direct `GET /admin/tickets` endpoint; derive from orders or defer.
- `PUT /events/{eventId}` rejects status despite Swagger documenting it; use dedicated status endpoints.
- QR endpoint returns payload/token, not generated image.
