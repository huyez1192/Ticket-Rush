import mongoose from "mongoose";
import { EVENT_STATUSES, SEAT_LOCK_STATUSES, SEAT_STATUSES } from "../../common/constants/index.js";
import { AppError } from "../../common/errors/AppError.js";
import { runWithOptionalTransaction } from "../../common/utils/runWithOptionalTransaction.js";
import { findEventById } from "../events/event.repository.js";
import { validateQueueAccessForSeatLock } from "../waiting-queue/waitingQueue.service.js";
import { findAllSeatsForEvent } from "./seat.repository.js";
import { mapPagination, mapSeatLockToDto } from "./seatLock.mapper.js";
import {
  createSeatLock,
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
  select: "eventId name description price color displayOrder defaultSeatWidth defaultSeatHeight createdAt updatedAt"
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

export async function lockSeatsForUser(eventId, userId, payload) {
  const event = await assertSellingEvent(eventId);
  await validateQueueAccessForSeatLock(event, userId, payload.queueToken);
  assertUniqueSeatIds(payload.seatIds);

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

export async function releaseExpiredSeatLocks() {
  const now = new Date();
  let releasedSeatIds = [];

  await runWithOptionalTransaction(async (session) => {
    const locks = await findExpiredActiveLocks(now, session);
    releasedSeatIds = locks.map((lock) => lock.seatId.toString());

    if (locks.length === 0) {
      return;
    }

    await updateActiveLocksByIds(
      locks.map((lock) => lock._id),
      { status: SEAT_LOCK_STATUSES.EXPIRED },
      session
    );
    await mongoose
      .model("Seat")
      .updateMany(
        { _id: { $in: locks.map((lock) => lock.seatId) }, status: SEAT_STATUSES.LOCKED },
        { status: SEAT_STATUSES.AVAILABLE },
        { session }
      );
  });

  return {
    releasedCount: releasedSeatIds.length,
    releasedSeatIds,
    ranAt: now
  };
}
