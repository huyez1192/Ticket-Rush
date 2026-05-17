import { getEntityId, normalizeEvent } from "./eventMappers";
import { formatDate } from "./formatDate";
import { normalizeSeat } from "./seatMappers";

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

export function normalizeAdminTicket(ticket = {}) {
  const event = ticket.event ? normalizeEvent(ticket.event) : null;
  const seatSection = ticket.seat?.sectionId && typeof ticket.seat.sectionId === "object" ? ticket.seat.sectionId : null;
  const seat = ticket.seat ? normalizeSeat(ticket.seat, seatSection) : null;

  return {
    ...ticket,
    id: String(getEntityId(ticket) || ""),
    code: firstDefined(ticket.ticketCode, ticket.code, ticket.qrCode, ticket.id, ticket._id, "Ticket"),
    orderItemId: String(firstDefined(ticket.orderItemId, "") || ""),
    qrCode: firstDefined(ticket.qrCode, ticket.qrToken, ticket.token, ticket.qrData, ""),
    event,
    seat,
    status: firstDefined(ticket.status, "Issued"),
    issuedAt: ticket.issuedAt || ticket.createdAt || "",
    issuedAtLabel: formatDate(ticket.issuedAt || ticket.createdAt, { dateStyle: "medium", timeStyle: "short" }) || "Unknown",
    checkedInAt: ticket.checkedInAt || ticket.verifiedAt || "",
    checkedInAtLabel: formatDate(ticket.checkedInAt || ticket.verifiedAt, { dateStyle: "medium", timeStyle: "short" }) || "Not used",
    verifiedAt: ticket.verifiedAt || ticket.checkedInAt || "",
    customer: ticket.customer || null,
    order: ticket.order || null,
  };
}

export function normalizeTicketVerificationResponse(payload = {}) {
  const ticket = payload.ticket ? normalizeAdminTicket(payload.ticket) : null;
  const valid = Boolean(payload.valid);
  const message =
    payload.message ||
    (valid ? "Ticket verified successfully." : "Ticket was not found or the QR token is invalid.");

  return {
    valid,
    message,
    ticket,
    reason: payload.reason || "",
    checkedInAt: payload.checkedInAt || payload.verifiedAt || ticket?.checkedInAt || "",
    checkedInAtLabel:
      formatDate(payload.checkedInAt || payload.verifiedAt || ticket?.checkedInAt, { dateStyle: "medium", timeStyle: "short" }) ||
      ticket?.checkedInAtLabel ||
      "Not used",
    rawStatus: payload.status || "",
    raw: payload,
  };
}
