import { QUEUE_STATUSES } from "../common/constants/index.js";
import {
  emitToQueueAdmin,
  emitToQueueEvent,
  emitToQueueUser,
  hasSocketServer
} from "./socketHub.js";

export function isRealtimeReady() {
  return hasSocketServer();
}

export function buildQueueSummaryPayload(summary = {}) {
  return {
    eventId: summary.eventId,
    waiting: Number(summary.Waiting ?? summary.waiting ?? 0),
    admitted: Number(summary.Admitted ?? summary.admitted ?? 0),
    expired: Number(summary.Expired ?? summary.expired ?? 0),
    cancelled: Number(summary.Cancelled ?? summary.cancelled ?? 0)
  };
}

export function buildQueueStatePayload(eventId, response = {}) {
  const queue = response.queue || null;
  const queueRequired = Boolean(response.queueRequired);
  const status = queueRequired ? queue?.status || "None" : "None";
  const expiresAt = response.expiresAt || queue?.expiresAt || null;
  const isAdmitted =
    queueRequired &&
    status === QUEUE_STATUSES.ADMITTED &&
    expiresAt &&
    new Date(expiresAt).getTime() > Date.now();
  const position = isAdmitted ? 0 : status === QUEUE_STATUSES.WAITING ? Number(queue?.position || response.position || 0) : null;
  const payload = {
    eventId,
    queueRequired,
    status,
    position,
    accessGranted: queueRequired ? Boolean(isAdmitted || response.accessGranted) : true,
    expiresAt,
    queue
  };

  if (payload.accessGranted && response.queueToken) {
    payload.queueToken = response.queueToken;
  }

  return payload;
}

export function emitCustomerQueueState(eventId, userId, state) {
  emitToQueueUser(eventId, userId, "queue:state", state);
}

export function emitCustomerPositionUpdated(eventId, userId, payload) {
  emitToQueueUser(eventId, userId, "queue:position-updated", {
    eventId,
    ...payload
  });
}

export function emitQueueSummary(eventId, summary) {
  const payload = buildQueueSummaryPayload({ ...summary, eventId });
  emitToQueueEvent(eventId, "queue:summary", payload);
  emitToQueueAdmin(eventId, "queue:summary", payload);
}

export function emitAdminQueueUpdate(eventId, payload) {
  emitToQueueAdmin(eventId, "admin:queue:update", {
    eventId,
    ...payload
  });
}
