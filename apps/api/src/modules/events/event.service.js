import { AppError } from "../../common/errors/AppError.js";
import { ROLES } from "../../common/constants/index.js";
import { mapEventImageToDto, mapEventToDto, mapPagination } from "./event.mapper.js";
import {
  countOrderItemsBySeatIds,
  countOrdersByEventId
} from "../bookings/order.repository.js";
import { countSeatLocksBySeatIds } from "../seats/seatLock.repository.js";
import { countTicketsByEventId } from "../tickets/ticket.repository.js";
import {
  deleteSeatSectionsByEventId,
  deleteSeatsByEventId,
  findMinimumSeatSectionPricesByEventIds,
  findSeatIdsByEventId
} from "../seats/seat.repository.js";
import {
  createEvent,
  createEventImage,
  deleteEventById,
  deleteEventImageByIdForEvent,
  deleteEventImagesByEventId,
  findEvents,
  findEventById,
  findEventImageByIdForEvent,
  findEventImages,
  findPublicEventById,
  findPublicEvents,
  updateEventById
} from "./event.repository.js";

const STATUS_TRANSITIONS = Object.freeze({
  Published: ["Draft"],
  Selling: ["Published"],
  Closed: ["Selling"],
  Cancelled: ["Published", "Selling"]
});

function isAdminUser(user) {
  return Array.isArray(user?.roles) && user.roles.includes(ROLES.ADMIN);
}

function normalizeEventPayload(payload) {
  return {
    ...payload,
    startTime: payload.startTime ? new Date(payload.startTime) : undefined,
    endTime: payload.endTime ? new Date(payload.endTime) : undefined,
    queueMaxActiveUsers: payload.queueMaxActiveUsers ?? undefined
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

async function assertEventCanBeDeleted(eventId) {
  const seatRecords = await findSeatIdsByEventId(eventId);
  const seatIds = seatRecords.map((seat) => seat._id);
  const [orderCount, orderItemCount, ticketCount, seatLockCount] = await Promise.all([
    countOrdersByEventId(eventId),
    seatIds.length > 0 ? countOrderItemsBySeatIds(seatIds) : 0,
    countTicketsByEventId(eventId),
    seatIds.length > 0 ? countSeatLocksBySeatIds(seatIds) : 0
  ]);

  if (orderCount > 0 || orderItemCount > 0 || ticketCount > 0 || seatLockCount > 0) {
    throw new AppError(
      "Cannot delete an event with related orders, order items, tickets, or seat locks.",
      409
    );
  }
}

export async function getPublicEvents(query) {
  return getEvents(query);
}

export async function getEvents(query, user) {
  const pagination = {
    page: query.page,
    limit: query.limit
  };

  const adminUser = isAdminUser(user);
  const { items, total } = adminUser
    ? await findEvents(query, pagination, { publicOnly: false })
    : await findPublicEvents(query, pagination);
  const imagesByEventId = new Map();
  const eventIds = items.map((event) => event._id);
  const [imageGroups, minPricesByEventId] = await Promise.all([
    Promise.all(items.map((event) => findEventImages(event._id))),
    findMinimumSeatSectionPricesByEventIds(eventIds)
  ]);

  items.forEach((event, index) => {
    imagesByEventId.set(event._id.toString(), imageGroups[index]);
  });

  return {
    items: items.map((event) => {
      const eventId = event._id.toString();

      return mapEventToDto(event, {
        images: imagesByEventId.get(eventId) || [],
        minTicketPrice: minPricesByEventId.get(eventId) ?? null
      });
    }),
    pagination: mapPagination({ ...pagination, total })
  };
}

export async function getPublicEventDetail(eventId) {
  return getEventDetail(eventId);
}

export async function getEventDetail(eventId, user) {
  const event = isAdminUser(user) ? await findEventById(eventId) : await findPublicEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  const [images, minPricesByEventId] = await Promise.all([
    findEventImages(eventId),
    findMinimumSeatSectionPricesByEventIds([event._id])
  ]);

  return mapEventToDto(event, { images, minTicketPrice: minPricesByEventId.get(event._id.toString()) ?? null });
}

export async function getPublicEventImages(eventId) {
  return getEventImages(eventId);
}

export async function getEventImages(eventId, user) {
  const event = isAdminUser(user) ? await findEventById(eventId) : await findPublicEventById(eventId);

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

  if (Object.prototype.hasOwnProperty.call(payload, "status")) {
    throw new AppError("Event status cannot be changed through general update. Use a dedicated status endpoint.", 400);
  }

  const update = normalizeEventPayload(payload);
  assertValidEventTimes(event, update);

  const updatedEvent = await updateEventById(eventId, update);

  return mapEventToDto(updatedEvent);
}

export async function updateAdminEventQueueConfig(eventId, payload) {
  const event = await findEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  const updatedEvent = await updateEventById(eventId, {
    virtualQueueEnabled: payload.virtualQueueEnabled,
    queueBatchSize: payload.queueBatchSize,
    queueAccessTtlMinutes: payload.queueAccessTtlMinutes,
    queueMaxActiveUsers: payload.queueMaxActiveUsers ?? null,
    queueAdmissionMode: payload.queueAdmissionMode || "Manual"
  });

  return mapEventToDto(updatedEvent);
}

export async function deleteAdminEvent(eventId) {
  const event = await findEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  await assertEventCanBeDeleted(eventId);

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
