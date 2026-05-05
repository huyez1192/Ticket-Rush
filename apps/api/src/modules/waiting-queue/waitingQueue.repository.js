import { QUEUE_STATUSES } from "../../common/constants/index.js";
import { WaitingQueueEntry } from "./waitingQueue.model.js";

export function findQueueEntryByUserEvent(userId, eventId) {
  return WaitingQueueEntry.findOne({ userId, eventId }).lean();
}

export function findQueueEntryByIdForUser(queueId, userId) {
  return WaitingQueueEntry.findOne({ _id: queueId, userId }).lean();
}

export function findQueueEntryByUserEventForUser(userId, eventId) {
  return WaitingQueueEntry.findOne({ userId, eventId }).lean();
}

export async function getNextPositionForEvent(eventId) {
  const latest = await WaitingQueueEntry.findOne({ eventId }).sort({ position: -1 }).select("position").lean();
  return (latest?.position || 0) + 1;
}

export function createQueueEntry(data) {
  return WaitingQueueEntry.create(data);
}

export function deleteQueueEntryByIdForUser(queueId, userId) {
  return WaitingQueueEntry.findOneAndDelete({ _id: queueId, userId });
}

export async function findAdminQueueEntries(eventId, filters, pagination) {
  const query = { eventId };

  if (filters.status) {
    query.status = filters.status;
  }

  const skip = (pagination.page - 1) * pagination.limit;
  const [items, total] = await Promise.all([
    WaitingQueueEntry.find(query).sort({ position: 1, _id: 1 }).skip(skip).limit(pagination.limit).lean(),
    WaitingQueueEntry.countDocuments(query)
  ]);

  return { items, total };
}

export function findWaitingEntriesForAdmit(eventId, batchSize) {
  return WaitingQueueEntry.find({ eventId, status: QUEUE_STATUSES.WAITING })
    .sort({ position: 1, _id: 1 })
    .limit(batchSize);
}

export function updateQueueEntryById(queueId, update) {
  return WaitingQueueEntry.findByIdAndUpdate(queueId, update, { new: true });
}
