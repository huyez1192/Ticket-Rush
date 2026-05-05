# Design Screen Mapping

Phase: 7.9 UI Consistency and Design System Planning  
Purpose: map generated design screens to React routes, pages, backend APIs, and reusable components before frontend coding.

## Routing Rules

- Public pages may be accessed without auth.
- Customer pages require authenticated `Customer` role unless noted.
- Admin pages require authenticated `Admin` role.
- API paths listed below assume frontend Axios base URL points to `/api`.
- Use polling endpoint `GET /events/{eventId}/seat-map/changes` for seat-map updates. Do not rely on SSE in the first build.

## Screen Mapping Table

| Design folder | User role | Proposed route | Design status | Proposed page file | Related backend API endpoints | Reusable components needed | UI consistency notes | Missing data or unclear behavior | Phase |
|---|---|---|---|---|---|---|---|---|---|
| `ticketrush_customer_login` | Public | `/login` | Original design available | `src/pages/public/LoginPage.jsx` | `POST /auth/login`, `GET /auth/me` after token | AuthLayout, BrandPanel, Input, Checkbox, Button, ErrorState | Normalize with admin login/register form controls. Preserve split blue image panel. | Product language needs decision: Vietnamese vs English. | Phase 9 |
| `ticketrush_customer_register` | Public | `/register` | Original design available | `src/pages/public/RegisterPage.jsx` | `POST /auth/register` | AuthLayout, Input, DateInput, SegmentedControl, Button, ErrorState | Use same auth form style as login. Reduce soft background differences. | Backend register fields include username/email/password/fullName/dateOfBirth/gender; design lacks explicit username. Add username field or map fullName carefully. | Phase 9 |
| `ticketrush_customer_event_listing` | Public/Customer | `/events` and optionally `/` redirect | Original design available | `src/pages/public/EventListingPage.jsx` | `GET /events` | CustomerHeader, SearchBar, EventFilters, CategoryTile, EventCard, Button, Pagination/LoadMore, Footer | Strong baseline for customer style. Use event images from API. | Category, relevance, price, popularity, near-me filters are not in Swagger. Implement keyword/status/date first; unsupported chips can be static/deferred. | Phase 10 |
| `ticketrush_customer_event_details` | Public/Customer | `/events/:eventId` | Original design available | `src/pages/public/EventDetailsPage.jsx` | `GET /events/{eventId}`, `GET /events/{eventId}/images`, `GET /events/{eventId}/sections`, `GET /events/{eventId}/seat-map` | CustomerHeader, EventDetailsHeader, EventImageGallery, TicketTierList, Card, Button, Footer | Preserve hero/detail layout and bordered panels. | Backend section data supplies prices; no category/tier naming beyond sections. | Phase 10 |
| `ticketrush_customer_select_your_seats` | Customer | `/events/:eventId/seats` | Original design available | `src/pages/customer/SeatSelectionPage.jsx` | `GET /events/{eventId}`, `GET /events/{eventId}/seat-map`, `GET /events/{eventId}/seat-map/changes`, `POST /events/{eventId}/seat-locks`, `GET /events/{eventId}/seat-locks`, `DELETE /events/{eventId}/seat-locks/{seatId}` | CustomerHeader, SeatMap, Seat, SeatLegend, SeatSummary, SeatLockTimer, ErrorState | Use unified seat colors and fixed grid dimensions. | Queue token enforcement is partial; use polling, not SSE. Countdown depends on lock expiry returned from API. | Phase 11 |
| `ticketrush_customer_checkout` | Customer | `/checkout/:eventId` or preferred `/orders/:orderId/checkout` | Original design available | `src/pages/customer/CheckoutPage.jsx` | `POST /orders`, `GET /orders/{orderId}`, `POST /orders/{orderId}/checkout`, `DELETE /orders/{orderId}` | CustomerHeader, CheckoutSummary, SelectedSeatsList, PaymentMockPanel, SeatLockTimer, Button, Modal | Preserve two-column checkout and sticky summary; normalize radio controls and panels. | Route should ideally use `orderId` after order creation. Payment is mock only. No real payment API. | Phase 11 |
| `ticketrush_customer_my_tickets` | Customer | `/my-tickets` | Original design available | `src/pages/customer/MyTicketsPage.jsx` | `GET /tickets` | CustomerHeader, TicketCard, Tabs, StatusBadge, EmptyState, Pagination, Footer | Good customer baseline; make ticket card reusable. | Backend ticket list may not expose upcoming/past filters; derive on frontend from event date if available. | Phase 12 |
| `ticketrush_customer_ticket_detail_with_qr` | Customer | `/my-tickets/:ticketId` | Original design available | `src/pages/customer/TicketDetailPage.jsx` | `GET /tickets/{ticketId}`, `GET /tickets/{ticketId}/qr` | CustomerHeader, TicketDetailPanel, TicketQrCard, Button, StatusBadge, Footer | Preserve ticket/QR split. Use backend QR payload. | Backend returns QR token/payload, not a generated QR image. Frontend needs either simple text/barcode placeholder or approved QR rendering later. | Phase 12 |
| `ticketrush_customer_waiting_room` | Customer | `/events/:eventId/waiting-room` preferred; `/waiting-room` can redirect if event context exists | Original design available | `src/pages/customer/WaitingRoomPage.jsx` | `POST /queue/join`, `GET /queue/{queueId}`, `GET /queue/events/{eventId}/me`, `DELETE /queue/{queueId}` | CustomerHeaderMinimal, WaitingRoomPanel, ProgressBar, StatusBadge, Button, ErrorState | Keep amber high-alert mode, but normalize typography/card/progress. | Queue activation, token enforcement, expiry, and auto-admit behavior are incomplete. Treat as risky/deferred beyond basic display. | Phase 12 or later |
| `ticketrush_admin_login` | Public/Admin | `/admin/login` | Original design available | `src/pages/admin/AdminLoginPage.jsx` | `POST /auth/login`, `GET /auth/me` after token | AuthLayout, BrandPanel, Input, Button, ErrorState | Use same auth primitives as customer login; preserve admin copy and split blue panel. | Login endpoint is shared; frontend redirects based on roles. | Phase 9 |
| `ticketrush_admin_analytics_dashboard` | Admin | `/admin/dashboard` | Original design available | `src/pages/admin/AdminAnalyticsDashboardPage.jsx` | `GET /admin/dashboard/overview`, `GET /admin/dashboard/events/{eventId}/revenue`, `GET /admin/dashboard/events/{eventId}/seat-occupancy`, `GET /admin/dashboard/events/{eventId}/demographics`, optional `GET /admin/events/{eventId}/queue` | AdminLayout, AdminSidebar, AdminPageHeader, DashboardMetricCard, AdminChartPlaceholder, StatusBadge, Select | Primary admin visual baseline. Use placeholders for unsupported live/time-series widgets. | Live users and true time-series data are not directly available. Dashboard overview schema is partial. | Phase 13 |
| `ticketrush_admin_event_management` | Admin | `/admin/events` | Original design available | `src/pages/admin/AdminEventManagementPage.jsx` | `GET /events`, `POST /events`, `GET /events/{eventId}`, `PUT /events/{eventId}`, `DELETE /events/{eventId}`, status endpoints, image endpoints | AdminLayout, AdminSidebar, AdminPageHeader, EventFilters, AdminDataTable, EventStatusBadge, IconButton, Modal, AdminEventForm | Keep editorial table/filter style. Reuse AdminSidebar from dashboard. | `PUT /events/{eventId}` cannot update status; use dedicated lifecycle endpoints. Delete may return conflict when dependencies exist. | Phase 13 |
| `ticketrush_admin_event_seating_config` | Admin | `/admin/events/:eventId/seating` | Original design available | `src/pages/admin/AdminEventSeatingConfigPage.jsx` | `GET /events/{eventId}`, `GET /events/{eventId}/sections`, `POST /events/{eventId}/sections`, `PUT /events/{eventId}/sections/{sectionId}`, `DELETE /events/{eventId}/sections/{sectionId}`, `POST /events/{eventId}/sections/{sectionId}/generate-seats`, `GET /events/{eventId}/seat-map`, `PATCH /events/{eventId}/seats/{seatId}`, `POST /admin/seat-locks/release-expired` | AdminLayout, AdminSidebar, AdminPageHeader, AdminEventForm, AdminSectionForm, AdminSeatMatrixGenerator, SeatMap, SeatLegend, Modal | Do not pixel-copy soft rounded styling. Normalize to editorial admin panels and buttons. | Backend blocks manual Sold, but direct Released remains partial. Queue rate config is not backed by event setting. | Phase 13 |
| `ticketrush_admin_sold_ticket_management` | Admin | `/admin/orders` preferred; `/admin/sold-tickets` can alias | Original design available | `src/pages/admin/AdminSoldTicketManagementPage.jsx` | `GET /admin/orders`, `GET /admin/orders/{orderId}`, `POST /admin/tickets/verify`, `GET /tickets/{ticketId}` not admin-scoped, optional audit logs | AdminLayout, AdminSidebar, AdminPageHeader, Tabs, AdminDataTable, OrderStatusBadge, TicketQrCard, Modal, Pagination | Good admin baseline; table density should match EventManagement. | No admin ticket list endpoint exists except order detail and ticket verify. Issued tickets tab may need to derive tickets from orders or wait for API extension. | Phase 13 |

