-- =========================
-- TicketRush Database Schema
-- PostgreSQL
-- =========================

-- =========================
-- 1. USERS / ROLES
-- =========================

create table users (
  id bigint primary key generated always as identity,
  username text not null unique,
  password text not null,
  email text not null unique,
  full_name text,
  date_of_birth date,
  gender text check (gender in ('Male', 'Female', 'Other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table roles (
  id bigint primary key generated always as identity,
  name text not null unique check (name in ('Customer', 'Admin'))
);

create table user_roles (
  user_id bigint not null references users (id) on delete cascade,
  role_id bigint not null references roles (id) on delete cascade,
  primary key (user_id, role_id)
);

insert into roles (name)
values 
  ('Customer'),
  ('Admin');


-- =========================
-- 2. EVENTS
-- =========================

create table events (
  id bigint primary key generated always as identity,
  name text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text not null,
  status text not null check (
    status in (
      'Draft',
      'Published',
      'Selling',
      'Closed',
      'Cancelled'
    )
  ),
  created_by bigint references users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ck_events_time check (end_time > start_time)
);

create table event_images (
  id bigint primary key generated always as identity,
  event_id bigint not null references events (id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now()
);


-- =========================
-- 3. SEAT SECTIONS / SEATS
-- =========================

create table seat_sections (
  id bigint primary key generated always as identity,
  event_id bigint not null references events (id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uq_seat_sections_event_name unique (event_id, name)
);

create table seats (
  id bigint primary key generated always as identity,
  section_id bigint not null references seat_sections (id) on delete cascade,
  row_number int not null check (row_number > 0),
  seat_number int not null check (seat_number > 0),
  status text not null default 'Available' check (
    status in ('Available', 'Locked', 'Sold', 'Released')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uq_seats_position unique (section_id, row_number, seat_number)
);


-- =========================
-- 4. ORDERS / ORDER ITEMS
-- =========================

create table orders (
  id bigint primary key generated always as identity,
  user_id bigint not null references users (id),
  event_id bigint not null references events (id),
  total_amount numeric(10, 2) not null default 0 check (total_amount >= 0),
  status text not null check (
    status in ('Pending', 'Paid', 'Expired', 'Cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id bigint primary key generated always as identity,
  order_id bigint not null references orders (id) on delete cascade,
  seat_id bigint not null references seats (id),
  price_snapshot numeric(10, 2) not null check (price_snapshot > 0),
  created_at timestamptz not null default now(),

  constraint uq_order_items_order_seat unique (order_id, seat_id)
);


-- =========================
-- 5. SEAT LOCKS
-- =========================
-- Dùng để quản lý giữ ghế 10 phút.
-- Một ghế chỉ được có 1 lock Active tại một thời điểm.

create table seat_locks (
  id bigint primary key generated always as identity,
  seat_id bigint not null references seats (id) on delete cascade,
  user_id bigint not null references users (id) on delete cascade,
  locked_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'Active' check (
    status in ('Active', 'Released', 'Paid', 'Expired')
  ),

  constraint ck_seat_locks_expires_at check (expires_at > locked_at)
);

-- Quan trọng cho chống giữ trùng ghế:
-- PostgreSQL partial unique index: chỉ cho phép 1 lock Active trên mỗi seat.
create unique index uq_active_seat_lock
on seat_locks (seat_id)
where status = 'Active';


-- =========================
-- 6. TICKETS
-- =========================
-- Mỗi order_item tương ứng với 1 ghế/vé.
-- User mua 3 ghế => 3 order_items => 3 tickets QR.

create table tickets (
  id bigint primary key generated always as identity,
  order_item_id bigint not null unique references order_items (id) on delete cascade,
  qr_code text not null unique,
  issued_at timestamptz not null default now()
);


-- =========================
-- 7. WAITING QUEUE / VIRTUAL QUEUE
-- =========================

create table waiting_queue (
  id bigint primary key generated always as identity,
  user_id bigint not null references users (id) on delete cascade,
  event_id bigint not null references events (id) on delete cascade,
  "position" int not null check ("position" > 0),
  token text unique,
  status text not null default 'Waiting' check (
    status in ('Waiting', 'Admitted', 'Expired')
  ),
  created_at timestamptz not null default now(),
  admitted_at timestamptz,
  expired_at timestamptz,

  constraint uq_waiting_queue_user_event unique (user_id, event_id)
);


-- =========================
-- 8. AUDIT LOGS
-- =========================

create table audit_logs (
  id bigint primary key generated always as identity,
  user_id bigint references users (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id bigint,
  metadata jsonb,
  created_at timestamptz not null default now()
);


-- =========================
-- 9. INDEXES FOR PERFORMANCE
-- =========================

-- Users
create index idx_users_email on users (email);

-- Events
create index idx_events_status on events (status);
create index idx_events_start_time on events (start_time);
create index idx_events_created_by on events (created_by);

-- Seat sections
create index idx_seat_sections_event_id on seat_sections (event_id);

-- Seats
create index idx_seats_section_id on seats (section_id);
create index idx_seats_status on seats (status);
create index idx_seats_section_status on seats (section_id, status);

-- Seat locks
create index idx_seat_locks_user_id on seat_locks (user_id);
create index idx_seat_locks_status on seat_locks (status);
create index idx_seat_locks_expires_at on seat_locks (expires_at);
create index idx_seat_locks_active_expired
on seat_locks (expires_at)
where status = 'Active';

-- Orders
create index idx_orders_user_id on orders (user_id);
create index idx_orders_event_id on orders (event_id);
create index idx_orders_status on orders (status);
create index idx_orders_event_status on orders (event_id, status);

-- Order items
create index idx_order_items_order_id on order_items (order_id);
create index idx_order_items_seat_id on order_items (seat_id);

-- Tickets
create index idx_tickets_order_item_id on tickets (order_item_id);

-- Waiting queue
create index idx_waiting_queue_event_id on waiting_queue (event_id);
create index idx_waiting_queue_status on waiting_queue (status);
create index idx_waiting_queue_event_status_position
on waiting_queue (event_id, status, "position");

-- Audit logs
create index idx_audit_logs_user_id on audit_logs (user_id);
create index idx_audit_logs_created_at on audit_logs (created_at);
