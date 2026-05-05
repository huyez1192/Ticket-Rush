# UI Consistency Spec

Phase: 7.9 UI Consistency and Design System Planning  
Scope: React frontend planning only. No application code is defined here.  
Sources reviewed: `AGENTS.md`, `docs/implementation-plan.md`, `docs/swagger.json`, `docs/requirements.md`, `docs/backend-integration-review-phase-7-8.md`, and all `docs/design` folders.

## Design Screen Audit

| Design folder | Role | Screen purpose | Major layout structure | Key reusable components | Inconsistencies found |
|---|---|---|---|---|---|
| `flat_editorial_bold` | Shared | Base visual system | Style guide with tokens, typography, spacing, borders, and component notes | Design tokens, buttons, cards, inputs, badges | This is the most coherent source and should override inconsistent generated screens. It mentions decorative geometry, but implementation should keep it restrained. |
| `ticketrush_admin_analytics_dashboard` | Admin | Admin dashboard overview | Fixed left sidebar, top page bar, metric cards, chart panels, demographics panel | AdminSidebar, AdminPageHeader, MetricCard, ChartPanel, SearchInput | Strong editorial style with heavy borders, square cards, and no soft shadows. Should be retained as admin baseline. |
| `ticketrush_admin_event_management` | Admin | Event list and status management | Fixed left sidebar, page header, filter panel, bordered data table/list, pagination | AdminSidebar, FilterBar, AdminDataTable, StatusBadge, IconButton | Mostly consistent with dashboard, but sidebar logo sizing and table/card density differ. |
| `ticketrush_admin_event_seating_config` | Admin | Event configuration, zones, seat matrix | Fixed left sidebar, rounded content panels, forms, zone list, interactive seat preview | AdminSidebar, EventForm, SectionForm, SeatMap, SeatMatrixGenerator | Outlier admin screen: large radius, soft backgrounds, many shadows, softer buttons. Must be normalized to editorial admin style. |
| `ticketrush_admin_login` | Admin/Public | Admin login | Split screen with blue brand panel and login form | AuthLayout, Input, Button, BrandPanel | Similar to customer login but with English copy. Uses flat panels but fewer borders on inputs than core system. |
| `ticketrush_admin_sold_ticket_management` | Admin | Orders and tickets management | Fixed left sidebar, large page heading, tabs, filter bar, bordered table, pagination | AdminSidebar, Tabs, FilterBar, AdminDataTable, Pagination | Consistent with dashboard/events but table row height and header scale need standardization. |
| `ticketrush_customer_checkout` | Customer | Checkout and mock payment | Customer header, two-column checkout layout, left detail panels, right sticky order summary | CustomerHeader, CheckoutSummary, SelectedSeatsList, PaymentMockPanel, CountdownAlert | Strong editorial style; mixed Vietnamese/English data and currency. Needs tokenized form/payment controls. |
| `ticketrush_customer_event_details` | Public/Customer | Event detail | Customer header, image hero, detail panels, ticket tier panel, CTA | CustomerHeader, EventDetailsHeader, EventImageGallery, TicketTierList, Button | Matches editorial style well. Hero image overlay is acceptable, but should use real event images and consistent CTA/button sizing. |
| `ticketrush_customer_event_listing` | Public/Customer | Event discovery | Customer header, blue search hero, category tiles, event card grid, footer | CustomerHeader, SearchBar, CategoryTile, EventCard, EventFilters, Pagination/LoadMore | Mostly consistent, but category/filter controls include API-unsupported concepts. Use only supported filters or static visual chips. |
| `ticketrush_customer_login` | Public | Customer login | Split screen with image/blue overlay panel and form panel | AuthLayout, BrandPanel, Input, Checkbox, Button | Vietnamese copy, soft borderless inputs, image-heavy side. Needs same auth controls as admin login/register. |
| `ticketrush_customer_my_tickets` | Customer | Ticket list | Customer header, large page heading, status tabs, stacked ticket cards, footer | CustomerHeader, TicketCard, Tabs, StatusBadge | Consistent editorial structure. Ticket cards have a distinct date block that should become reusable. |
| `ticketrush_customer_register` | Public | Customer registration | Centered registration form over pale geometric background | AuthLayout, Input, SegmentedControl, Button | Softer background geometry, borderless inputs, Vietnamese copy. Should share auth form styles with login. |
| `ticketrush_customer_select_your_seats` | Customer | Seat selection | Customer header, event summary band, large seat matrix, legend, selected seats panel, footer | CustomerHeader, SeatMap, SeatLegend, SeatSummary, SeatLockTimer | Strong editorial style. Seat colors are good but need exact status mapping to backend statuses. |
| `ticketrush_customer_ticket_detail_with_qr` | Customer | Ticket detail with QR | Customer header, ticket panel, QR panel, action buttons, footer | CustomerHeader, TicketDetailPanel, TicketQrCard, Button, StatusBadge | Consistent editorial style. QR display should handle backend JSON QR payload, not assume generated image unless implemented later. |
| `ticketrush_customer_waiting_room` | Customer | Waiting room queue position | Minimal header, amber full-page background, centered bordered queue panel, progress bar | WaitingRoomPanel, ProgressBar, StatusBadge, HelpButton | Purposefully high-alert and acceptable as a special state, but it should still use shared typography, buttons, borders, and spacing. |

