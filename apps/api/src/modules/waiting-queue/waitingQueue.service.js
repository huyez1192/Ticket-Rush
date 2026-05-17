import crypto from "node:crypto";
import { QUEUE_STATUSES } from "../../common/constants/index.js";
import { AppError } from "../../common/errors/AppError.js";
import {
  buildQueueStatePayload,
  emitAdminQueueUpdate,
  emitCustomerPositionUpdated,
  emitCustomerQueueState,
  emitQueueSummary,
  isRealtimeReady
} from "../../realtime/queueNotifier.js";
import { findEventById, findQueueEnabledEvents } from "../events/event.repository.js";
import { updateAdminEventQueueConfig as updateEventQueueConfig } from "../events/event.service.js";
import { mapPagination, mapWaitingQueueEntryToDto } from "./waitingQueue.mapper.js";
import {
  admitWaitingEntryById,
  cancelActiveQueueEntriesForEvent,
  cancelQueueEntryByIdForUser,
  cancelQueueEntryByUserEvent,
  countActiveAdmittedEntries,
  countQueueStatuses,
  countWaitingBefore,
  createQueueEntry,
  expireQueueEntriesByIds,
  expireQueueEntryById,
  findActiveEntriesForEvent,
  findAdmittedEntryByTokenHash,
  findAdminQueueEntries,
  findExpiredAdmittedEntries,
  findQueueEntryByIdForUser,
  findQueueEntryByUserEvent,
  findQueueEntryByUserEventForUser,
  findWaitingEntriesForAdmit,
  findWaitingEntriesForEvent,
  getNextPositionForEvent,
  updateQueueEntryById
} from "./waitingQueue.repository.js";

const AUTO_ADMISSION_MODE = "Auto";
const DEFAULT_ADMIN_QUEUE_LIMIT = 20;
const QUEUE_MAINTENANCE_INTERVAL_MS = 45 * 1000;
const OPERATIONAL_QUEUE_STATUSES = Object.freeze([QUEUE_STATUSES.WAITING, QUEUE_STATUSES.ADMITTED]);

let queueMaintenanceInterval = null;

function hashQueueToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateQueueToken() {
  return `queue_admit_${crypto.randomBytes(32).toString("base64url")}`;
}

