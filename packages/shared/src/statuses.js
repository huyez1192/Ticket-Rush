export const EVENT_STATUSES = Object.freeze({
  DRAFT: "Draft",
  PUBLISHED: "Published",
  SELLING: "Selling",
  CLOSED: "Closed",
  CANCELLED: "Cancelled"
});

export const SEAT_STATUSES = Object.freeze({
  AVAILABLE: "Available",
  LOCKED: "Locked",
  SOLD: "Sold",
  RELEASED: "Released"
});

export const ORDER_STATUSES = Object.freeze({
  PENDING: "Pending",
  PAID: "Paid",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled"
});

export const QUEUE_STATUSES = Object.freeze({
  WAITING: "Waiting",
  ADMITTED: "Admitted",
  EXPIRED: "Expired"
});

export const SEAT_LOCK_STATUSES = Object.freeze({
  ACTIVE: "Active",
  RELEASED: "Released",
  PAID: "Paid",
  EXPIRED: "Expired"
});
