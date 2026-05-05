import { mapEventToDto } from "../events/event.mapper.js";
import { mapSeatToDto } from "../seats/seat.mapper.js";

function toPlainObject(document) {
  if (!document) {
    return null;
  }

  return typeof document.toObject === "function" ? document.toObject() : document;
}

export function mapTicketToDto(ticket) {
  const value = toPlainObject(ticket);

  if (!value) {
    return null;
  }

  return {
    id: value._id?.toString(),
    orderItemId: value.orderItemId?._id?.toString?.() || value.orderItemId?.toString?.(),
    qrCode: value.qrCode,
    event: value.eventId && typeof value.eventId === "object" ? mapEventToDto(value.eventId) : undefined,
    seat: value.seatId && typeof value.seatId === "object" ? mapSeatToDto(value.seatId) : undefined,
    issuedAt: value.issuedAt
  };
}

export function mapPagination({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 0
  };
}