## A. Visual Direction

### Selected unified style direction

Use the `flat_editorial_bold` design guide as the single source for visual language. The product should feel like a high-contrast digital ticketing system: flat surfaces, bold borders, strong typography, restrained color blocking, and clear operational hierarchy.

Do not pixel-copy generated screens where they conflict with this system. Preserve screen intent, information architecture, and primary workflow, but normalize components.

### Admin UI direction

Admin UI should use a denser, operational version of the flat editorial system:

- Light workspace background.
- Fixed left sidebar.
- White or pale blue panels with 2px borders.
- Compact buttons, tables, filters, and form controls.
- Minimal decoration.
- No soft cards inside cards.
- No heavy shadow-based hierarchy.

The admin analytics, event management, and orders screens are closest to the target. The seating configuration screen must be restyled to match them.

### Customer UI direction

Customer UI should use the same base style with more expressive brand moments:

- Same typography, borders, radius, and component rules.
- Larger event imagery on listing/detail pages.
- More blue brand blocking in hero/auth areas.
- Clear, high-contrast purchase CTAs.
- Footer and customer header shared across customer pages.

The customer event listing, event details, seat selection, checkout, my tickets, and ticket detail screens are close to the target. Login/register need normalized form styling.

### Shared vs role-specific style

Admin and Customer should share:

- CSS tokens.
- Typography scale.
- Button/input/card/table/badge primitives.
- Border and radius rules.
- Status colors.

They may vary in:

- Layout shell: admin sidebar vs customer top header.
- Density: admin is tighter, customer pages have larger hero/media sections.
- Accent usage: customer can use broader blue event hero sections; admin should stay quieter and work-focused.

## B. Color System

Use CSS variables in Phase 8. These values come from `flat_editorial_bold` and are normalized for app use.

| Token | Value | Usage |
|---|---:|---|
| Primary | `#0058be` | Primary buttons, active navigation, selected seats, links |
| Primary hover | `#004da5` | Primary button hover |
| Secondary | `#006c49` | Success-led CTAs, available/paid states |
| Secondary hover | `#005236` | Secondary hover |
| Accent/warning | `#a36700` | High-demand tags, waiting room accents |
| Background | `#f9f9ff` | Page background |
| Background alt | `#f1f3ff` | Bands, admin workspace panels |
| Surface/card | `#ffffff` | Cards, dialogs, table bodies |
| Surface tinted | `#e9edff` | Card headers, table headers |
| Border strong | `#141b2b` | Primary 2px borders |
| Border muted | `#c2c6d6` | Secondary separators and disabled outlines |
| Text primary | `#141b2b` | Main text |
| Text secondary | `#424754` | Metadata and supporting copy |
| Text inverse | `#ffffff` | Text on dark/primary surfaces |
| Success | `#00714d` | Paid, Selling, Available |
| Warning | `#a36700` | Pending, Waiting, high demand |
| Danger | `#ba1a1a` | Error, Cancelled, destructive actions |
| Muted/disabled | `#727785` | Disabled text/icons |
| Disabled background | `#dce2f7` | Disabled controls |

