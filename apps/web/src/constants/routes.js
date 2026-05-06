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
