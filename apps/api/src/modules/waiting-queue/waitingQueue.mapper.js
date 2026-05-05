export function mapWaitingQueueEntryToDto(entry) {
  if (!entry) {
    return null;
  }

  const value = typeof entry.toObject === "function" ? entry.toObject() : entry;
  const token = value.token || null;

  return {
    id: value._id?.toString(),
    userId: value.userId?._id?.toString?.() || value.userId?.toString?.(),
    eventId: value.eventId?._id?.toString?.() || value.eventId?.toString?.(),
    position: value.position,
    status: value.status,
    admissionToken: token,
    token,
    admittedAt: value.admittedAt || null,
    expiredAt: value.expiredAt || null,
    createdAt: value.createdAt
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
