import mongoose from "mongoose";
import { ORDER_STATUSES, QUEUE_STATUSES, ROLES, SEAT_STATUSES } from "../../common/constants/index.js";
import { Order } from "../bookings/order.model.js";
import { Event } from "../events/event.model.js";
import { Seat } from "../seats/seat.model.js";
import { Ticket } from "../tickets/ticket.model.js";
import { Role } from "../users/role.model.js";
import { User } from "../users/user.model.js";
import { WaitingQueueEntry } from "../waiting-queue/waitingQueue.model.js";

async function sumPaidOrderRevenue(match) {
  const [result] = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        paidOrders: { $sum: 1 }
      }
    }
  ]);

  return {
    totalRevenue: result?.totalRevenue || 0,
    paidOrders: result?.paidOrders || 0
  };
}

async function countSeatsByStatus(match = {}) {
  const rows = await Seat.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  return rows.reduce((accumulator, row) => {
    accumulator[row._id] = row.count;
    return accumulator;
  }, {});
}

async function getRoleCount(roleName) {
  const role = await Role.findOne({ name: roleName }).lean();

  if (!role) {
    return 0;
  }

  return User.countDocuments({ roles: role._id });
}

export function findDashboardEventById(eventId) {
  return Event.findById(eventId).lean();
}

export async function getOverviewStats() {
  const seatCountsPromise = countSeatsByStatus();
  const paidRevenuePromise = sumPaidOrderRevenue({ status: ORDER_STATUSES.PAID });

  const [
    totalEvents,
    totalUsers,
    totalCustomers,
    totalAdmins,
    totalOrders,
    soldTickets,
    waitingQueueEntries,
    seatCounts,
    paidRevenue
  ] = await Promise.all([
    Event.countDocuments({}),
    User.countDocuments({}),
    getRoleCount(ROLES.CUSTOMER),
    getRoleCount(ROLES.ADMIN),
    Order.countDocuments({}),
    Ticket.countDocuments({}),
    WaitingQueueEntry.countDocuments({ status: QUEUE_STATUSES.WAITING }),
    seatCountsPromise,
    paidRevenuePromise
  ]);

  return {
    totalEvents,
    totalUsers,
    totalCustomers,
    totalAdmins,
    totalOrders,
    paidOrders: paidRevenue.paidOrders,
    soldTickets,
    totalRevenue: paidRevenue.totalRevenue,
    availableSeats: seatCounts[SEAT_STATUSES.AVAILABLE] || 0,
    lockedSeats: seatCounts[SEAT_STATUSES.LOCKED] || 0,
    soldSeats: seatCounts[SEAT_STATUSES.SOLD] || 0,
    waitingQueueEntries
  };
}

export async function getEventRevenueStats(eventId, filters = {}) {
  const orderMatch = {
    eventId: new mongoose.Types.ObjectId(eventId),
    status: ORDER_STATUSES.PAID
  };

  if (filters.from || filters.to) {
    orderMatch.createdAt = {};

    if (filters.from) {
      orderMatch.createdAt.$gte = filters.from;
    }

    if (filters.to) {
      orderMatch.createdAt.$lte = filters.to;
    }
  }

  const paidOrderIdsPromise = Order.find(orderMatch).select("_id").lean();
  const paidRevenuePromise = sumPaidOrderRevenue(orderMatch);
  const [paidOrderIds, paidRevenue] = await Promise.all([paidOrderIdsPromise, paidRevenuePromise]);

  const soldTickets =
    paidOrderIds.length === 0
      ? 0
      : await Ticket.countDocuments({
          eventId,
          orderId: { $in: paidOrderIds.map((order) => order._id) }
        });

  return {
    eventId,
    totalRevenue: paidRevenue.totalRevenue,
    paidOrders: paidRevenue.paidOrders,
    soldTickets
  };
}

export async function getEventSeatOccupancyStats(eventId) {
  const seatCounts = await countSeatsByStatus({ eventId: new mongoose.Types.ObjectId(eventId) });
  const available = seatCounts[SEAT_STATUSES.AVAILABLE] || 0;
  const locked = seatCounts[SEAT_STATUSES.LOCKED] || 0;
  const sold = seatCounts[SEAT_STATUSES.SOLD] || 0;
  const released = seatCounts[SEAT_STATUSES.RELEASED] || 0;
  const total = available + locked + sold + released;

  return {
    eventId,
    available,
    locked,
    sold,
    released,
    occupancyRate: total === 0 ? 0 : Math.round((sold / total) * 10000) / 100
  };
}

export async function getPaidCustomerUsersForEvent(eventId) {
  const paidOrders = await Order.find({
    eventId,
    status: ORDER_STATUSES.PAID
  })
    .select("userId")
    .lean();

  const userIds = [...new Set(paidOrders.map((order) => order.userId?.toString()).filter(Boolean))];

  if (userIds.length === 0) {
    return [];
  }

  return User.find({ _id: { $in: userIds } }).select("gender dateOfBirth").lean();
}

