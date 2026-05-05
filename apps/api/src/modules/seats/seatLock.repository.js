import { SeatLock } from "./seatLock.model.js";

const SEAT_POPULATE = {
  path: "seatId",
  populate: { path: "sectionId", select: "eventId name description price createdAt updatedAt" }
};

export function findActiveSeatLockBySeatId(seatId, session) {
  return SeatLock.findOne({ seatId, status: "Active" }).session(session || null);
}

export function findActiveSeatLocksForUserEvent(userId, eventSeatIds, session) {
  return SeatLock.find({
    userId,
    seatId: { $in: eventSeatIds },
    status: "Active"
  })
    .populate(SEAT_POPULATE)
    .sort({ lockedAt: 1, _id: 1 })
    .session(session || null);
}

export function findActiveSeatLocksForUserSeats(userId, seatIds, session) {
  return SeatLock.find({
    userId,
    seatId: { $in: seatIds },
    status: "Active"
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
  return SeatLock.findOne({ userId, seatId, status: "Active" }).session(session || null);
}

export async function findExpiredActiveLocks(now, session) {
  return SeatLock.find({ status: "Active", expiresAt: { $lte: now } }).session(session || null);
}

export function updateLocksByIds(lockIds, update, session) {
  return SeatLock.updateMany({ _id: { $in: lockIds } }, update, { session });
}
