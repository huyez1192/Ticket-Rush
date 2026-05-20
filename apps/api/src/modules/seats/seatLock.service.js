import mongoose from "mongoose";
import { EVENT_STATUSES, ORDER_STATUSES, SEAT_LOCK_STATUSES, SEAT_STATUSES } from "../../common/constants/index.js";
import { AppError } from "../../common/errors/AppError.js";
import { runWithOptionalTransaction } from "../../common/utils/runWithOptionalTransaction.js";
import {
  findOrderItemsByOrderIds,
  findOrderItemsForSeatsByOrderStatuses,
  findPendingOrdersForCleanup,
  updateOrderItemsByOrderIds,
  updateOrdersByIds
} from "../bookings/order.repository.js";
import { findEventById } from "../events/event.repository.js";
import { validateQueueAccessForSeatLock } from "../waiting-queue/waitingQueue.service.js";
import { findAllSeatsForEvent } from "./seat.repository.js";
import { mapPagination, mapSeatLockToDto } from "./seatLock.mapper.js";
import {
  createSeatLock,
  findActiveSeatLocksBySeatIds,
  findActiveSeatLockBySeatId,
  findActiveSeatLocksForUserEvent,
  findExpiredActiveLocks,
  findOwnActiveLockForSeat,
  updateActiveLocksByIds,
  updateSeatLockById
} from "./seatLock.repository.js";

const LOCK_DURATION_MS = 10 * 60 * 1000;
const SEAT_POPULATE = {
  path: "sectionId",
  select: "eventId name description price color displayOrder defaultSeatWidth defaultSeatHeight seatShape createdAt updatedAt"
};

function buildSeatConflictError(seatIds) {
  return new AppError("One or more seats are no longer available.", 409, {
    seatIds: seatIds.map((seatId) => seatId.toString())
  });
}

function assertUniqueSeatIds(seatIds) {
  const uniqueSeatIds = new Set(seatIds.map((seatId) => seatId.toString()));

  if (uniqueSeatIds.size !== seatIds.length) {
    throw new AppError("Duplicate seats are not allowed in the same lock request.", 400);
  }
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

function toIdString(value) {
  return (value?._id || value)?.toString?.() || String(value);
}

function toObjectIdValue(value) {
  return value?._id || value;
}

function uniqueObjectIds(values) {
  const idsByString = new Map();

  for (const value of values) {
    if (!value) {
      continue;
    }

    const id = toObjectIdValue(value);
    idsByString.set(toIdString(id), id);
  }

  return Array.from(idsByString.values());
}

function groupItemsByOrderId(items) {
  return items.reduce((result, item) => {
    const orderId = toIdString(item.orderId);

    if (!result.has(orderId)) {
      result.set(orderId, []);
    }

    result.get(orderId).push(item);
    return result;
  }, new Map());
}

function isExpiredAt(expiresAt, now) {
  const expiresAtTime = expiresAt ? new Date(expiresAt).getTime() : null;
  return Number.isFinite(expiresAtTime) && expiresAtTime <= now.getTime();
}

export async function lockSeatsForUser(eventId, userId, payload) {
  const event = await assertSellingEvent(eventId);
  await validateQueueAccessForSeatLock(event, userId, payload.queueToken);
  assertUniqueSeatIds(payload.seatIds);
  await releaseExpiredSeatLocks(eventId);

  const lockedSeats = [];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_DURATION_MS);

  await runWithOptionalTransaction(async (session) => {
    const lockedSeatIds = [];
    const createdLockIds = [];

    try {
      for (const seatId of payload.seatIds) {
        const activeLock = await findActiveSeatLockBySeatId(seatId, session);

        if (activeLock?.expiresAt && activeLock.expiresAt <= now) {
          await updateSeatLockById(activeLock._id, { status: SEAT_LOCK_STATUSES.EXPIRED }, session);
          await mongoose
            .model("Seat")
            .updateOne(
              { _id: seatId, eventId, status: SEAT_STATUSES.LOCKED },
              { status: SEAT_STATUSES.AVAILABLE },
              { session }
            );
        }

        const seatUpdateResult = await mongoose
          .model("Seat")
          .updateOne(
            { _id: seatId, eventId, status: SEAT_STATUSES.AVAILABLE },
            { status: SEAT_STATUSES.LOCKED },
            { session }
          );

        if (seatUpdateResult.modifiedCount !== 1) {
          throw buildSeatConflictError([seatId]);
        }

        lockedSeatIds.push(seatId);

        try {
          const lock = await createSeatLock(
            {
              seatId,
              userId,
              lockedAt: now,
              expiresAt,
              status: SEAT_LOCK_STATUSES.ACTIVE
            },
            session
          );
          createdLockIds.push(lock._id);

          const lockedSeat = await mongoose
            .model("Seat")
            .findOne({ _id: seatId, eventId, status: SEAT_STATUSES.LOCKED })
            .populate(SEAT_POPULATE)
            .session(session);

          lock.seatId = lockedSeat;
          lockedSeats.push(lock);
        } catch (error) {
          if (error?.code === 11000) {
            throw buildSeatConflictError([seatId]);
          }

          throw error;
        }
      }
    } catch (error) {
      if (!session && lockedSeatIds.length > 0) {
        if (createdLockIds.length > 0) {
          await updateActiveLocksByIds(createdLockIds, { status: SEAT_LOCK_STATUSES.RELEASED }, null);
        }

        await mongoose
          .model("Seat")
          .updateMany(
            { _id: { $in: lockedSeatIds }, eventId, status: SEAT_STATUSES.LOCKED },
            { status: SEAT_STATUSES.AVAILABLE }
          );
      }

      throw error;
    }
  });

  return {
    lockedSeats: lockedSeats.map((lock) => mapSeatLockToDto(lock)).filter(Boolean),
    failedSeatIds: [],
    expiresAt
  };
}

