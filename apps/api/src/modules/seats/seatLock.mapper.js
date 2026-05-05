import { mapSeatToDto } from "./seat.mapper.js";

function toPlainObject(document) {
  if (!document) {
    return null;
  }

  return typeof document.toObject === "function" ? document.toObject() : document;
}

export function mapSeatLockToDto(lock) {
  const value = toPlainObject(lock);

  if (!value) {
    return null;
  }

  return {
    id: value._id?.toString(),
    seatId: value.seatId?._id?.toString?.() || value.seatId?.toString?.(),
    userId: value.userId?._id?.toString?.() || value.userId?.toString?.(),
    lockedAt: value.lockedAt,
    expiresAt: value.expiresAt,
    seat: value.seatId && typeof value.seatId === "object" ? mapSeatToDto(value.seatId) : undefined,
    status: value.status
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
