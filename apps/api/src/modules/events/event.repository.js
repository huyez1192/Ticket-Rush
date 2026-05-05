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

export function findEventImages(eventId) {
  return EventImage.find({ eventId }).sort({ createdAt: 1, _id: 1 }).lean();
}

export function countEventImages(eventId) {
  return EventImage.countDocuments({ eventId });
}
