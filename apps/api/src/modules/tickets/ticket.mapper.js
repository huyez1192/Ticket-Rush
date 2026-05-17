import { mapEventToDto } from "../events/event.mapper.js";
import { mapSeatToDto } from "../seats/seat.mapper.js";
import { TICKET_STATUSES } from "../../common/constants/index.js";

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

  const customer = value.userId && typeof value.userId === "object" ? value.userId : null;
  const order = value.orderId && typeof value.orderId === "object" ? value.orderId : null;
  const status = value.status || TICKET_STATUSES.ISSUED;

  return {
    id: value._id?.toString(),
    orderItemId: value.orderItemId?._id?.toString?.() || value.orderItemId?.toString?.(),
    orderId: value.orderId?._id?.toString?.() || value.orderId?.toString?.(),
    qrCode: value.qrCode,
    status,
    event: value.eventId && typeof value.eventId === "object" ? mapEventToDto(value.eventId) : undefined,
    seat: value.seatId && typeof value.seatId === "object" ? mapSeatToDto(value.seatId) : undefined,
    customer: customer
      ? {
          id: customer._id?.toString(),
          username: customer.username,
          email: customer.email,
          fullName: customer.fullName,
          avatarUrl: customer.avatarUrl
        }
      : undefined,
    order: order
      ? {
          id: order._id?.toString(),
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        }
      : undefined,
    issuedAt: value.issuedAt,
    verifiedAt: value.verifiedAt || null,
    checkedInAt: value.checkedInAt || value.verifiedAt || null,
    verifiedByAdminId: value.verifiedByAdminId?._id?.toString?.() || value.verifiedByAdminId?.toString?.() || null
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
