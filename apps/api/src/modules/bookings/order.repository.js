import { ORDER_STATUSES } from "../../common/constants/index.js";
import { Order, OrderItem } from "./order.model.js";

const ITEM_POPULATE = {
  path: "seatId",
  populate: {
    path: "sectionId",
    select: "eventId name description price color displayOrder defaultSeatWidth defaultSeatHeight createdAt updatedAt"
  }
};

export async function createOrder(orderData, session) {
  const [order] = await Order.create([orderData], { session });
  return order;
}

export function updateOrderById(orderId, update, session) {
  return Order.findByIdAndUpdate(orderId, update, { new: true }).session(session || null);
}

export async function createOrderItems(items, session) {
  return OrderItem.insertMany(items, { session, ordered: true });
}

export function findOrderById(orderId, session) {
  return Order.findById(orderId).session(session || null);
}

export function findOrderByIdForUser(orderId, userId) {
  return Order.findOne({ _id: orderId, userId }).lean();
}

export async function findOrdersByUser(userId, filters, pagination) {
  const query = { userId };

  if (filters.status) {
    query.status = filters.status;
  }

  const skip = (pagination.page - 1) * pagination.limit;
  const [items, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(pagination.limit).lean(),
    Order.countDocuments(query)
  ]);

  return { items, total };
}

export async function findAdminOrders(filters, pagination) {
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.eventId) {
    query.eventId = filters.eventId;
  }

  const skip = (pagination.page - 1) * pagination.limit;
  const [items, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(pagination.limit).lean(),
    Order.countDocuments(query)
  ]);

  return { items, total };
}

export function findOrderItemsByOrderId(orderId, session) {
  return OrderItem.find({ orderId }).populate(ITEM_POPULATE).sort({ createdAt: 1, _id: 1 }).session(session || null);
}

export function countOrdersByEventId(eventId) {
  return Order.countDocuments({ eventId });
}

export function countOrderItemsBySeatIds(seatIds) {
  return OrderItem.countDocuments({ seatId: { $in: seatIds } });
}

export async function findBlockingOrderItemsForSeats(seatIds, session) {
  const blockingOrders = await Order.find({
    status: { $in: [ORDER_STATUSES.PENDING, ORDER_STATUSES.PAID] }
  })
    .select("_id")
    .session(session || null);

  if (blockingOrders.length === 0) {
    return [];
  }

  return OrderItem.find({
    seatId: { $in: seatIds },
    orderId: { $in: blockingOrders.map((order) => order._id) }
  })
    .select("_id orderId seatId")
    .session(session || null);
}