## Route Summary

Public:

- `/`
- `/login`
- `/register`
- `/events`
- `/events/:eventId`
- `/admin/login`

Customer:

- `/events/:eventId/seats`
- `/orders/:orderId/checkout`
- `/checkout/:eventId` as compatibility route only if needed
- `/my-tickets`
- `/my-tickets/:ticketId`
- `/events/:eventId/waiting-room`
- `/waiting-room` as fallback/redirect only

Admin:

- `/admin/dashboard`
- `/admin/events`
- `/admin/events/:eventId`
- `/admin/events/:eventId/seating`
- `/admin/orders`
- `/admin/sold-tickets` optional alias to `/admin/orders`
- `/admin/users`
- `/admin/roles`
- `/admin/audit-logs`

Derived utility routes:

- `/checkout/success`
- `/checkout/failure`
- `/unauthorized`
- `*` not found route

## Frontend API Notes

- All API calls should use centralized API modules.
- `GET /events` is public but admin event screens may need to show non-public statuses. Backend currently exposes event list publicly with status filtering, but public visibility should be verified during integration.
- `PUT /events/{eventId}` does not accept `status`; use `/publish`, `/open-selling`, `/close`, `/cancel`.
- Use polling for seat-map changes.
- Treat queue-token access control as partial until backend supports it.
- For admin sold tickets, avoid assuming a direct `GET /admin/tickets` endpoint because Swagger does not define one.