export async function getMyActiveSeatLocks(eventId, userId) {
  const event = await findEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  await releaseExpiredSeatLocks(eventId);

  const seats = await findAllSeatsForEvent(eventId);
  const locks = await findActiveSeatLocksForUserEvent(
    userId,
    seats.map((seat) => seat._id)
  );

  return {
    items: locks.map((lock) => mapSeatLockToDto(lock)).filter(Boolean),
    pagination: mapPagination({ page: 1, limit: locks.length || 20, total: locks.length })
  };
}

export async function releaseMySeatLock(eventId, seatId, userId) {
  const event = await findEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  await runWithOptionalTransaction(async (session) => {
    const lock = await findOwnActiveLockForSeat(userId, seatId, session);

    if (!lock) {
      throw new AppError("Active seat lock not found.", 404);
    }

    await updateSeatLockById(lock._id, { status: SEAT_LOCK_STATUSES.RELEASED }, session);
    await mongoose
      .model("Seat")
      .updateOne({ _id: seatId, eventId, status: SEAT_STATUSES.LOCKED }, { status: SEAT_STATUSES.AVAILABLE }, { session });
  });
}

export async function releaseExpiredSeatLocks(eventId = null, userId = null) {
  const now = new Date();
  let expiredLockIds = [];
  let expiredOrderIds = [];
  let releasedSeatIds = [];

  await runWithOptionalTransaction(async (session) => {
    const eventSeatIds = eventId
      ? (await mongoose.model("Seat").find({ eventId }).select("_id").session(session || null)).map((seat) => seat._id)
      : [];

    if (eventId && eventSeatIds.length === 0) {
      return;
    }

    const locks = await findExpiredActiveLocks(now, session, eventSeatIds, userId);
    expiredLockIds = locks.map((lock) => lock._id);
    const expiredLockSeatIds = locks.map((lock) => toObjectIdValue(lock.seatId));

    if (expiredLockIds.length) {
      await updateActiveLocksByIds(
        expiredLockIds,
        { status: SEAT_LOCK_STATUSES.EXPIRED },
        session
      );
    }

    const pendingOrders = await findPendingOrdersForCleanup({ eventId, userId }, session);
    const pendingOrderIds = pendingOrders.map((order) => order._id);
    const pendingOrderItems = pendingOrderIds.length ? await findOrderItemsByOrderIds(pendingOrderIds, session) : [];
    const pendingItemsByOrderId = groupItemsByOrderId(pendingOrderItems);
    const pendingSeatIds = uniqueObjectIds(pendingOrderItems.map((item) => item.seatId));
    const activePendingLocks = pendingSeatIds.length ? await findActiveSeatLocksBySeatIds(pendingSeatIds, session, now) : [];
    const activeLockKeys = new Set(
      activePendingLocks.map((lock) => `${toIdString(lock.seatId)}:${toIdString(lock.userId)}`)
    );
    const expiredLockSeatIdSet = new Set(expiredLockSeatIds.map((seatId) => toIdString(seatId)));
    const expiredOrderSeatIds = [];
    const expiredOrderLockKeys = new Set();

    expiredOrderIds = pendingOrders
      .filter((order) => {
        const items = pendingItemsByOrderId.get(toIdString(order._id)) || [];
        const seatIds = items.map((item) => item.seatId);
        const ownerId = toIdString(order.userId);
        const lockExpiresAtElapsed = isExpiredAt(order.lockExpiresAt, now);
        const hasExpiredSeatLock = seatIds.some((seatId) => expiredLockSeatIdSet.has(toIdString(seatId)));
        const hasMissingActiveLock = seatIds.some((seatId) => !activeLockKeys.has(`${toIdString(seatId)}:${ownerId}`));

        if (seatIds.length === 0 || lockExpiresAtElapsed || hasExpiredSeatLock || hasMissingActiveLock) {
          expiredOrderSeatIds.push(...seatIds);
          seatIds.forEach((seatId) => expiredOrderLockKeys.add(`${toIdString(seatId)}:${ownerId}`));
          return true;
        }

        return false;
      })
      .map((order) => order._id);

    const orderLockIdsToExpire = activePendingLocks
      .filter((lock) => expiredOrderLockKeys.has(`${toIdString(lock.seatId)}:${toIdString(lock.userId)}`))
      .map((lock) => lock._id);

    if (orderLockIdsToExpire.length) {
      await updateActiveLocksByIds(orderLockIdsToExpire, { status: SEAT_LOCK_STATUSES.EXPIRED }, session);
      expiredLockIds = uniqueObjectIds([...expiredLockIds, ...orderLockIdsToExpire]);
    }

    if (expiredOrderIds.length) {
      await updateOrdersByIds(expiredOrderIds, { status: ORDER_STATUSES.EXPIRED }, session);
      await updateOrderItemsByOrderIds(expiredOrderIds, { status: ORDER_STATUSES.EXPIRED }, session);
    }

    const candidateSeatIds = uniqueObjectIds([...expiredLockSeatIds, ...expiredOrderSeatIds]);

    if (candidateSeatIds.length === 0) {
      return;
    }

    const paidOrderItems = await findOrderItemsForSeatsByOrderStatuses(candidateSeatIds, [ORDER_STATUSES.PAID], session);
    const activeLocks = await findActiveSeatLocksBySeatIds(candidateSeatIds, session, now);
    const blockedSeatIds = new Set([
      ...paidOrderItems.map((item) => toIdString(item.seatId)),
      ...activeLocks.map((lock) => toIdString(lock.seatId))
    ]);
    const releasableSeatIds = candidateSeatIds.filter((seatId) => !blockedSeatIds.has(toIdString(seatId)));

    if (releasableSeatIds.length === 0) {
      return;
    }

    const currentlyLockedSeats = await mongoose
      .model("Seat")
      .find({ _id: { $in: releasableSeatIds }, status: SEAT_STATUSES.LOCKED })
      .select("_id")
      .session(session || null);
    const lockedSeatIds = currentlyLockedSeats.map((seat) => seat._id);
    releasedSeatIds = lockedSeatIds.map((seatId) => seatId.toString());

    if (lockedSeatIds.length) {
      await mongoose
        .model("Seat")
        .updateMany(
          { _id: { $in: lockedSeatIds }, status: SEAT_STATUSES.LOCKED },
          { status: SEAT_STATUSES.AVAILABLE },
          { session }
        );
    }
  });

  return {
    expiredLocksCount: expiredLockIds.length,
    releasedSeatsCount: releasedSeatIds.length,
    expiredOrdersCount: expiredOrderIds.length,
    expiredCount: expiredLockIds.length,
    releasedCount: releasedSeatIds.length,
    releasedSeatIds,
    expiredOrderIds: expiredOrderIds.map((orderId) => orderId.toString()),
    ranAt: now
  };
}
