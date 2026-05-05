import { AppError } from "../../common/errors/AppError.js";
import { mapEventImageToDto, mapEventToDto, mapPagination } from "./event.mapper.js";
import {
  createEvent,
  createEventImage,
  deleteEventById,
  deleteEventImageByIdForEvent,
  deleteEventImagesByEventId,
  findEventById,
  findEventImageByIdForEvent,
  findEventImages,
  findPublicEventById,
  findPublicEvents,
  updateEventById
} from "./event.repository.js";
import { deleteSeatSectionsByEventId, deleteSeatsByEventId } from "../seats/seat.repository.js";

const STATUS_TRANSITIONS = Object.freeze({
  Published: ["Draft"],
  Selling: ["Published"],
  Closed: ["Selling"],
  Cancelled: ["Published", "Selling"]
});

function normalizeEventPayload(payload) {
  return {
    ...payload,
    startTime: payload.startTime ? new Date(payload.startTime) : undefined,
    endTime: payload.endTime ? new Date(payload.endTime) : undefined
  };
}

function assertValidEventTimes(currentEvent, update) {
  const startTime = update.startTime || currentEvent?.startTime;
  const endTime = update.endTime || currentEvent?.endTime;

  if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
    throw new AppError("Event endTime must be after startTime.", 400);
  }
}

function assertStatusTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) {
    return;
  }

  const allowedFrom = STATUS_TRANSITIONS[nextStatus] || [];

  if (!allowedFrom.includes(currentStatus)) {
    throw new AppError(`Cannot change event status from ${currentStatus} to ${nextStatus}.`, 400);
  }
}

export async function getPublicEvents(query) {
  const pagination = {
    page: query.page,
    limit: query.limit
  };

  const { items, total } = await findPublicEvents(query, pagination);
  const imagesByEventId = new Map();
  const imageGroups = await Promise.all(items.map((event) => findEventImages(event._id)));

  items.forEach((event, index) => {
    imagesByEventId.set(event._id.toString(), imageGroups[index]);
  });

  return {
    items: items.map((event) => mapEventToDto(event, { images: imagesByEventId.get(event._id.toString()) || [] })),
    pagination: mapPagination({ ...pagination, total })
  };
}

export async function getPublicEventDetail(eventId) {
  const event = await findPublicEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  const images = await findEventImages(eventId);

  return mapEventToDto(event, { images });
}

export async function getPublicEventImages(eventId) {
  const event = await findPublicEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  const images = await findEventImages(eventId);

  return {
    items: images.map((image) => mapEventImageToDto(image)),
    pagination: mapPagination({ page: 1, limit: images.length || 20, total: images.length })
  };
}

export async function createAdminEvent(payload, adminUserId) {
  const normalizedPayload = normalizeEventPayload(payload);
  const imageUrls = normalizedPayload.imageUrls || [];
  delete normalizedPayload.imageUrls;

  const event = await createEvent({
    ...normalizedPayload,
    createdBy: adminUserId
  });

  const images = await Promise.all(
    imageUrls.map((imageUrl) =>
      createEventImage({
        eventId: event._id,
        imageUrl
      })
    )
  );

  return mapEventToDto(event, { images });
}

export async function updateAdminEvent(eventId, payload) {
  const event = await findEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  const update = normalizeEventPayload(payload);
  assertValidEventTimes(event, update);

  const updatedEvent = await updateEventById(eventId, update);

  return mapEventToDto(updatedEvent);
}

export async function deleteAdminEvent(eventId) {
  const event = await findEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  await deleteEventImagesByEventId(eventId);
  await deleteSeatsByEventId(eventId);
  await deleteSeatSectionsByEventId(eventId);
  await deleteEventById(eventId);
}

export async function changeAdminEventStatus(eventId, nextStatus) {
  const event = await findEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  assertStatusTransition(event.status, nextStatus);

  const updatedEvent = await updateEventById(eventId, { status: nextStatus });

  return mapEventToDto(updatedEvent);
}

export async function createAdminEventImage(eventId, payload) {
  const event = await findEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  const image = await createEventImage({
    eventId,
    imageUrl: payload.imageUrl
  });

  return mapEventImageToDto(image);
}

export async function deleteAdminEventImage(eventId, imageId) {
  const event = await findEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  const image = await findEventImageByIdForEvent(eventId, imageId);

  if (!image) {
    throw new AppError("Event image not found.", 404);
  }

  await deleteEventImageByIdForEvent(eventId, imageId);
}
