import { EVENT_STATUSES } from "../../common/constants/index.js";
import { sendNoContent, sendSuccess } from "../../common/responses/apiResponse.js";
import {
  changeAdminEventStatus,
  createAdminEvent,
  createAdminEventImage,
  deleteAdminEvent,
  deleteAdminEventImage,
  getEventDetail as getEventDetailForViewer,
  getEventImages,
  getEvents,
  updateAdminEvent
} from "./event.service.js";

export async function listEvents(req, res, next) {
  try {
    const data = await getEvents(req.query, req.user);
    sendSuccess(res, 200, "Events fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function getEventDetail(req, res, next) {
  try {
    const data = await getEventDetailForViewer(req.params.eventId, req.user);
    sendSuccess(res, 200, "Event fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function listEventImages(req, res, next) {
  try {
    const data = await getEventImages(req.params.eventId, req.user);
    sendSuccess(res, 200, "Event images fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function createEvent(req, res, next) {
  try {
    const data = await createAdminEvent(req.body, req.user.id);
    sendSuccess(res, 200, "Event created successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function updateEvent(req, res, next) {
  try {
    const data = await updateAdminEvent(req.params.eventId, req.body);
    sendSuccess(res, 200, "Event updated successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function deleteEvent(req, res, next) {
  try {
    await deleteAdminEvent(req.params.eventId);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

export async function publishEvent(req, res, next) {
  try {
    const data = await changeAdminEventStatus(req.params.eventId, EVENT_STATUSES.PUBLISHED);
    sendSuccess(res, 200, "Event published successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function openSellingEvent(req, res, next) {
  try {
    const data = await changeAdminEventStatus(req.params.eventId, EVENT_STATUSES.SELLING);
    sendSuccess(res, 200, "Event opened for selling successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function closeEvent(req, res, next) {
  try {
    const data = await changeAdminEventStatus(req.params.eventId, EVENT_STATUSES.CLOSED);
    sendSuccess(res, 200, "Event closed successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function cancelEvent(req, res, next) {
  try {
    const data = await changeAdminEventStatus(req.params.eventId, EVENT_STATUSES.CANCELLED);
    sendSuccess(res, 200, "Event cancelled successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function addEventImage(req, res, next) {
  try {
    const data = await createAdminEventImage(req.params.eventId, req.body);
    sendSuccess(res, 200, "Event image created successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function deleteEventImage(req, res, next) {
  try {
    await deleteAdminEventImage(req.params.eventId, req.params.id);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}