Avoid one-note screens dominated only by blue. Blue is the action/brand color; green, amber, white, and navy should balance it.

## C. Typography

### Font strategy

Use `Outfit` as the primary font because it appears in the style guide and generated screens. Provide fallbacks:

```txt
Outfit, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

If Google Fonts are used, load only the weights needed: 400, 500, 600, 700, 800, 900. Do not add a font package.

### Type scale

| Token | Desktop | Mobile | Weight | Usage |
|---|---:|---:|---:|---|
| Display | 56px / 1.0 | 40px / 1.05 | 900 | Customer hero, ticket detail headline |
| H1 | 44px / 1.1 | 32px / 1.15 | 800 | Page titles |
| H2 | 32px / 1.2 | 26px / 1.2 | 800 | Section titles, panel titles |
| H3 | 24px / 1.25 | 22px / 1.25 | 700 | Card titles |
| Body large | 18px / 1.6 | 17px / 1.5 | 400 | Prominent body text |
| Body | 16px / 1.5 | 16px / 1.5 | 400 | Default text |
| Small | 14px / 1.4 | 14px / 1.4 | 500 | Metadata, help text |
| Caption | 12px / 1.3 | 12px / 1.3 | 700 | Badges, table metadata |

Rules:

- Button text: 14px or 15px, weight 800, uppercase for editorial buttons unless the button appears in a dense admin table.
- Table headers: 13px, weight 800, uppercase, letter spacing 0.04em.
- Sidebar labels: 15px, weight 700, uppercase only for section labels, normal case for nav items.
- Letter spacing should usually be `0`; use positive letter spacing only for compact labels and table headers.

## D. Spacing and Layout

Use an 8px base scale:

```txt
0, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96
```

Layout rules:

- Page padding desktop: 40px.
- Page padding tablet: 24px.
- Page padding mobile: 16px.
- Section gap: 32px desktop, 24px mobile.
- Card/panel padding: 24px desktop, 16px mobile.
- Form spacing: 20px between fields, 8px label-to-control gap.
- Table row height: 72px admin default, 88px for rich rows with image/meta.
- Sidebar width: 320px in the existing generated admin screens is visually heavy; use 280px desktop, 72px collapsed optional later.
- Admin content max width: none for operational dashboards, but inner content should have practical max of 1440px on very wide displays.
- Customer content max width: 1280px.
- Auth form width: 480px to 560px.

Responsive behavior:

- Admin sidebar becomes top drawer or collapsible rail below 1024px.
- Admin tables should horizontally scroll inside a bordered table container when columns cannot fit.
- Customer event cards use 3 columns desktop, 2 tablet, 1 mobile.
- Seat map gets a scroll/zoom container and must not shrink seats below tappable size.

## E. Border Radius and Borders

The app should use sharper borders than typical SaaS UI.

| Element | Radius | Border |
|---|---:|---|
| Default | 6px | 2px solid strong border when framed |
| Button | 6px | 2px solid |
| Card/panel | 8px max | 2px solid |
| Input/select/textarea | 4px | 2px solid muted, strong/primary on focus |
| Table container | 6px | 2px solid strong |
| Badge | 999px or 4px | 2px solid status color |
| Modal/dialog | 8px | 2px solid strong |
| Seat | 4px | 2px solid strong |

Admin UI uses sharper, denser borders and should not use the soft rounded card style from the seating config generated screen. Customer UI may use slightly larger layout panels, but still capped at 8px.

Border thickness:

- Standard framed components: 2px.
- Dividers/table row borders: 1px or 2px depending on density.
- Selected/focus state: 2px primary border plus visible outline if needed.
- Avoid shadows for hierarchy. Use borders, surface tint, scale, and spacing.

## F. Buttons

All buttons share:

- Height small: 36px.
- Height default: 44px.
- Height large CTA: 56px.
- Horizontal padding: 16px small, 20px default, 28px large.
- Radius: 6px.
- Border: 2px solid.
- Font: 14px to 15px, weight 800.
- Icon gap: 8px.

| Variant | Background | Border | Text | Hover | Disabled |
|---|---|---|---|---|---|
| Primary | Primary | Border strong | White | Primary hover, translate 1px or scale 1.02 | Disabled background, muted text, muted border |
| Secondary | Secondary | Border strong | White | Secondary hover | Disabled background, muted text |
| Outline | White | Border strong | Text primary | Background alt | Disabled border muted, muted text |
| Ghost | Transparent | Transparent | Text primary | Background alt, no shadow | Muted text |
| Danger | Danger | Border strong | White | Darker red `#93000a` | Disabled background, muted text |
| Icon button | White or transparent | Border strong for framed controls | Text primary | Background alt | Muted icon, disabled border |

