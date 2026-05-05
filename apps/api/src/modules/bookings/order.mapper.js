import { mapTicketToDto } from "../tickets/ticket.mapper.js";
import { mapSeatToDto } from "../seats/seat.mapper.js";

function toPlainObject(document) {
  if (!document) {
    return null;
  }

  return typeof document.toObject === "function" ? document.toObject() : document;
}

export function mapOrderItemToDto(item) {
  const value = toPlainObject(item);

  if (!value) {
    return null;
  }

  return {
    id: value._id?.toString(),
    orderId: value.orderId?._id?.toString?.() || value.orderId?.toString?.(),
    seatId: value.seatId?._id?.toString?.() || value.seatId?.toString?.(),
    seat: value.seatId && typeof value.seatId === "object" ? mapSeatToDto(value.seatId) : undefined,
    priceSnapshot: value.priceSnapshot,
    createdAt: value.createdAt,
    ticket: value.ticket ? mapTicketToDto(value.ticket) : undefined
  };
}

export function mapOrderToDto(order, items = []) {
  const value = toPlainObject(order);

  if (!value) {
    return null;
  }

  return {
    id: value._id?.toString(),
    userId: value.userId?._id?.toString?.() || value.userId?.toString?.(),
    eventId: value.eventId?._id?.toString?.() || value.eventId?.toString?.(),
    status: value.status,
    items: items.map((item) => mapOrderItemToDto(item)).filter(Boolean),
    totalAmount: value.totalAmount,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
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
