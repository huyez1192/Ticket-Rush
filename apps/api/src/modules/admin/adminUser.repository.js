import mongoose from "mongoose";
import { ORDER_STATUSES } from "../../common/constants/index.js";
import { Order, OrderItem } from "../bookings/order.model.js";
import { Ticket } from "../tickets/ticket.model.js";
import { Role } from "../users/role.model.js";
import { User } from "../users/user.model.js";

const USER_POPULATE_ROLES = { path: "roles", select: "name" };

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildUserFilter(filters = {}) {
  const query = {};

  if (filters.keyword) {
    const pattern = new RegExp(escapeRegExp(filters.keyword), "i");
    query.$or = [{ username: pattern }, { email: pattern }, { fullName: pattern }];
  }

  if (filters.roleId) {
    query.roles = filters.roleId;
  }

  return query;
}

export async function findAdminUsers(filters, pagination) {
  const query = buildUserFilter(filters);
  const skip = (pagination.page - 1) * pagination.limit;

  const [items, total] = await Promise.all([
    User.find(query)
      .populate(USER_POPULATE_ROLES)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(pagination.limit)
      .lean(),
    User.countDocuments(query)
  ]);

  return { items, total };
}

export function findAdminUserById(userId) {
  return User.findById(userId).populate(USER_POPULATE_ROLES).lean();
}

export function deleteUserById(userId) {
  return User.findByIdAndDelete(userId).lean();
}

export function updateUserRolesById(userId, roleIds) {
  return User.findByIdAndUpdate(userId, { roles: roleIds }, { new: true, runValidators: true })
    .populate(USER_POPULATE_ROLES)
    .lean();
}

export function findRoleByNameOrId(role) {
  if (mongoose.Types.ObjectId.isValid(role)) {
    return Role.findById(role).lean();
  }

  return Role.findOne({ name: role }).lean();
}

export function findRolesByIds(roleIds) {
  return Role.find({ _id: { $in: roleIds } }).lean();
}

export function countUsersByRoleId(roleId) {
  return User.countDocuments({ roles: roleId });
}

export function countOrdersByUserId(userId) {
  return Order.countDocuments({ userId });
}

export function countTicketsByUserId(userId) {
  return Ticket.countDocuments({ userId });
}

export async function countBlockingOrderItemsByUserId(userId) {
  const orders = await Order.find({
    userId,
    status: { $in: [ORDER_STATUSES.PENDING, ORDER_STATUSES.PAID] }
  })
    .select("_id")
    .lean();

  if (orders.length === 0) {
    return 0;
  }

  return OrderItem.countDocuments({ orderId: { $in: orders.map((order) => order._id) } });
}

