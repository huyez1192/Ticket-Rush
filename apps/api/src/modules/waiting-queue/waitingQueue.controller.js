import { sendNoContent, sendSuccess } from "../../common/responses/apiResponse.js";
import {
  admitQueueBatch,
  getMyQueueEntry,
  getMyQueueEntryForEvent,
  joinEventQueue,
  joinQueue,
  leaveEventQueue,
  leaveQueue,
  listAdminQueueEntries,
  updateAdminEventQueueConfig
} from "./waitingQueue.service.js";

export async function joinWaitingQueue(req, res, next) {
  try {
    const entry = await joinQueue(req.user.id, req.body);
    sendSuccess(res, 200, "Queue entry returned successfully.", entry);
  } catch (error) {
    next(error);
  }
}

export async function joinEventWaitingQueue(req, res, next) {
  try {
    const result = await joinEventQueue(req.params.eventId, req.user.id);
    sendSuccess(res, 200, result.accessGranted ? "Access granted." : "Joined queue.", result);
  } catch (error) {
    next(error);
  }
}

export async function getWaitingQueueEntry(req, res, next) {
  try {
    const entry = await getMyQueueEntry(req.params.queueId, req.user.id);
    sendSuccess(res, 200, "Queue entry retrieved successfully.", entry);
  } catch (error) {
    next(error);
  }
}

export async function leaveWaitingQueue(req, res, next) {
  try {
    await leaveQueue(req.params.queueId, req.user.id);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

export async function leaveMyEventQueue(req, res, next) {
  try {
    await leaveEventQueue(req.params.eventId, req.user.id);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

export async function getMyEventQueueEntry(req, res, next) {
  try {
    const entry = await getMyQueueEntryForEvent(req.params.eventId, req.user.id);
    sendSuccess(res, 200, "Queue entry retrieved successfully.", entry);
  } catch (error) {
    next(error);
  }
}

export async function adminListEventQueue(req, res, next) {
  try {
    const result = await listAdminQueueEntries(req.params.eventId, req.query);
    sendSuccess(res, 200, "Queue entries retrieved successfully.", result);
  } catch (error) {
    next(error);
  }
}

export async function adminAdmitQueueBatch(req, res, next) {
  try {
    const result = await admitQueueBatch(req.params.eventId, req.body);
    sendSuccess(res, 200, "Queue entries admitted successfully.", result);
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateEventQueueConfig(req, res, next) {
  try {
    const result = await updateAdminEventQueueConfig(req.params.eventId, req.body);
    sendSuccess(res, 200, "Queue configuration updated successfully.", result);
  } catch (error) {
    next(error);
  }
}
