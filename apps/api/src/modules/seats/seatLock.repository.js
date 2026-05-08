import { SeatLock } from "./seatLock.model.js";
import { SEAT_LOCK_STATUSES } from "../../common/constants/index.js";

const SEAT_POPULATE = {
  path: "seatId",
  populate: {
    path: "sectionId",
    select: "eventId name description price color displayOrder defaultSeatWidth defaultSeatHeight createdAt updatedAt"
  }
};

export function findActiveSeatLockBySeatId(seatId, session) {
  return SeatLock.findOne({ seatId, status: SEAT_LOCK_STATUSES.ACTIVE }).session(session || null);
}

export function findActiveSeatLocksForUserEvent(userId, eventSeatIds, session) {
  return SeatLock.find({
    userId,
    seatId: { $in: eventSeatIds },
    status: SEAT_LOCK_STATUSES.ACTIVE
  })
    .populate(SEAT_POPULATE)
    .sort({ lockedAt: 1, _id: 1 })
    .session(session || null);
}

export function findActiveSeatLocksForUserSeats(userId, seatIds, session) {
  return SeatLock.find({
    userId,
    seatId: { $in: seatIds },
    status: SEAT_LOCK_STATUSES.ACTIVE
  })
    .populate(SEAT_POPULATE)
    .session(session || null);
}

export async function createSeatLock(lockData, session) {
  const [lock] = await SeatLock.create([lockData], { session });
  return lock;
}

export function updateSeatLockById(lockId, update, session) {
  return SeatLock.findByIdAndUpdate(lockId, update, { new: true }).session(session || null);
}

export function findOwnActiveLockForSeat(userId, seatId, session) {
  return SeatLock.findOne({ userId, seatId, status: SEAT_LOCK_STATUSES.ACTIVE }).session(session || null);
}

export async function findExpiredActiveLocks(now, session) {
  return SeatLock.find({ status: SEAT_LOCK_STATUSES.ACTIVE, expiresAt: { $lte: now } }).session(session || null);
}

export function updateLocksByIds(lockIds, update, session) {
  return SeatLock.updateMany({ _id: { $in: lockIds } }, update, { session });
}

export function updateActiveLocksByIds(lockIds, update, session) {
  return SeatLock.updateMany(
    { _id: { $in: lockIds }, status: SEAT_LOCK_STATUSES.ACTIVE },
    update,
    { session }
  );
}

export function countSeatLocksBySeatIds(seatIds) {
  return SeatLock.countDocuments({ seatId: { $in: seatIds } });
}
