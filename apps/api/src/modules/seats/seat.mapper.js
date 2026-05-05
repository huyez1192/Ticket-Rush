function toPlainObject(document) {
  if (!document) {
    return null;
  }

  return typeof document.toObject === "function" ? document.toObject() : document;
}

function getSectionFromSeat(seat) {
  return seat.sectionId && typeof seat.sectionId === "object" ? seat.sectionId : null;
}

export function mapSeatSectionToDto(section) {
  const value = toPlainObject(section);

  if (!value) {
    return null;
  }

  return {
    id: value._id?.toString(),
    eventId: value.eventId?.toString(),
    name: value.name,
    price: value.price,
    description: value.description,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}

export function mapSeatToDto(seat) {
  const value = toPlainObject(seat);

  if (!value) {
    return null;
  }

  const section = getSectionFromSeat(value);
  const sectionId = section?._id || value.sectionId;
  const sectionName = section?.name || "SECTION";

  return {
    id: value._id?.toString(),
    sectionId: sectionId?.toString(),
    rowNumber: value.rowNumber,
    seatNumber: value.seatNumber,
    code: `${sectionName}-R${value.rowNumber}-${value.seatNumber}`,
    status: value.status,
    price: section?.price,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}

export function mapSeatMapSectionToDto(section, seats) {
  return {
    section: mapSeatSectionToDto(section),
    seats: seats.map((seat) => mapSeatToDto(seat)).filter(Boolean)
  };
}

export function mapSeatMapChangeToDto(seat) {
  const value = toPlainObject(seat);
  const section = getSectionFromSeat(value);
  const sectionId = section?._id || value.sectionId;

  return {
    seatId: value._id?.toString(),
    sectionId: sectionId?.toString(),
    rowNumber: value.rowNumber,
    seatNumber: value.seatNumber,
    newStatus: value.status,
    changedAt: value.updatedAt
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
