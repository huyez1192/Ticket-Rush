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

  return {
    id: value._id?.toString(),
    name: value.name,
    description: value.description,
    startTime: value.startTime,
    endTime: value.endTime,
    location: value.location,
    status: value.status,
    createdBy: value.createdBy?._id?.toString?.() || value.createdBy?.toString?.(),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
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
