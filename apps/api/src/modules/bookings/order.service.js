import crypto from "node:crypto";
import mongoose from "mongoose";
import {
  EVENT_STATUSES,
  ORDER_STATUSES,
  SEAT_LOCK_STATUSES,
  SEAT_STATUSES
} from "../../common/constants/index.js";
import { AppError } from "../../common/errors/AppError.js";
import { runWithOptionalTransaction } from "../../common/utils/runWithOptionalTransaction.js";
import { findEventById } from "../events/event.repository.js";
import { findActiveSeatLocksForUserSeats, updateLocksByIds } from "../seats/seatLock.repository.js";
import { createTicket } from "../tickets/ticket.repository.js";
import { mapOrderToDto, mapPagination } from "./order.mapper.js";
import {
  createOrder,
  createOrderItems,
  deleteOrderById,
  deleteOrderItemsByOrderId,
  findBlockingOrderItemsForSeats,
  findAdminOrders,
  findOrderById,
  findOrderByIdForUser,
  findOrderItemsByOrderId,
  findOrdersByUser,
  updateOrderById,
  updateOrderItemsByOrderId
} from "./order.repository.js";

function assertUniqueSeatIds(seatIds) {
  const uniqueSeatIds = new Set(seatIds.map((seatId) => seatId.toString()));

  if (uniqueSeatIds.size !== seatIds.length) {
    throw new AppError("Duplicate seats are not allowed in the same order.", 400);
  }
}

function isDuplicateKeyError(error) {
  return error?.code === 11000 || error?.writeErrors?.some((writeError) => writeError?.code === 11000);
}

function buildOrderSeatConflictError() {
  return new AppError("One or more selected seats already belong to an existing pending or paid order.", 409);
}

async function assertSellingEvent(eventId) {
  const event = await findEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  if (event.status !== EVENT_STATUSES.SELLING) {
    throw new AppError("Event is not open for selling.", 400);
  }

  return event;
}

async function mapOrderWithItems(order) {
  const items = await findOrderItemsByOrderId(order._id);
  const tickets = await mongoose.model("Ticket").find({ orderId: order._id }).lean();
  const ticketsByOrderItemId = new Map(tickets.map((ticket) => [ticket.orderItemId.toString(), ticket]));

  const mappedItems = items.map((item) => {
    const value = typeof item.toObject === "function" ? item.toObject() : item;
    value.ticket = ticketsByOrderItemId.get(value._id.toString());
    return value;
  });

  return mapOrderToDto(order, mappedItems);
}

export async function listMyOrders(userId, query) {
  const pagination = { page: query.page, limit: query.limit };
  const { items, total } = await findOrdersByUser(userId, query, pagination);
  const mappedItems = await Promise.all(items.map((order) => mapOrderWithItems(order)));

  return {
    items: mappedItems,
    pagination: mapPagination({ ...pagination, total })
  };
}

export async function getMyOrder(orderId, userId) {
  const order = await findOrderByIdForUser(orderId, userId);

  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  return mapOrderWithItems(order);
}

export async function createPendingOrder(userId, payload) {
  await assertSellingEvent(payload.eventId);
  assertUniqueSeatIds(payload.seatIds);

  let createdOrderId;

  await runWithOptionalTransaction(async (session) => {
    let orderIdForCleanup;

    const seats = await mongoose
      .model("Seat")
      .find({ _id: { $in: payload.seatIds }, eventId: payload.eventId })
      .populate({
        path: "sectionId",
        select: "eventId name description price color displayOrder defaultSeatWidth defaultSeatHeight createdAt updatedAt"
      })
      .session(session);

    if (seats.length !== payload.seatIds.length) {
      throw new AppError("One or more seats were not found for this event.", 404);
    }

    if (seats.some((seat) => seat.status !== SEAT_STATUSES.LOCKED)) {
      throw new AppError("All selected seats must still be locked before creating an order.", 409);
    }

    const locks = await findActiveSeatLocksForUserSeats(userId, payload.seatIds, session);
    const now = new Date();
    const validLocks = locks.filter((lock) => lock.expiresAt > now);

    if (validLocks.length !== payload.seatIds.length) {
      throw new AppError("All selected seats must be actively locked by the current customer.", 409);
    }

    const blockingOrderItems = await findBlockingOrderItemsForSeats(payload.seatIds, session);

    if (blockingOrderItems.length > 0) {
      throw new AppError("One or more selected seats already belong to an existing pending or paid order.", 409);
    }

    const totalAmount = seats.reduce((sum, seat) => sum + Number(seat.sectionId?.price || 0), 0);
    try {
      const order = await createOrder(
        {
          userId,
          eventId: payload.eventId,
          totalAmount,
          status: ORDER_STATUSES.PENDING
        },
        session
      );
      orderIdForCleanup = order._id;
      createdOrderId = order._id;

      await createOrderItems(
        seats.map((seat) => ({
          orderId: order._id,
          seatId: seat._id,
          status: ORDER_STATUSES.PENDING,
          priceSnapshot: Number(seat.sectionId.price)
        })),
        session
      );
    } catch (error) {
      if (!session && orderIdForCleanup) {
        await deleteOrderItemsByOrderId(orderIdForCleanup, null);
        await deleteOrderById(orderIdForCleanup, null);
      }

      if (isDuplicateKeyError(error)) {
        throw buildOrderSeatConflictError();
      }

      throw error;
    }
  });

  const order = await findOrderById(createdOrderId);
  return mapOrderWithItems(order);
}

