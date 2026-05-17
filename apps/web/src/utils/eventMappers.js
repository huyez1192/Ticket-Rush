export function getEntityId(entity) {
  return entity?.id ?? entity?._id ?? entity?.eventId ?? "";
}

export function getImageUrl(image) {
  if (!image) {
    return "";
  }

  if (typeof image === "string") {
    return image;
  }

  return image.imageUrl || image.url || image.src || "";
}

export function getCollectionItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  return [];
}

export function getPagination(payload) {
  const pagination = payload?.pagination || payload?.meta || payload?.data?.pagination || {};
  const page = Number(pagination.page || payload?.page || 1);
  const limit = Number(pagination.limit || payload?.limit || 12);
  const total = Number(pagination.total || payload?.total || 0);
  const totalPages = Number(
    pagination.totalPages ||
      pagination.pages ||
      payload?.totalPages ||
      (total && limit ? Math.ceil(total / limit) : 1),
  );

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 12,
    total: Number.isFinite(total) ? total : 0,
    totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
  };
}

export function normalizeEvent(event) {
  const images = getCollectionItems(event?.images).length ? getCollectionItems(event.images) : event?.images || [];
  const sections = getCollectionItems(event?.sections);

  return {
    ...event,
    id: getEntityId(event),
    name: event?.name || event?.title || "Untitled event",
    description: event?.description || "",
    status: event?.status || "Published",
    location: event?.location || event?.venue || "Location to be announced",
    startTime: event?.startTime || event?.startsAt || event?.date,
    endTime: event?.endTime || event?.endsAt,
    images: Array.isArray(images) ? images : [],
    virtualQueueEnabled: Boolean(event?.virtualQueueEnabled),
    queueBatchSize: Number(event?.queueBatchSize || 50),
    queueAccessTtlMinutes: Number(event?.queueAccessTtlMinutes || 10),
    queueMaxActiveUsers: event?.queueMaxActiveUsers ?? null,
    queueAdmissionMode: event?.queueAdmissionMode || "Manual",
    minTicketPrice: normalizePrice(event?.minTicketPrice),
    startingPrice: normalizePrice(event?.startingPrice),
    sections,
  };
}

export function normalizeEventsPayload(payload) {
  const items = getCollectionItems(payload).map(normalizeEvent);
  return {
    items,
    pagination: getPagination(payload),
  };
}

export function getMinimumSectionPrice(sections = []) {
  const prices = sections
    .map((section) => Number(section?.price))
    .filter((price) => Number.isFinite(price) && price >= 0);

  if (!prices.length) {
    return null;
  }

  return Math.min(...prices);
}

export function getMinimumEventPrice(event, sections = []) {
  const eventLevelPrice = firstNumericPrice(event?.minTicketPrice, event?.startingPrice);

  if (eventLevelPrice !== null) {
    return eventLevelPrice;
  }

  return getMinimumSectionPrice(sections.length ? sections : event?.sections);
}

function normalizePrice(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
}

function firstNumericPrice(...values) {
  for (const value of values) {
    const normalized = normalizePrice(value);

    if (normalized !== null) {
      return normalized;
    }
  }

  return null;
}