## Missing or Derived Screens

These screens are likely needed for a complete app but are not clearly present as standalone AI-generated designs. They must be derived from the unified design system rather than given a new visual language.

| Screen/flow | Proposed route | Design status | Backend APIs needed | Can implement now? | Product clarification needed |
|---|---|---|---|---|---|
| Unauthorized page | `/unauthorized` | Derived from design system | None directly; driven by route guards and auth state | Yes | No |
| Not found page | `*` or `/not-found` | Derived from design system | None | Yes | No |
| Loading state | Component-level, no route | Derived from design system | Any pending API call | Yes | No |
| Error state | Component-level, no route | Derived from design system | Any failed API call | Yes | No |
| Empty state | Component-level, no route | Derived from design system | Any empty list response | Yes | No |
| Checkout success page | `/checkout/success` or `/orders/:orderId/success` | Derived from design system | `GET /orders/{orderId}`, `GET /tickets` or redirect to `/my-tickets` | Yes | Decide canonical post-checkout route and whether success page is separate or redirects to ticket detail. |
| Checkout failure page | `/checkout/failure` or inline checkout error | Derived from design system | `GET /orders/{orderId}` for recovery context | Yes | Decide whether checkout failure is a route or inline error panel. |
| Seat lock expired state | Inline on `/events/:eventId/seats` and `/orders/:orderId/checkout` | Derived from design system | `GET /events/{eventId}/seat-locks`, `DELETE /orders/{orderId}`, seat-map polling | Yes | Automatic release worker behavior is still not fully implemented; clarify expected UX after expiry. |
| Order detail page | `/orders/:orderId` | Derived from design system | `GET /orders/{orderId}`, `DELETE /orders/{orderId}` | Yes | Decide whether customers need a standalone order detail page or only checkout/ticket views. |
| Admin users page | `/admin/users` | Derived from design system | `GET /admin/users`, `GET /admin/users/{id}`, `DELETE /admin/users/{id}`, `PUT /admin/users/{id}/roles` | Yes | Confirm whether user management belongs in first admin UI release. |
| Admin roles page | `/admin/roles` | Derived from design system | `GET /admin/roles`, `GET /admin/roles/{id}` | Yes | Roles are read-only; clarify whether this is standalone or folded into user role assignment. |
| Admin audit logs page | `/admin/audit-logs` | Derived from design system | `GET /admin/audit-logs` | Yes | Audit writes are sparse; clarify if page should be visible before broader audit coverage. |
| Admin user role assignment flow | Modal from `/admin/users` | Derived from design system | `GET /admin/roles`, `PUT /admin/users/{id}/roles` | Yes | Confirm safeguards/UX for last Admin and self role changes. |
| Admin event detail page | `/admin/events/:eventId` | Derived from design system | `GET /events/{eventId}`, event image endpoints, status endpoints | Yes | Could be folded into event management modal instead of route. |
| Admin ticket verification modal/page | `/admin/tickets/verify` optional, or modal from `/admin/orders` | Derived from design system | `POST /admin/tickets/verify` | Yes | Decide whether verification is a standalone route, modal, or admin toolbar action. |
| Queue management panel | `/admin/events/:eventId/queue` optional, or panel within dashboard/seating | Derived from design system | `GET /admin/events/{eventId}/queue`, `POST /admin/events/{eventId}/queue/admit-batch` | Partially | Queue token enforcement and activation rules are unclear. |
| Seat-map SSE state | No route; optional realtime mode | Deferred | `GET /events/{eventId}/seat-map/stream` | No | SSE endpoint is intentionally skipped; use polling first. |

