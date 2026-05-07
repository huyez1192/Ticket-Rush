export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  EVENTS: "/events",
  MY_TICKETS: "/my-tickets",
  UNAUTHORIZED: "/unauthorized",
  NOT_FOUND: "/not-found",
  ADMIN_LOGIN: "/admin/login",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_EVENTS: "/admin/events",
};

export function eventDetail(eventId) {
  return `/events/${eventId}`;
}

export function eventSeats(eventId) {
  return `/events/${eventId}/seats`;
}

export function checkout(orderId) {
  return `/orders/${orderId}/checkout`;
}

export function checkoutSuccess(orderId) {
  return orderId ? `/checkout/success?orderId=${encodeURIComponent(orderId)}` : "/checkout/success";
}

export function checkoutFailure(orderId) {
  return orderId ? `/checkout/failure?orderId=${encodeURIComponent(orderId)}` : "/checkout/failure";
}

export function ticketDetail(ticketId) {
  return `/my-tickets/${ticketId}`;
}

export function adminDashboard() {
  return "/admin/dashboard";
}

export function adminEvents() {
  return "/admin/events";
}

export function adminEventDetail(eventId) {
  return `/admin/events/${eventId}`;
}

export function adminEventSeating(eventId) {
  return `/admin/events/${eventId}/seating`;
}

export function adminOrders() {
  return "/admin/orders";
}

export function adminTicketVerify() {
  return "/admin/tickets/verify";
}
