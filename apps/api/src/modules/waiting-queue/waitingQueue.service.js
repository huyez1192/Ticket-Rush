import crypto from "node:crypto";
import { QUEUE_STATUSES } from "../../common/constants/index.js";
import { AppError } from "../../common/errors/AppError.js";
import { findEventById } from "../events/event.repository.js";
import { mapPagination, mapWaitingQueueEntryToDto } from "./waitingQueue.mapper.js";
import {
  createQueueEntry,
  deleteQueueEntryByIdForUser,
  findAdminQueueEntries,
  findQueueEntryByIdForUser,
  findQueueEntryByUserEvent,
  findQueueEntryByUserEventForUser,
  findWaitingEntriesForAdmit,
  getNextPositionForEvent,
  updateQueueEntryById
} from "./waitingQueue.repository.js";

async function assertEventExists(eventId) {
  const event = await findEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  return event;
}

export async function joinQueue(userId, payload) {
  await assertEventExists(payload.eventId);

  const existingEntry = await findQueueEntryByUserEvent(userId, payload.eventId);

  if (existingEntry) {
    return mapWaitingQueueEntryToDto(existingEntry);
  }

  const position = await getNextPositionForEvent(payload.eventId);
  const entry = await createQueueEntry({
    userId,
    eventId: payload.eventId,
    position,
    status: QUEUE_STATUSES.WAITING
  });

  return mapWaitingQueueEntryToDto(entry);
}

export async function getMyQueueEntry(queueId, userId) {
  const entry = await findQueueEntryByIdForUser(queueId, userId);

  if (!entry) {
    throw new AppError("Queue entry not found.", 404);
  }

  return mapWaitingQueueEntryToDto(entry);
}

export async function getMyQueueEntryForEvent(eventId, userId) {
  await assertEventExists(eventId);

  const entry = await findQueueEntryByUserEventForUser(userId, eventId);

  if (!entry) {
    throw new AppError("Queue entry not found.", 404);
  }

  return mapWaitingQueueEntryToDto(entry);
}

export async function leaveQueue(queueId, userId) {
  const entry = await deleteQueueEntryByIdForUser(queueId, userId);

  if (!entry) {
    throw new AppError("Queue entry not found.", 404);
  }
}

export async function listAdminQueueEntries(eventId, query) {
  await assertEventExists(eventId);

  const pagination = { page: query.page, limit: query.limit };
  const { items, total } = await findAdminQueueEntries(eventId, query, pagination);

  return {
    items: items.map((entry) => mapWaitingQueueEntryToDto(entry)).filter(Boolean),
    pagination: mapPagination({ ...pagination, total })
  };
}

export async function admitQueueBatch(eventId, payload) {
  await assertEventExists(eventId);

  const entries = await findWaitingEntriesForAdmit(eventId, payload.batchSize);
  const admittedEntries = [];
  const now = new Date();

  for (const entry of entries) {
    const admittedEntry = await updateQueueEntryById(entry._id, {
      status: QUEUE_STATUSES.ADMITTED,
      token: `queue_admit_${crypto.randomUUID()}`,
      admittedAt: now
    });

    admittedEntries.push(admittedEntry);
  }

  return {
    eventId,
    requestedBatchSize: payload.batchSize,
    admittedCount: admittedEntries.length,
    admittedEntries: admittedEntries.map((entry) => mapWaitingQueueEntryToDto(entry)).filter(Boolean)
  };
}
