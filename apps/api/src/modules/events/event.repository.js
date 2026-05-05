import { EVENT_STATUSES } from "../../common/constants/index.js";
import { EventImage } from "./eventImage.model.js";
import { Event } from "./event.model.js";

export const PUBLIC_EVENT_STATUSES = Object.freeze([EVENT_STATUSES.PUBLISHED, EVENT_STATUSES.SELLING]);

function buildPublicEventFilter(filters = {}) {
  const query = {};
  const requestedStatus = filters.status;

  if (requestedStatus) {
    query.status = PUBLIC_EVENT_STATUSES.includes(requestedStatus) ? requestedStatus : { $in: [] };
  } else {
    query.status = { $in: PUBLIC_EVENT_STATUSES };
  }

  if (filters.keyword) {
    const pattern = new RegExp(filters.keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: pattern }, { description: pattern }, { location: pattern }];
  }

  if (filters.from || filters.to) {
    query.startTime = {};

    if (filters.from) {
      query.startTime.$gte = filters.from;
    }

    if (filters.to) {
      query.startTime.$lte = filters.to;
    }
  }

  return query;
}

export async function findPublicEvents(filters, pagination) {
  const query = buildPublicEventFilter(filters);
  const skip = (pagination.page - 1) * pagination.limit;

  const [items, total] = await Promise.all([
    Event.find(query).sort({ startTime: 1, _id: 1 }).skip(skip).limit(pagination.limit).lean(),
    Event.countDocuments(query)
  ]);

  return { items, total };
}

export function findPublicEventById(eventId) {
  return Event.findOne({
    _id: eventId,
    status: { $in: PUBLIC_EVENT_STATUSES }
  }).lean();
}

export function findEventById(eventId) {
  return Event.findById(eventId).lean();
}

export async function createEvent(eventData) {
  const event = await Event.create(eventData);
  return event.toObject();
}

export function updateEventById(eventId, update) {
  return Event.findByIdAndUpdate(eventId, update, { new: true, runValidators: true }).lean();
}

export function deleteEventById(eventId) {
  return Event.findByIdAndDelete(eventId);
}

export function findEventImages(eventId) {
  return EventImage.find({ eventId }).sort({ createdAt: 1, _id: 1 }).lean();
}

export function countEventImages(eventId) {
  return EventImage.countDocuments({ eventId });
}

export async function createEventImage(imageData) {
  const image = await EventImage.create(imageData);
  return image.toObject();
}

export function findEventImageByIdForEvent(eventId, imageId) {
  return EventImage.findOne({ _id: imageId, eventId }).lean();
}

export function deleteEventImageByIdForEvent(eventId, imageId) {
  return EventImage.findOneAndDelete({ _id: imageId, eventId });
}

export function deleteEventImagesByEventId(eventId) {
  return EventImage.deleteMany({ eventId });
}
