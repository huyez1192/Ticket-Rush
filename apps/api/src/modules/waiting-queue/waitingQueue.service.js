import crypto from "node:crypto";
import { QUEUE_STATUSES } from "../../common/constants/index.js";
import { AppError } from "../../common/errors/AppError.js";
import { findEventById } from "../events/event.repository.js";
import { updateAdminEventQueueConfig as updateEventQueueConfig } from "../events/event.service.js";
import { mapPagination, mapWaitingQueueEntryToDto } from "./waitingQueue.mapper.js";
import {
  cancelQueueEntryByIdForUser,
  cancelQueueEntryByUserEvent,
  countQueueStatuses,
  countWaitingBefore,
  createQueueEntry,
  expireQueueEntryById,
  findAdmittedEntryByTokenHash,
  findAdminQueueEntries,
  findQueueEntryByIdForUser,
  findQueueEntryByUserEvent,
  findQueueEntryByUserEventForUser,
  findWaitingEntriesForAdmit,
  getNextPositionForEvent,
  updateQueueEntryById
} from "./waitingQueue.repository.js";

function hashQueueToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateQueueToken() {
  return `queue_admit_${crypto.randomBytes(32).toString("base64url")}`;
}

async function assertEventExists(eventId) {
  const event = await findEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  return event;
}

function getQueueTtlMs(event) {
  return Number(event.queueAccessTtlMinutes || 10) * 60 * 1000;
}

function buildQueueResponse(event, entry, options = {}) {
  const queueRequired = Boolean(event.virtualQueueEnabled);
  const dto = entry ? mapWaitingQueueEntryToDto(entry) : null;
  const accessGranted = !queueRequired || (dto?.status === QUEUE_STATUSES.ADMITTED && dto?.expiresAt && new Date(dto.expiresAt) > new Date());

  return {
    queueRequired,
    accessGranted,
    queueToken: options.queueToken,
    expiresAt: dto?.expiresAt || null,
    queue: dto
  };
}

async function addPosition(entry) {
  if (!entry || entry.status !== QUEUE_STATUSES.WAITING) {
    return entry;
  }

  const waitingBefore = await countWaitingBefore(entry.eventId, entry.sequenceNumber || entry.position);
  return {
    ...entry,
    position: waitingBefore + 1
  };
}

async function expireIfNeeded(entry) {
  if (!entry || entry.status !== QUEUE_STATUSES.ADMITTED || !entry.expiresAt) {
    return entry;
  }

  if (new Date(entry.expiresAt) > new Date()) {
    return entry;
  }

  return expireQueueEntryById(entry._id);
}

async function issueTokenForEntry(entry) {
  const queueToken = generateQueueToken();
  const updatedEntry = await updateQueueEntryById(entry._id, {
    $set: { queueTokenHash: hashQueueToken(queueToken) },
    $unset: { token: "" }
  });

  return { entry: updatedEntry, queueToken };
}

async function createWaitingEntry(eventId, userId) {
  const sequenceNumber = await getNextPositionForEvent(eventId);
  const entry = await createQueueEntry({
    userId,
    eventId,
    position: sequenceNumber,
    sequenceNumber,
    status: QUEUE_STATUSES.WAITING
  });

  return entry.toObject();
}

async function resetEntryToWaiting(entry, eventId) {
  const sequenceNumber = await getNextPositionForEvent(eventId);
  return updateQueueEntryById(entry._id, {
    $set: {
      position: sequenceNumber,
      sequenceNumber,
      status: QUEUE_STATUSES.WAITING
    },
    $unset: {
      token: "",
      queueTokenHash: "",
      admittedAt: "",
      expiresAt: "",
      expiredAt: ""
    }
  });
}

export async function joinQueue(userId, payload) {
  return joinEventQueue(payload.eventId, userId);
}

export async function joinEventQueue(eventId, userId) {
  const event = await assertEventExists(eventId);

  if (!event.virtualQueueEnabled) {
    return buildQueueResponse(event, null);
  }

  let entry = await findQueueEntryByUserEvent(userId, eventId, { activeOnly: true });
  entry = await expireIfNeeded(entry);

  if (!entry || entry.status === QUEUE_STATUSES.EXPIRED || entry.status === QUEUE_STATUSES.CANCELLED) {
    try {
      const reusableEntry = entry || (await findQueueEntryByUserEvent(userId, eventId));
      entry = reusableEntry ? await resetEntryToWaiting(reusableEntry, eventId) : await createWaitingEntry(eventId, userId);
    } catch (error) {
      if (error?.code === 11000) {
        entry = await findQueueEntryByUserEvent(userId, eventId, { activeOnly: true });

        if (!entry) {
          const reusableEntry = await findQueueEntryByUserEvent(userId, eventId);
          entry = reusableEntry ? await resetEntryToWaiting(reusableEntry, eventId) : null;
        }
      } else {
        throw error;
      }
    }
  }

  entry = await addPosition(entry);

  if (entry?.status === QUEUE_STATUSES.ADMITTED) {
    const tokenResult = await issueTokenForEntry(entry);
    return buildQueueResponse(event, tokenResult.entry, { queueToken: tokenResult.queueToken });
  }

  return buildQueueResponse(event, entry);
}

