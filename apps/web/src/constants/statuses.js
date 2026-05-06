export const EVENT_STATUSES = ["Draft", "Published", "Selling", "Closed", "Cancelled"];
export const SEAT_STATUSES = ["Available", "Locked", "Sold", "Released"];
export const ORDER_STATUSES = ["Pending", "Paid", "Expired", "Cancelled"];
export const QUEUE_STATUSES = ["Waiting", "Admitted", "Expired"];
export const TICKET_STATUSES = ["Paid"];

export const ALL_STATUSES = [
  ...EVENT_STATUSES,
  ...SEAT_STATUSES,
  ...ORDER_STATUSES,
  ...QUEUE_STATUSES,
  ...TICKET_STATUSES,
];