export async function cancelMyPendingOrder(orderId, userId) {
  await runWithOptionalTransaction(async (session) => {
    const order = await mongoose.model("Order").findOne({ _id: orderId, userId }).session(session);

    if (!order) {
      throw new AppError("Order not found.", 404);
    }

    if (order.status !== ORDER_STATUSES.PENDING) {
      throw new AppError("Only pending orders can be cancelled.", 400);
    }

    const items = await findOrderItemsByOrderId(order._id, session);
    const seatIds = items.map((item) => item.seatId._id || item.seatId);
    const locks = await findActiveSeatLocksForUserSeats(userId, seatIds, session);

    await updateOrderById(order._id, { status: ORDER_STATUSES.CANCELLED }, session);
    await updateOrderItemsByOrderId(order._id, { status: ORDER_STATUSES.CANCELLED }, session);

    if (locks.length > 0) {
      await updateLocksByIds(
        locks.map((lock) => lock._id),
        { status: SEAT_LOCK_STATUSES.RELEASED },
        session
      );
    }

    await mongoose
      .model("Seat")
      .updateMany({ _id: { $in: seatIds }, status: SEAT_STATUSES.LOCKED }, { status: SEAT_STATUSES.AVAILABLE }, { session });
  });
}

export async function checkoutMyOrder(orderId, userId, payload) {
  if (!payload.confirm) {
    throw new AppError("Checkout confirmation is required.", 400);
  }

  let paidOrderId;

  await runWithOptionalTransaction(async (session) => {
    const order = await mongoose.model("Order").findOne({ _id: orderId, userId }).session(session);

    if (!order) {
      throw new AppError("Order not found.", 404);
    }

    if (order.status !== ORDER_STATUSES.PENDING) {
      throw new AppError("Only pending orders can be checked out.", 400);
    }

    const items = await findOrderItemsByOrderId(order._id, session);
    const seatIds = items.map((item) => item.seatId._id || item.seatId);
    assertUniqueSeatIds(seatIds);
    const locks = await findActiveSeatLocksForUserSeats(userId, seatIds, session);
    const now = new Date();

    if (locks.length !== seatIds.length || locks.some((lock) => lock.expiresAt <= now)) {
      throw new AppError("Selected seat locks are missing or expired.", 409);
    }

    const lockSeatIds = new Set(locks.map((lock) => (lock.seatId?._id || lock.seatId).toString()));
    const existingTicketCount = await mongoose
      .model("Ticket")
      .countDocuments({ seatId: { $in: seatIds } })
      .session(session);

    if (existingTicketCount > 0) {
      throw new AppError("A ticket already exists for one or more selected seats.", 409);
    }

    const soldSeatIds = [];

    try {
      for (const seatId of seatIds) {
        if (!lockSeatIds.has(seatId.toString())) {
          throw new AppError("Selected seat locks do not match this checkout.", 409);
        }

        const seatUpdateResult = await mongoose
          .model("Seat")
          .updateOne(
            { _id: seatId, eventId: order.eventId, status: SEAT_STATUSES.LOCKED },
            { status: SEAT_STATUSES.SOLD },
            { session }
          );

        if (seatUpdateResult.modifiedCount !== 1) {
          throw new AppError("Checkout could not sell every selected seat. Please refresh and try again.", 409);
        }

        soldSeatIds.push(seatId);
      }

      await updateLocksByIds(
        locks.map((lock) => lock._id),
        { status: SEAT_LOCK_STATUSES.PAID },
        session
      );
      await updateOrderById(order._id, { status: ORDER_STATUSES.PAID }, session);
      await updateOrderItemsByOrderId(order._id, { status: ORDER_STATUSES.PAID }, session);

      for (const item of items) {
        const existingTicket = await mongoose.model("Ticket").findOne({ orderItemId: item._id }).session(session);

        if (existingTicket) {
          continue;
        }

        await createTicket(
          {
            orderItemId: item._id,
            orderId: order._id,
            userId,
            eventId: order.eventId,
            seatId: item.seatId._id || item.seatId,
            qrCode: `TICKETRUSH-${order._id.toString()}-${item._id.toString()}-${crypto.randomUUID()}`
          },
          session
        );
      }
    } catch (error) {
      if (!session && soldSeatIds.length > 0) {
        await mongoose
          .model("Seat")
          .updateMany(
            { _id: { $in: soldSeatIds }, eventId: order.eventId, status: SEAT_STATUSES.SOLD },
            { status: SEAT_STATUSES.LOCKED }
          );
      }

      if (isDuplicateKeyError(error)) {
        throw new AppError("A ticket already exists for one or more selected seats.", 409);
      }

      throw error;
    }

    paidOrderId = order._id;
  });

  const order = await findOrderById(paidOrderId);
  return mapOrderWithItems(order);
}

export async function listAdminOrders(query) {
  const pagination = { page: query.page, limit: query.limit };
  const { items, total } = await findAdminOrders(query, pagination);
  const mappedItems = await Promise.all(items.map((order) => mapOrderWithItems(order)));

  return {
    items: mappedItems,
    pagination: mapPagination({ ...pagination, total })
  };
}

export async function getAdminOrder(orderId) {
  const order = await findOrderById(orderId);

  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  return mapOrderWithItems(order);
}
