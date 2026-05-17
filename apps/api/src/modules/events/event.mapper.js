function toPlainObject(document) {
  if (!document) {
    return null;
  }

  return typeof document.toObject === "function" ? document.toObject() : document;
}

export function mapEventImageToDto(image) {
  const value = toPlainObject(image);

  if (!value) {
    return null;
  }

  return {
    id: value._id?.toString(),
    eventId: value.eventId?.toString(),
    imageUrl: value.imageUrl,
    createdAt: value.createdAt
  };
}

export function mapEventToDto(event, options = {}) {
  const value = toPlainObject(event);

  if (!value) {
    return null;
  }

  const minTicketPrice = Number(options.minTicketPrice);
  const hasMinTicketPrice = options.minTicketPrice !== null && options.minTicketPrice !== undefined && Number.isFinite(minTicketPrice);

  return {
    id: value._id?.toString(),
    name: value.name,
    description: value.description,
    startTime: value.startTime,
    endTime: value.endTime,
    location: value.location,
    status: value.status,
    virtualQueueEnabled: Boolean(value.virtualQueueEnabled),
    queueBatchSize: value.queueBatchSize ?? 50,
    queueAccessTtlMinutes: value.queueAccessTtlMinutes ?? 10,
    queueMaxActiveUsers: value.queueMaxActiveUsers ?? null,
    queueAdmissionMode: value.queueAdmissionMode || "Manual",
    createdBy: value.createdBy?._id?.toString?.() || value.createdBy?.toString?.(),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    minTicketPrice: hasMinTicketPrice ? minTicketPrice : null,
    startingPrice: hasMinTicketPrice ? minTicketPrice : null,
    images: Array.isArray(options.images) ? options.images.map((image) => mapEventImageToDto(image)).filter(Boolean) : undefined
  };
}

export function mapPagination({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 0
  };
}