Rules:

- Use icons in icon buttons where possible instead of text-only utility buttons.
- Primary buttons should be reserved for the next main workflow action.
- Do not create per-page button styles.

## G. Inputs and Forms

Text input:

- Background: white or `#f1f3ff` for auth pages.
- Border: 2px solid muted.
- Focus: primary border and visible outline offset.
- Height: 48px default, 44px dense admin.
- Padding: 12px 14px.
- Radius: 4px.
- Placeholder: muted text, not too low contrast.

Select:

- Same as input.
- Use a native select first unless custom behavior is required.
- Add consistent chevron icon.

Date/time input:

- Same field style as text input.
- Admin date/time fields can sit side by side at desktop and stack on mobile.

Textarea:

- Min height 120px.
- Resize vertical.
- Same border/focus rules.

Label:

- 13px to 14px.
- Weight 800.
- Uppercase in editorial forms and admin filters.
- Margin bottom 8px.

Validation error:

- Red border.
- Error text in danger color.
- 13px, weight 600.
- Error icon optional.

Helper text:

- Text secondary.
- 13px.
- Place below field with 6px top margin.

## H. Cards and Panels

Cards/panels:

- Background: white.
- Border: 2px solid border strong.
- Shadow: none.
- Radius: 8px maximum.
- Padding: 24px.

Panel header:

- Optional tinted background `#e9edff`.
- Bottom border: 2px solid border strong.
- Padding: 16px 24px.
- Title: H3 or compact H2 depending on panel size.

Panel footer/action area:

- Top border if separated.
- Padding: 16px 24px.
- Actions right-aligned on desktop, full-width stacked on mobile.

Do not nest decorative cards inside cards. Use sections, panels, rows, and dividers.

## I. Tables

Table container:

- White background.
- 2px solid border strong.
- Radius 6px.
- Horizontal overflow on small screens.

Header row:

- Background `#e9edff`.
- 2px bottom border.
- Uppercase 13px bold labels.
- Height 56px.

Body row:

- Height 72px standard.
- Border bottom 1px muted.
- Alternating row background optional only for dense admin tables.
- Hover background `#f1f3ff`.

Cell padding:

- 16px 20px desktop.
- 12px 16px dense.

Action icons:

- Use icon buttons with 36px square target.
- Destructive actions use danger color.
- Include accessible labels.

Empty state:

- Bordered panel inside table body or full table empty row.
- Clear title, short supporting text, optional primary action.

Pagination:

- Use bordered page buttons.
- Current page dark or primary background.
- Disabled previous/next muted.

## J. Status Badges

Badges use 12px to 13px text, weight 800, compact padding, 2px border, and either filled or tinted background. Use the same `StatusBadge` component everywhere.

| Status | Color rule |
|---|---|
| Draft | Muted gray text on `#f1f3ff`, border muted |
| Published | Primary text on primary-fixed background |
| Selling | Success text on green-tinted background |
| Closed | Text secondary on white/gray, border muted |
| Cancelled | Danger text on error-container background |
| Available | Success text or green fill for seats |
| Locked | Warning text/background or hatched unavailable seat style |
| Sold | Danger or dark navy unavailable style |
| Released | Muted gray or pale blue, not treated as available |
| Pending | Warning text on amber-tinted background |
| Paid | Success text on green-tinted background |
| Expired | Muted text on disabled background |
| Waiting | Warning text/background |
| Admitted | Primary or success text/background |

