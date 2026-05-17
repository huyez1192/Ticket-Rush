import { getCollectionItems, getEntityId, getPagination, normalizeEvent } from "./eventMappers";
import { normalizeSeat } from "./seatMappers";

export function normalizeTicket(ticket = {}) {
  return {
    ...ticket,
    id: getEntityId(ticket),
    orderItemId: ticket.orderItemId || "",
    orderId: ticket.orderId || ticket.order?.id || "",
    qrCode: ticket.qrCode || ticket.token || "",
    event: ticket.event ? normalizeEvent(ticket.event) : null,
    seat: ticket.seat ? normalizeSeat(ticket.seat) : null,
    order: ticket.order || null,
    customer: ticket.customer || null,
    issuedAt: ticket.issuedAt || ticket.createdAt,
    verifiedAt: ticket.verifiedAt || null,
    checkedInAt: ticket.checkedInAt || ticket.verifiedAt || null,
    status: ticket.status || "Issued",
  };
}

export function normalizeTicketsPayload(payload = {}) {
  return {
    items: getCollectionItems(payload).map(normalizeTicket),
    pagination: getPagination(payload),
  };
}

export function normalizeTicketQr(payload = {}) {
  return {
    ticketId: payload.ticketId || payload.id || "",
    qrCode: payload.qrCode || payload.token || payload.payload || "",
    status: payload.status || "Issued",
    verifiedAt: payload.verifiedAt || null,
    checkedInAt: payload.checkedInAt || payload.verifiedAt || null,
    raw: payload,
  };
}
