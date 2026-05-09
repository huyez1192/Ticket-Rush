export function mapWaitingQueueEntryToDto(entry) {
  if (!entry) {
    return null;
  }

  const value = typeof entry.toObject === "function" ? entry.toObject() : entry;
  const user = value.userId && typeof value.userId === "object" ? value.userId : null;

  return {
    id: value._id?.toString(),
    userId: value.userId?._id?.toString?.() || value.userId?.toString?.(),
    eventId: value.eventId?._id?.toString?.() || value.eventId?.toString?.(),
    position: value.position,
    sequenceNumber: value.sequenceNumber || value.position,
    status: value.status,
    user: user
      ? {
          id: user._id?.toString(),
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl
        }
      : undefined,
    admittedAt: value.admittedAt || null,
    expiredAt: value.expiredAt || null,
    expiresAt: value.expiresAt || value.expiredAt || null,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
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