Seat badges and order/event badges can share colors but may vary shape.

## K. Sidebar and Navigation

Admin sidebar:

- Width: 280px desktop.
- Background: `#f9f9ff` or white.
- Right border: 2px solid border strong.
- Brand block at top with logo and "Admin Portal".
- Nav items: 48px height, icon left, label, 2px border when active.
- Active item: primary background, white text, strong border.
- Inactive item: transparent, text primary, hover background alt.
- Bottom support/settings/logout area separated by 2px border top.
- Logout button: outline or primary depending on placement; do not mix rounded soft style with square editorial items.

Customer header/navbar:

- Height: 72px desktop, 64px mobile.
- White surface, bottom 2px border.
- Brand left, nav center/left, icons and avatar right.
- Active item: primary underline or bordered pill, choose underline for customer.
- Inactive item: text primary, hover primary text.
- Mobile: brand plus menu button; nav collapses into drawer.

Support/settings item:

- Keep as quiet nav item, not a primary CTA.

## L. Seat Map UI

Seat grid:

- Use CSS grid with fixed seat sizes.
- Customer seat: 36px square desktop, 32px tablet, minimum 28px mobile with horizontal scroll if needed.
- Admin seat: 32px square dense mode.
- Gap: 8px.
- Radius: 4px.
- Border: 2px solid strong border.

Seat colors:

- Available: green `#006c49`.
- Selected: primary `#0058be`.
- Locked: muted blue/gray with diagonal hatch or muted fill.
- Sold: dark navy or danger-tinted disabled style.
- Released: pale muted state, not selectable until backend returns Available.

Section colors:

- Use stable accent swatches for zones: primary blue, success green, amber, muted purple/blue-gray. Do not rely on color alone; include section names.

Stage style:

- Dark navy block with white uppercase label.
- 2px border.
- Slight arc acceptable if implemented in CSS, but keep it simple.

Zoom controls:

- Icon buttons in top-right of seat-map panel.
- 40px square, bordered.

Selected seat style:

- Primary fill, white text if text is present.
- Strong visible outline.
- Selected seats also listed in `SeatSummary`.

Locked/sold/unavailable:

- Cursor disabled.
- `aria-disabled`.
- Muted visual and tooltip/title with reason.

## M. Loading, Empty, and Error States

Loading:

- Prefer skeleton blocks for cards/tables.
- Spinner can be used for small inline actions.
- Skeleton uses background alt and muted border.

Empty state:

- Bordered white panel.
- H3 title, short body copy, optional action.
- Use context-specific icon.

Error alert:

- Danger border and error-container background.
- Title plus actionable message.
- Retry button uses outline or primary depending on severity.

Retry button:

- Standard Button component.
- Keep in same alert/panel, not floating.

## N. Modal/Dialog Style

Overlay:

- Fixed full viewport.
- Background `rgba(20, 27, 43, 0.55)`.

Dialog card:

- White surface.
- 2px solid border strong.
- Radius 8px.
- Max width 560px standard, 720px for forms.
- No shadow required; overlay gives separation.

Title:

- H2 or H3 depending on dialog size.
- Header bottom border for structured dialogs.

Content:

- 24px padding.
- Form fields follow common form rules.

Actions:

- Footer top border.
- Right-aligned desktop.
- Full-width stacked mobile.

## O. Implementation Rules For React

- Create reusable components first in Phase 8.
- Do not duplicate button, input, table, badge, sidebar, or modal implementations per page.
- Use centralized CSS variables/global tokens in `src/styles`.
- Do not add a UI library unless explicitly approved.
- Use existing design HTML/CSS as reference only; normalize inconsistent styles.
- Use `docs/design-screen-mapping.md` for route/page mapping.
- Use API client modules rather than direct Axios calls inside pages.
- Use backend status constants from shared constants where practical.
- Use polling for seat map changes in first frontend implementation; do not depend on SSE.
- Treat waiting room and queue-token enforcement as partial until backend rules are clarified.
- Treat dashboard live-user/time-series widgets as derived or placeholder areas unless backend data exists.
- Keep generated design images/files intact.