function getDocumentId(value) {
  return value?._id?.toString?.() || value?.id?.toString?.() || value?.toString?.();
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

function getBatchSize(event, payload = {}) {
  const limit = Number(payload.limit || payload.batchSize || event.queueBatchSize || 50);
  return Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 50;
}

function getAutoMaxActiveUsers(event, batchSize) {
  const configured = Number(event.queueMaxActiveUsers);
  return Number.isFinite(configured) && configured > 0 ? configured : batchSize;
}

function normalizeSummary(summary = {}) {
  return {
    Waiting: summary.Waiting || 0,
    Admitted: summary.Admitted || 0,
    Expired: summary.Expired || 0,
    Cancelled: summary.Cancelled || 0
  };
}

function getEmptyQueueSummary() {
  return {
    Waiting: 0,
    Admitted: 0,
    Expired: 0,
    Cancelled: 0
  };
}

function buildQueueResponse(event, entry, options = {}) {
  const queueRequired = Boolean(event.virtualQueueEnabled);
  const dto = entry ? mapWaitingQueueEntryToDto(entry) : null;
  const accessGranted =
    !queueRequired ||
    (dto?.status === QUEUE_STATUSES.ADMITTED && dto?.expiresAt && new Date(dto.expiresAt) > new Date());

  return {
    queueRequired,
    accessGranted,
    queueToken: options.queueToken,
    expiresAt: dto?.expiresAt || null,
    queue: dto
  };
}

async function addPosition(entry) {
  if (!entry) {
    return entry;
  }

  if (entry.status !== QUEUE_STATUSES.WAITING) {
    return {
      ...entry,
      position: null
    };
  }

  const waitingBefore = await countWaitingBefore(entry.eventId, entry);
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

async function getQueueSummary(eventId, event = null) {
  if (event && !event.virtualQueueEnabled) {
    return getEmptyQueueSummary();
  }

  return normalizeSummary(
    await countQueueStatuses(eventId, {
      statuses: OPERATIONAL_QUEUE_STATUSES
    })
  );
}

async function mapQueueEntriesToDtosWithCurrentPositions(entries) {
  const entriesWithPositions = await Promise.all(entries.map((entry) => addPosition(entry)));
  return entriesWithPositions.map((entry) => mapWaitingQueueEntryToDto(entry)).filter(Boolean);
}

export async function getAdminQueueRealtimeSnapshot(eventId, options = {}) {
  const event = options.event || (await assertEventExists(eventId));

  if (!event.virtualQueueEnabled) {
    return {
      queueRequired: false,
      summary: getEmptyQueueSummary(),
      entries: [],
      pagination: mapPagination({ page: 1, limit: DEFAULT_ADMIN_QUEUE_LIMIT, total: 0 })
    };
  }

  const pagination = { page: 1, limit: DEFAULT_ADMIN_QUEUE_LIMIT };
  const [{ items, total }, summary] = await Promise.all([
    findAdminQueueEntries(eventId, {}, pagination),
    countQueueStatuses(eventId, { statuses: OPERATIONAL_QUEUE_STATUSES })
  ]);

  return {
    queueRequired: true,
    summary: normalizeSummary(summary),
    entries: await mapQueueEntriesToDtosWithCurrentPositions(items),
    pagination: mapPagination({ ...pagination, total })
  };
}

function emitEntryState(eventId, event, entry, options = {}) {
  const dto = entry ? mapWaitingQueueEntryToDto(entry) : null;
  const response = buildQueueResponse(event, entry, options);
  const state = buildQueueStatePayload(eventId, {
    ...response,
    queue: dto
  });
  const userId = dto?.userId || getDocumentId(entry?.userId);

  if (userId) {
    emitCustomerQueueState(eventId, userId, state);
  }
}

async function emitWaitingPositionStates(eventId, event) {
  const waitingEntries = await findWaitingEntriesForEvent(eventId);

  waitingEntries.forEach((entry, index) => {
    const entryWithPosition = {
      ...entry,
      position: index + 1
    };
    const userId = getDocumentId(entry.userId);

    if (!userId) {
      return;
    }

    emitCustomerPositionUpdated(eventId, userId, {
      position: index + 1,
      status: QUEUE_STATUSES.WAITING
    });
    emitEntryState(eventId, event, entryWithPosition);
  });
}

async function publishQueueRealtimeUpdate(eventId, options = {}) {
  if (!isRealtimeReady() && !options.forceSnapshot) {
    return;
  }

  const event = options.event || (await assertEventExists(eventId));
  const affectedEntries = Array.isArray(options.affectedEntries) ? options.affectedEntries : [];
  const admittedEntries = Array.isArray(options.admittedEntries) ? options.admittedEntries : [];

  affectedEntries.forEach((entry) => {
    emitEntryState(eventId, event, entry);
  });

  admittedEntries.forEach(({ entry, queueToken }) => {
    emitEntryState(eventId, event, entry, { queueToken });
  });

  if (options.updateWaitingPositions) {
    await emitWaitingPositionStates(eventId, event);
  }

  const [summary, adminSnapshot] = await Promise.all([
    getQueueSummary(eventId, event),
    getAdminQueueRealtimeSnapshot(eventId, { event })
  ]);

  emitQueueSummary(eventId, summary);
  emitAdminQueueUpdate(eventId, {
    queueRequired: Boolean(event.virtualQueueEnabled),
    summary: adminSnapshot.summary,
    entries: adminSnapshot.entries,
    pagination: adminSnapshot.pagination
  });
}

async function expireExpiredQueueAccessForEvent(eventId, options = {}) {
  const now = new Date();
  const expiredEntries = await findExpiredAdmittedEntries(eventId, now);

  if (!expiredEntries.length) {
    return [];
  }

  await expireQueueEntriesByIds(
    expiredEntries.map((entry) => entry._id),
    now
  );

  const normalizedEntries = expiredEntries.map((entry) => ({
    ...entry,
    status: QUEUE_STATUSES.EXPIRED,
    expiredAt: now,
    queueTokenHash: undefined
  }));

  if (options.publish !== false) {
    await publishQueueRealtimeUpdate(eventId, {
      event: options.event,
      affectedEntries: normalizedEntries,
      updateWaitingPositions: true,
      forceSnapshot: true
    });
  }

  return normalizedEntries;
}

async function admitWaitingEntries(event, batchSize) {
  const eventId = getDocumentId(event);
  const entries = await findWaitingEntriesForAdmit(eventId, batchSize);
  const admittedEntries = [];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + getQueueTtlMs(event));

  for (const entry of entries) {
    const queueToken = generateQueueToken();
    const admittedEntry = await admitWaitingEntryById(entry._id, {
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

    if (admittedEntry) {
      admittedEntries.push({ entry: admittedEntry, queueToken });
    }
  }

  return admittedEntries;
}

function findOwnAdmission(admittedEntries, userId) {
  return admittedEntries.find(({ entry }) => getDocumentId(entry.userId) === userId) || null;
}

async function publishSingleExpiredEntry(eventId, event, previousEntry, nextEntry) {
  if (previousEntry?.status !== QUEUE_STATUSES.ADMITTED || nextEntry?.status !== QUEUE_STATUSES.EXPIRED) {
    return;
  }

  await publishQueueRealtimeUpdate(eventId, {
    event,
    affectedEntries: [nextEntry],
    updateWaitingPositions: true,
    forceSnapshot: true
  });
}

export async function runAutoAdmissionIfNeeded(eventId, options = {}) {
  const event = options.event || (await assertEventExists(eventId));
  const expiredEntries = await expireExpiredQueueAccessForEvent(eventId, {
    event,
    publish: false
  });

  if (!event.virtualQueueEnabled || event.queueAdmissionMode !== AUTO_ADMISSION_MODE) {
    if (expiredEntries.length || options.forceSnapshot) {
      await publishQueueRealtimeUpdate(eventId, {
        event,
        affectedEntries: expiredEntries,
        updateWaitingPositions: Boolean(expiredEntries.length),
        forceSnapshot: true
      });
    }

    return {
      admittedCount: 0,
      admittedEntries: [],
      expiredCount: expiredEntries.length
    };
  }

  const batchSize = getBatchSize(event);
  const maxActiveUsers = getAutoMaxActiveUsers(event, batchSize);
  const activeAdmittedCount = await countActiveAdmittedEntries(eventId, new Date());
  const availableSlots = Math.max(maxActiveUsers - activeAdmittedCount, 0);
  const admitLimit = Math.min(batchSize, availableSlots);
  const admittedEntries = admitLimit > 0 ? await admitWaitingEntries(event, admitLimit) : [];

  if (expiredEntries.length || admittedEntries.length || options.forceSnapshot) {
    await publishQueueRealtimeUpdate(eventId, {
      event,
      affectedEntries: expiredEntries,
      admittedEntries,
      updateWaitingPositions: true,
      forceSnapshot: true
    });
  }

  return {
    admittedCount: admittedEntries.length,
    admittedEntries,
    expiredCount: expiredEntries.length,
    maxActiveUsers,
    availableSlots
  };
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
  const entryBeforeExpiry = entry;
  entry = await expireIfNeeded(entry);
  await publishSingleExpiredEntry(eventId, event, entryBeforeExpiry, entry);

  if (!entry || entry.status === QUEUE_STATUSES.EXPIRED || entry.status === QUEUE_STATUSES.CANCELLED) {
    try {
      entry = await createWaitingEntry(eventId, userId);
    } catch (error) {
      if (error?.code === 11000) {
        entry = await findQueueEntryByUserEvent(userId, eventId, { activeOnly: true });

        if (!entry) {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  if (entry?.status === QUEUE_STATUSES.WAITING && event.queueAdmissionMode === AUTO_ADMISSION_MODE) {
    const autoResult = await runAutoAdmissionIfNeeded(eventId, { event, forceSnapshot: true });
    const ownAdmission = findOwnAdmission(autoResult.admittedEntries, userId);

    if (ownAdmission) {
      return buildQueueResponse(event, ownAdmission.entry, { queueToken: ownAdmission.queueToken });
    }

    entry = await findQueueEntryByUserEventForUser(userId, eventId);
    entry = await addPosition(entry);
    return buildQueueResponse(event, entry);
  }

  entry = await addPosition(entry);

  if (entry?.status === QUEUE_STATUSES.ADMITTED) {
    const tokenResult = await issueTokenForEntry(entry);
    await publishQueueRealtimeUpdate(eventId, {
      event,
      admittedEntries: [tokenResult],
      forceSnapshot: true
    });
    return buildQueueResponse(event, tokenResult.entry, { queueToken: tokenResult.queueToken });
  }

  await publishQueueRealtimeUpdate(eventId, {
    event,
    affectedEntries: entry ? [entry] : [],
    updateWaitingPositions: true,
    forceSnapshot: true
  });

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
  const entryBeforeExpiry = entry;
  entry = await expireIfNeeded(entry);
  await publishSingleExpiredEntry(eventId, event, entryBeforeExpiry, entry);
  const currentEntryExpired =
    entryBeforeExpiry?.status === QUEUE_STATUSES.ADMITTED && entry?.status === QUEUE_STATUSES.EXPIRED;

  if (currentEntryExpired && event.queueAdmissionMode === AUTO_ADMISSION_MODE) {
    await runAutoAdmissionIfNeeded(eventId, { event, forceSnapshot: true });
  }

  if (!entry) {
    if (event.queueAdmissionMode === AUTO_ADMISSION_MODE) {
      await runAutoAdmissionIfNeeded(eventId, { event, forceSnapshot: true });
    }

    return {
      queueRequired: true,
      accessGranted: false,
      queue: null
    };
  }

  if (entry.status === QUEUE_STATUSES.WAITING && event.queueAdmissionMode === AUTO_ADMISSION_MODE) {
    const autoResult = await runAutoAdmissionIfNeeded(eventId, { event, forceSnapshot: true });
    const ownAdmission = findOwnAdmission(autoResult.admittedEntries, userId);

    if (ownAdmission) {
      return buildQueueResponse(event, ownAdmission.entry, { queueToken: ownAdmission.queueToken });
    }

    entry = await findQueueEntryByUserEventForUser(userId, eventId);
  }

  entry = await addPosition(entry);

  if (entry.status === QUEUE_STATUSES.ADMITTED) {
    const tokenResult = await issueTokenForEntry(entry);
    return buildQueueResponse(event, tokenResult.entry, { queueToken: tokenResult.queueToken });
  }

  return buildQueueResponse(event, entry);
}

export async function getQueueSocketStateForUser(eventId, userId) {
  const response = await getMyQueueEntryForEvent(eventId, userId);
  return buildQueueStatePayload(eventId, response);
}

export async function leaveQueue(queueId, userId) {
  const entry = await cancelQueueEntryByIdForUser(queueId, userId);

  if (!entry) {
    throw new AppError("Queue entry not found.", 404);
  }

  const eventId = getDocumentId(entry.eventId);
  const event = await assertEventExists(eventId);

  await publishQueueRealtimeUpdate(eventId, {
    event,
    affectedEntries: [entry],
    updateWaitingPositions: true,
    forceSnapshot: true
  });
  await runAutoAdmissionIfNeeded(eventId, { event });
}

export async function leaveEventQueue(eventId, userId) {
  const event = await assertEventExists(eventId);
  const entry = await cancelQueueEntryByUserEvent(userId, eventId);

  if (!entry) {
    throw new AppError("Queue entry not found.", 404);
  }

  await publishQueueRealtimeUpdate(eventId, {
    event,
    affectedEntries: [entry],
    updateWaitingPositions: true,
    forceSnapshot: true
  });
  await runAutoAdmissionIfNeeded(eventId, { event });
}

export async function listAdminQueueEntries(eventId, query) {
  const event = await assertEventExists(eventId);

  const pagination = { page: query.page, limit: query.limit };

  if (!event.virtualQueueEnabled) {
    return {
      items: [],
      summary: getEmptyQueueSummary(),
      pagination: mapPagination({ ...pagination, total: 0 })
    };
  }

  const [{ items, total }, summary] = await Promise.all([
    findAdminQueueEntries(eventId, query, pagination),
    countQueueStatuses(eventId, { statuses: OPERATIONAL_QUEUE_STATUSES })
  ]);

  return {
    items: await mapQueueEntriesToDtosWithCurrentPositions(items),
    summary: normalizeSummary(summary),
    pagination: mapPagination({ ...pagination, total })
  };
}

export async function admitQueueBatch(eventId, payload = {}) {
  const event = await assertEventExists(eventId);
  const batchSize = getBatchSize(event, payload);
  const expiredEntries = await expireExpiredQueueAccessForEvent(eventId, {
    event,
    publish: false
  });
  const admittedEntries = await admitWaitingEntries(event, batchSize);

  await publishQueueRealtimeUpdate(eventId, {
    event,
    affectedEntries: expiredEntries,
    admittedEntries,
    updateWaitingPositions: true,
    forceSnapshot: true
  });

  return {
    eventId,
    requestedBatchSize: batchSize,
    admittedCount: admittedEntries.length,
    admittedEntries: admittedEntries.map(({ entry }) => mapWaitingQueueEntryToDto(entry)).filter(Boolean)
  };
}

export async function updateAdminEventQueueConfig(eventId, payload) {
  const currentEvent = await assertEventExists(eventId);
  const activeEntriesBeforeUpdate = await findActiveEntriesForEvent(eventId);
  const updatedEventDto = await updateEventQueueConfig(eventId, payload);
  const event = await assertEventExists(eventId);

  if (!event.virtualQueueEnabled) {
    if (activeEntriesBeforeUpdate.length > 0) {
      await cancelActiveQueueEntriesForEvent(eventId);
    }

    const cancelledEntries = activeEntriesBeforeUpdate.map((entry) => ({
      ...entry,
      status: QUEUE_STATUSES.CANCELLED,
      queueTokenHash: undefined
    }));

    await publishQueueRealtimeUpdate(eventId, {
      event,
      affectedEntries: cancelledEntries,
      updateWaitingPositions: true,
      forceSnapshot: true
    });

    return updatedEventDto;
  }

  const wasReenabled = !currentEvent.virtualQueueEnabled && event.virtualQueueEnabled;

  if (wasReenabled && activeEntriesBeforeUpdate.length > 0) {
    await cancelActiveQueueEntriesForEvent(eventId);
    await publishQueueRealtimeUpdate(eventId, {
      event,
      affectedEntries: activeEntriesBeforeUpdate.map((entry) => ({
        ...entry,
        status: QUEUE_STATUSES.CANCELLED,
        queueTokenHash: undefined
      })),
      updateWaitingPositions: true,
      forceSnapshot: true
    });
  }

  if (event.virtualQueueEnabled && event.queueAdmissionMode === AUTO_ADMISSION_MODE) {
    await runAutoAdmissionIfNeeded(eventId, {
      event,
      forceSnapshot: true
    });
  } else {
    const activeEntries = wasReenabled ? [] : await findActiveEntriesForEvent(eventId);

    await publishQueueRealtimeUpdate(eventId, {
      event,
      affectedEntries: activeEntries,
      updateWaitingPositions: true,
      forceSnapshot: true
    });
  }

  return updatedEventDto;
}

export async function validateQueueAccessForSeatLock(event, userId, queueToken) {
  if (!event.virtualQueueEnabled) {
    return;
  }

  if (!queueToken) {
    throw new AppError("Queue access is required for this event.", 403);
  }

  const eventId = event._id?.toString?.() || event.id || event._id;
  const entry = await findAdmittedEntryByTokenHash(eventId, userId, hashQueueToken(queueToken));

  if (!entry) {
    throw new AppError("Queue access is required for this event.", 403);
  }

  if (!entry.expiresAt || new Date(entry.expiresAt) <= new Date()) {
    const expiredEntry = await expireQueueEntryById(entry._id);
    await publishQueueRealtimeUpdate(eventId, {
      event,
      affectedEntries: expiredEntry ? [expiredEntry] : [],
      updateWaitingPositions: true,
      forceSnapshot: true
    });
    await runAutoAdmissionIfNeeded(eventId, { event });
    throw new AppError("Your queue access has expired. Please rejoin the waiting room.", 409);
  }
}

export async function expireQueueAccessesAndRunAutoAdmission() {
  const events = await findQueueEnabledEvents();

  for (const event of events) {
    const eventId = getDocumentId(event);
    const expiredEntries = await expireExpiredQueueAccessForEvent(eventId, {
      event,
      publish: true
    });

    if (event.queueAdmissionMode === AUTO_ADMISSION_MODE) {
      await runAutoAdmissionIfNeeded(eventId, {
        event,
        forceSnapshot: expiredEntries.length > 0
      });
    }
  }
}

export function startQueueMaintenanceInterval() {
  if (queueMaintenanceInterval) {
    return queueMaintenanceInterval;
  }

  queueMaintenanceInterval = setInterval(() => {
    expireQueueAccessesAndRunAutoAdmission().catch((error) => {
      console.error("Queue maintenance failed.", error);
    });
  }, QUEUE_MAINTENANCE_INTERVAL_MS);
  queueMaintenanceInterval.unref?.();
  return queueMaintenanceInterval;
}

export function stopQueueMaintenanceInterval() {
  if (!queueMaintenanceInterval) {
    return;
  }

  clearInterval(queueMaintenanceInterval);
  queueMaintenanceInterval = null;
}
