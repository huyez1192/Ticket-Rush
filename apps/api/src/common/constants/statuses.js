export const GENDERS = Object.freeze({
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other"
});

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

export const SECTION_SEAT_SHAPES = Object.freeze({
  SQUARE: "Square",
  CIRCLE: "Circle",
  ROUNDED_SQUARE: "RoundedSquare",
  DIAMOND: "Diamond",
  HEXAGON: "Hexagon",
  PILL: "Pill"
});

export const ORDER_STATUSES = Object.freeze({
  PENDING: "Pending",
  PAID: "Paid",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled"
});

export const SEAT_LOCK_STATUSES = Object.freeze({
  ACTIVE: "Active",
  RELEASED: "Released",
  PAID: "Paid",
  EXPIRED: "Expired"
});

export const QUEUE_STATUSES = Object.freeze({
  WAITING: "Waiting",
  ADMITTED: "Admitted",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled"
});

export const TICKET_STATUSES = Object.freeze({
  ISSUED: "Issued",
  VALID: "Valid",
  USED: "Used",
  CHECKED_IN: "CheckedIn",
  CANCELLED: "Cancelled",
  REVOKED: "Revoked"
});

export const GENDER_VALUES = Object.freeze(Object.values(GENDERS));
export const EVENT_STATUS_VALUES = Object.freeze(Object.values(EVENT_STATUSES));
export const SEAT_STATUS_VALUES = Object.freeze(Object.values(SEAT_STATUSES));
export const SECTION_SEAT_SHAPE_VALUES = Object.freeze(Object.values(SECTION_SEAT_SHAPES));
export const ORDER_STATUS_VALUES = Object.freeze(Object.values(ORDER_STATUSES));
export const SEAT_LOCK_STATUS_VALUES = Object.freeze(Object.values(SEAT_LOCK_STATUSES));
export const QUEUE_STATUS_VALUES = Object.freeze(Object.values(QUEUE_STATUSES));
export const TICKET_STATUS_VALUES = Object.freeze(Object.values(TICKET_STATUSES));
