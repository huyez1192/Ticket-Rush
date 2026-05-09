import mongoose from "mongoose";
import { QUEUE_STATUSES } from "../../common/constants/index.js";
import { WaitingQueueEntry } from "./waitingQueue.model.js";

export const ACTIVE_QUEUE_STATUSES = Object.freeze([QUEUE_STATUSES.WAITING, QUEUE_STATUSES.ADMITTED]);

const USER_SAFE_SELECT = "username email fullName avatarUrl";

export function findQueueEntryByUserEvent(userId, eventId, options = {}) {
  const query = { userId, eventId };

  if (options.activeOnly) {
    query.status = { $in: ACTIVE_QUEUE_STATUSES };
  }

  return WaitingQueueEntry.findOne(query).sort({ createdAt: -1, _id: -1 }).lean();
}

export function findQueueEntryByIdForUser(queueId, userId) {
  return WaitingQueueEntry.findOne({ _id: queueId, userId }).lean();
}

export function findQueueEntryByUserEventForUser(userId, eventId) {
  return WaitingQueueEntry.findOne({ userId, eventId, status: { $in: ACTIVE_QUEUE_STATUSES } }).sort({ createdAt: -1, _id: -1 }).lean();
}

export async function getNextPositionForEvent(eventId) {
  const latest = await WaitingQueueEntry.findOne({ eventId }).sort({ sequenceNumber: -1, position: -1 }).select("position sequenceNumber").lean();
  return (latest?.sequenceNumber || latest?.position || 0) + 1;
}

export function createQueueEntry(data) {
  return WaitingQueueEntry.create(data);
}

export function cancelQueueEntryByIdForUser(queueId, userId) {
  return WaitingQueueEntry.findOneAndUpdate(
    { _id: queueId, userId, status: { $in: ACTIVE_QUEUE_STATUSES } },
    { $set: { status: QUEUE_STATUSES.CANCELLED }, $unset: { token: "", queueTokenHash: "" } },
    { new: true }
  ).lean();
}

export function cancelQueueEntryByUserEvent(userId, eventId) {
  return WaitingQueueEntry.findOneAndUpdate(
    { userId, eventId, status: { $in: ACTIVE_QUEUE_STATUSES } },
    { $set: { status: QUEUE_STATUSES.CANCELLED }, $unset: { token: "", queueTokenHash: "" } },
    { new: true }
  ).lean();
}

export async function findAdminQueueEntries(eventId, filters, pagination) {
  const query = { eventId };

  if (filters.status) {
    query.status = filters.status;
  }

  const skip = (pagination.page - 1) * pagination.limit;
  const [items, total] = await Promise.all([
    WaitingQueueEntry.find(query)
      .populate({ path: "userId", select: USER_SAFE_SELECT })
      .sort({ sequenceNumber: 1, position: 1, _id: 1 })
      .skip(skip)
      .limit(pagination.limit)
      .lean(),
    WaitingQueueEntry.countDocuments(query)
  ]);

  return { items, total };
}

export function findWaitingEntriesForAdmit(eventId, batchSize) {
  return WaitingQueueEntry.find({ eventId, status: QUEUE_STATUSES.WAITING })
    .sort({ sequenceNumber: 1, position: 1, _id: 1 })
    .limit(batchSize);
}

export function updateQueueEntryById(queueId, update) {
  return WaitingQueueEntry.findByIdAndUpdate(queueId, update, { new: true }).lean();
}

export function expireQueueEntryById(queueId) {
  const now = new Date();
  return WaitingQueueEntry.findByIdAndUpdate(
    queueId,
    { $set: { status: QUEUE_STATUSES.EXPIRED, expiredAt: now }, $unset: { token: "", queueTokenHash: "" } },
    { new: true }
  ).lean();
}

export function findAdmittedEntryByTokenHash(eventId, userId, queueTokenHash) {
  return WaitingQueueEntry.findOne({
    eventId,
    userId,
    queueTokenHash,
    status: QUEUE_STATUSES.ADMITTED
  }).lean();
}

export function countWaitingBefore(eventId, sequenceNumber) {
  return WaitingQueueEntry.countDocuments({
    eventId,
    status: QUEUE_STATUSES.WAITING,
    sequenceNumber: { $lt: sequenceNumber }
  });
}

export async function countQueueStatuses(eventId) {
  const normalizedEventId = typeof eventId === "string" ? new mongoose.Types.ObjectId(eventId) : eventId;
  const rows = await WaitingQueueEntry.aggregate([
    { $match: { eventId: normalizedEventId } },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  return rows.reduce((result, row) => {
    result[row._id] = row.count;
    return result;
  }, {});
}
