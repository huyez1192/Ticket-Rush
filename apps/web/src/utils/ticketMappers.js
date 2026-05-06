import { getCollectionItems, getEntityId, getPagination, normalizeEvent } from "./eventMappers";
import { normalizeSeat } from "./seatMappers";

export function normalizeTicket(ticket = {}) {
  return {
    ...ticket,
    id: getEntityId(ticket),
    orderItemId: ticket.orderItemId || "",
    qrCode: ticket.qrCode || ticket.token || "",
    event: ticket.event ? normalizeEvent(ticket.event) : null,
    seat: ticket.seat ? normalizeSeat(ticket.seat) : null,
    issuedAt: ticket.issuedAt || ticket.createdAt,
    status: ticket.status || "Paid",
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
    raw: payload,
  };
}