export async function getMyQueueEntry(queueId, userId) {
  const entry = await findQueueEntryByIdForUser(queueId, userId);

  if (!entry) {
    throw new AppError("Queue entry not found.", 404);
  }

  return mapWaitingQueueEntryToDto(entry);
}

export async function getMyQueueEntryForEvent(eventId, userId) {
  const event = await assertEventExists(eventId);

  if (!event.virtualQueueEnabled) {
    return buildQueueResponse(event, null);
  }

  let entry = await findQueueEntryByUserEventForUser(userId, eventId);
  entry = await expireIfNeeded(entry);

  if (!entry) {
    return {
      queueRequired: true,
      accessGranted: false,
      queue: null
    };
  }

  entry = await addPosition(entry);

  if (entry.status === QUEUE_STATUSES.ADMITTED) {
    const tokenResult = await issueTokenForEntry(entry);
    return buildQueueResponse(event, tokenResult.entry, { queueToken: tokenResult.queueToken });
  }

  return buildQueueResponse(event, entry);
}

export async function leaveQueue(queueId, userId) {
  const entry = await cancelQueueEntryByIdForUser(queueId, userId);

  if (!entry) {
    throw new AppError("Queue entry not found.", 404);
  }
}

export async function leaveEventQueue(eventId, userId) {
  await assertEventExists(eventId);
  const entry = await cancelQueueEntryByUserEvent(userId, eventId);

  if (!entry) {
    throw new AppError("Queue entry not found.", 404);
  }
}

export async function listAdminQueueEntries(eventId, query) {
  await assertEventExists(eventId);

  const pagination = { page: query.page, limit: query.limit };
  const [{ items, total }, summary] = await Promise.all([
    findAdminQueueEntries(eventId, query, pagination),
    countQueueStatuses(eventId)
  ]);

  return {
    items: items.map((entry) => mapWaitingQueueEntryToDto(entry)).filter(Boolean),
    summary: {
      Waiting: summary.Waiting || 0,
      Admitted: summary.Admitted || 0,
      Expired: summary.Expired || 0,
      Cancelled: summary.Cancelled || 0
    },
    pagination: mapPagination({ ...pagination, total })
  };
}

export async function admitQueueBatch(eventId, payload = {}) {
  const event = await assertEventExists(eventId);
  const limit = Number(payload.limit || payload.batchSize || event.queueBatchSize || 50);
  const batchSize = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 50;
  const entries = await findWaitingEntriesForAdmit(eventId, batchSize);
  const admittedEntries = [];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + getQueueTtlMs(event));

  for (const entry of entries) {
    const queueToken = generateQueueToken();
    const admittedEntry = await updateQueueEntryById(entry._id, {
      $set: {
        status: QUEUE_STATUSES.ADMITTED,
        queueTokenHash: hashQueueToken(queueToken),
        admittedAt: now,
        expiresAt
      },
      $unset: {
        token: "",
        expiredAt: ""
      }
    });

    admittedEntries.push(admittedEntry);
  }

  return {
    eventId,
    requestedBatchSize: batchSize,
    admittedCount: admittedEntries.length,
    admittedEntries: admittedEntries.map((entry) => mapWaitingQueueEntryToDto(entry)).filter(Boolean)
  };
}

export async function updateAdminEventQueueConfig(eventId, payload) {
  return updateEventQueueConfig(eventId, payload);
}

export async function validateQueueAccessForSeatLock(event, userId, queueToken) {
  if (!event.virtualQueueEnabled) {
    return;
  }

  if (!queueToken) {
    throw new AppError("Queue access is required for this event.", 403);
  }

  const entry = await findAdmittedEntryByTokenHash(event._id?.toString?.() || event.id || event._id, userId, hashQueueToken(queueToken));

  if (!entry) {
    throw new AppError("Queue access is required for this event.", 403);
  }

  if (!entry.expiresAt || new Date(entry.expiresAt) <= new Date()) {
    await expireQueueEntryById(entry._id);
    throw new AppError("Your queue access has expired. Please rejoin the waiting room.", 409);
  }
}
