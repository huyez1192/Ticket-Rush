import { Order, OrderItem } from "./order.model.js";

const ITEM_POPULATE = {
  path: "seatId",
  populate: { path: "sectionId", select: "eventId name description price createdAt updatedAt" }
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