## Missing Screen and Derived Screen Rules

- If a required frontend flow has no matching original design screen, do not invent a new visual language.
- Create a derived screen using the unified design system.
- Reuse existing shared components, layouts, spacing, typography, colors, buttons, cards, tables, and badges.
- Preserve the business flow from requirements and Swagger.
- Do not guess unclear business behavior.
- If behavior is unclear, document a product question before implementation.
- Derived screens should look like they belong to Ticket Rush, even if no original AI design exists.
- Derived public/customer screens should use `CustomerHeader`, `PublicLayout` or `CustomerLayout`, shared panels, and the customer content max width unless the flow is an auth or queue exception.
- Derived admin screens should use `AdminLayout`, `AdminSidebar`, `AdminPageHeader`, admin tables/forms, and the same density as admin event/order screens.
- Derived utility screens such as unauthorized, not found, loading, empty, and error pages should use shared state components and should not define page-specific decorative systems.

## Detected Design Inconsistencies

- Sidebar style mismatch: analytics, events, and orders use a heavy bordered editorial sidebar; seating config uses a softer rounded sidebar with softer active states.
- Button shape mismatch: most screens use square editorial buttons with strong borders; seating config uses rounded modern buttons and softer forms.
- Card radius mismatch: dashboard/events/orders use sharp cards and panels; seating config uses large rounded panels; auth/register screens use mostly borderless soft inputs.
- Table border mismatch: event/orders tables use strong editorial borders, while other screens use card-like rows or no table treatment.
- Icon style mismatch: admin screens rely on Material Symbols, some screens use line icons, and ticket/auth screens mix icons with text. React implementation should use one icon approach consistently.
- Typography mismatch: most screens use Outfit with heavy headings, but login/register use softer heading hierarchy and mixed Vietnamese labels; waiting room uses very large display typography.
- Spacing mismatch: admin analytics is dense with fixed sidebar and charts; event management is airier; seating config has large soft gutters; customer pages vary between hero-led and form-centered layouts.
- Admin screens do not share one layout language: seating config conflicts most with the admin dashboard/events/orders style.
- Customer/admin differences that are acceptable: admin sidebar vs customer top nav, customer image-led event pages, waiting room amber alert mode, admin denser tables.
- Customer/admin differences that are unacceptable: different button primitives, different input border/radius behavior, different badge/status colors for the same backend statuses, different icon systems per screen.
- Language mismatch: login/register use Vietnamese while many other screens use English. This should be handled as content/i18n choice, not component styling.
- Data mismatch: event listing category/price/popularity filters appear in design but are not directly supported by current Swagger; implement only supported filters first or mark unsupported controls as static/deferred.

## Final Recommendation

Selected unified style direction: flat editorial bold, with shared tokens and component primitives across Admin and Customer.

Prioritize Admin UI consistency first for Phase 8 component planning because admin screens have the largest internal mismatch, especially seating configuration versus the other admin screens. Customer UI is already closer to one language, except auth pages and waiting room.

Phase 8 should implement first:

1. Global CSS variables and reset/base typography.
2. Button, IconButton, Input, Select, Textarea, Card/Panel, Badge/StatusBadge.
3. AdminLayout/AdminSidebar and CustomerHeader.
4. Table/Pagination primitives.
5. Loading/Empty/Error primitives.

Screens that should not be pixel-copied because they conflict with unified style:

- `ticketrush_admin_event_seating_config`: keep workflow and layout, but replace soft rounded/shadowed panels with editorial panels.
- `ticketrush_customer_login`: keep split composition and image intent, but normalize inputs/buttons with auth primitives.
- `ticketrush_customer_register`: keep centered form, but normalize input styling and background geometry.
- `ticketrush_customer_waiting_room`: keep amber/high-alert state, but normalize card, progress, typography, and spacing.
