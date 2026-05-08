import { ORDER_STATUSES } from "../constants/statuses";
import { getCollectionItems, getEntityId, getPagination, normalizeEvent } from "./eventMappers";
import { formatCurrency } from "./formatCurrency";
import { formatDate } from "./formatDate";
import { normalizeSeat } from "./seatMappers";
import { normalizeAdminTicket } from "./adminTicketMappers";

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function normalizeCustomer(order = {}) {
  const customer = firstDefined(order.customer, order.user, order.userId);

  if (customer && typeof customer === "object") {
    const name = firstDefined(customer.fullName, customer.username, customer.email, customer.name);
    return {
      id: getEntityId(customer),
      name: name || "Customer",
      username: customer.username || "",
      email: customer.email || "",
      phone: customer.phone || "",
    };
  }

  return {
    id: String(firstDefined(order.userId, "") || ""),
    name: firstDefined(order.customerName, order.customerEmail, order.userId, "Customer unavailable"),
    username: "",
    email: order.customerEmail || "",
    phone: "",
  };
}

function normalizeOrderEvent(order = {}) {
  const event = firstDefined(order.event, order.eventDetails);

  if (event && typeof event === "object") {
    return normalizeEvent(event);
  }

  return {
    id: String(firstDefined(order.eventId, "") || ""),
    name: order.eventName || "Event unavailable",
    location: order.eventLocation || "",
    startTime: order.eventStartTime || "",
    endTime: order.eventEndTime || "",
  };
}

export function normalizeAdminOrderItem(item = {}) {
  const seatSection = item.seat?.sectionId && typeof item.seat.sectionId === "object" ? item.seat.sectionId : null;
  const seat = item.seat ? normalizeSeat(item.seat, seatSection) : null;
  const ticket = item.ticket ? normalizeAdminTicket(item.ticket) : null;
  const section = item.section || item.seatSection || seatSection || null;
  const sectionName = section?.name || section?.code || item.sectionName || "";

  return {
    ...item,
    id: String(getEntityId(item) || ""),
    orderId: String(firstDefined(item.orderId, "") || ""),
    seatId: String(firstDefined(item.seatId, seat?.id, "") || ""),
    seat,
    ticket,
    sectionName,
    seatLabel: firstDefined(seat?.code, item.seatCode, item.seatLabel, item.seatId, "Seat unavailable"),
    rowNumber: firstDefined(seat?.rowNumber, item.rowNumber, ""),
    seatNumber: firstDefined(seat?.seatNumber, item.seatNumber, ""),
    priceSnapshot: Number.isFinite(Number(item.priceSnapshot)) ? Number(item.priceSnapshot) : Number(seat?.price || 0),
    createdAt: item.createdAt || "",
  };
}

export function normalizeAdminOrder(order = {}) {
  const items = getCollectionItems(order.items).map(normalizeAdminOrderItem);
  const tickets = items.map((item) => item.ticket).filter(Boolean);
  const totalAmount = Number.isFinite(Number(order.totalAmount))
    ? Number(order.totalAmount)
    : items.reduce((sum, item) => sum + Number(item.priceSnapshot || 0), 0);
  const status = ORDER_STATUSES.includes(order.status) ? order.status : order.status || "Pending";

  return {
    ...order,
    id: String(getEntityId(order) || ""),
    code: order.code || order.orderCode || (getEntityId(order) ? `#${String(getEntityId(order)).slice(-8).toUpperCase()}` : "Order"),
    customer: normalizeCustomer(order),
    event: normalizeOrderEvent(order),
    userId: String(firstDefined(order.userId, order.user?._id, order.customer?._id, "") || ""),
    eventId: String(firstDefined(order.eventId, order.event?.id, order.event?._id, "") || ""),
    status,
    paymentStatus: order.paymentStatus || status,
    items,
    tickets,
    totalAmount,
    totalLabel: formatCurrency(totalAmount),
    createdAt: order.createdAt || "",
    createdAtLabel: formatDate(order.createdAt, { dateStyle: "medium", timeStyle: "short" }) || "Unknown",
    updatedAt: order.updatedAt || "",
    updatedAtLabel: formatDate(order.updatedAt, { dateStyle: "medium", timeStyle: "short" }) || "Unknown",
  };
}

export function normalizeAdminOrdersPayload(payload = {}) {
  return {
    items: getCollectionItems(payload).map(normalizeAdminOrder),
    pagination: getPagination(payload),
  };
}

export function buildAdminOrderQuery(values = {}) {
  return Object.fromEntries(
    Object.entries({
      page: values.page || 1,
      limit: values.limit || 20,
      status: values.status || undefined,
      eventId: values.eventId?.trim() || undefined,
    }).filter(([, value]) => value !== undefined && value !== ""),
  );
}
