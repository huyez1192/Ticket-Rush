import { getCollectionItems, getEntityId, getPagination, normalizeEvent } from "./eventMappers";
import { normalizeSeat } from "./seatMappers";

export function normalizeOrderItem(item = {}) {
  const seat = item.seat ? normalizeSeat(item.seat) : null;

  return {
    ...item,
    id: getEntityId(item),
    orderId: item.orderId || "",
    seatId: item.seatId || seat?.id || "",
    seat,
    priceSnapshot: Number.isFinite(Number(item.priceSnapshot)) ? Number(item.priceSnapshot) : seat?.price || 0,
    createdAt: item.createdAt,
    ticket: item.ticket || null,
  };
}

export function normalizeOrder(order = {}) {
  const items = getCollectionItems(order.items).map(normalizeOrderItem);

  const serverNow = order.serverNow || null;

  return {
    ...order,
    id: getEntityId(order),
    userId: order.userId || "",
    eventId: order.eventId || order.event?.id || "",
    event: order.event ? normalizeEvent(order.event) : null,
    status: order.status || "Pending",
    items,
    totalAmount: Number.isFinite(Number(order.totalAmount))
      ? Number(order.totalAmount)
      : items.reduce((sum, item) => sum + Number(item.priceSnapshot || 0), 0),
    lockExpiresAt: order.lockExpiresAt || order.expiresAt || null,
    expiresAt: order.expiresAt || order.lockExpiresAt || null,
    serverNow,
    serverNowReceivedAt: serverNow ? Date.now() : null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function normalizeOrdersPayload(payload = {}) {
  return {
    items: getCollectionItems(payload).map(normalizeOrder),
    pagination: getPagination(payload),
  };
}

export function getOrderSeatIds(order) {
  return normalizeOrder(order).items.map((item) => item.seatId).filter(Boolean);
}

export function isOrderPayable(order) {
  return normalizeOrder(order).status === "Pending";
}
