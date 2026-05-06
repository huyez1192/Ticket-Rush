import { EVENT_STATUSES } from "../constants/statuses";
import { getCollectionItems, getEntityId, getImageUrl, getPagination } from "./eventMappers";

function toDateTimeInputValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function normalizeAdminEvent(event) {
  const images = Array.isArray(event?.images) ? event.images : getCollectionItems(event?.images);

  return {
    ...event,
    id: getEntityId(event),
    name: event?.name || event?.title || "Untitled event",
    description: event?.description || "",
    location: event?.location || event?.venue || "Location to be announced",
    status: EVENT_STATUSES.includes(event?.status) ? event.status : event?.status || "Draft",
    startTime: event?.startTime || event?.startsAt || event?.date || "",
    endTime: event?.endTime || event?.endsAt || "",
    createdAt: event?.createdAt || "",
    updatedAt: event?.updatedAt || "",
    images,
  };
}

export function normalizeAdminEventsPayload(payload) {
  return {
    items: getCollectionItems(payload).map(normalizeAdminEvent),
    pagination: getPagination(payload),
  };
}

export function normalizeEventImage(image) {
  return {
    ...image,
    id: getEntityId(image),
    eventId: image?.eventId || "",
    imageUrl: getImageUrl(image),
    createdAt: image?.createdAt || "",
  };
}

export function normalizeEventImagesPayload(payload) {
  return getCollectionItems(payload).map(normalizeEventImage);
}

export function getEventFormInitialValues(event) {
  const normalized = normalizeAdminEvent(event || {});

  return {
    name: event ? normalized.name : "",
    description: normalized.description || "",
    location: event ? normalized.location : "",
    startTime: toDateTimeInputValue(normalized.startTime),
    endTime: toDateTimeInputValue(normalized.endTime),
    status: normalized.status || "Draft",
    imageUrls: "",
  };
}

export function buildEventPayload(values, { includeStatus = false } = {}) {
  const payload = {
    name: values.name?.trim(),
    description: values.description?.trim() || null,
    location: values.location?.trim(),
    startTime: values.startTime ? new Date(values.startTime).toISOString() : undefined,
    endTime: values.endTime ? new Date(values.endTime).toISOString() : undefined,
  };

  if (includeStatus) {
    payload.status = values.status || "Draft";
  }

  if (includeStatus && values.imageUrls?.trim()) {
    payload.imageUrls = values.imageUrls
      .split(/\r?\n|,/)
      .map((url) => url.trim())
      .filter(Boolean);
  }

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}
