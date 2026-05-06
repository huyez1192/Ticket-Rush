import { getCollectionItems, getEntityId, normalizeEvent } from "./eventMappers";
import { normalizeSeatStatus } from "./seatStatus";

export function normalizeSection(section = {}) {
  return {
    ...section,
    id: getEntityId(section) || section.sectionId || "",
    eventId: section.eventId || "",
    name: section.name || "Section",
    description: section.description || "",
    price: Number.isFinite(Number(section.price)) ? Number(section.price) : 0,
  };
}

export function normalizeSeat(seat = {}, section = null) {
  const normalizedSection = section ? normalizeSection(section) : null;
  const sectionId = seat.sectionId || normalizedSection?.id || "";
  const rowNumber = Number(seat.rowNumber ?? seat.row ?? 0);
  const seatNumber = Number(seat.seatNumber ?? seat.number ?? 0);
  const code = seat.code || buildSeatCode(normalizedSection?.name, rowNumber, seatNumber);

  return {
    ...seat,
    id: getEntityId(seat) || seat.seatId || "",
    sectionId,
    sectionName: normalizedSection?.name || seat.sectionName || "Section",
    rowNumber: Number.isFinite(rowNumber) ? rowNumber : 0,
    seatNumber: Number.isFinite(seatNumber) ? seatNumber : 0,
    label: code || `Row ${rowNumber}, Seat ${seatNumber}`,
    code,
    status: normalizeSeatStatus(seat.status),
    price: Number.isFinite(Number(seat.price)) ? Number(seat.price) : normalizedSection?.price || 0,
  };
}

export function normalizeSeatLock(lock = {}) {
  const seat = lock.seat ? normalizeSeat(lock.seat) : null;
  const seatId = lock.seatId || seat?.id || "";

  return {
    ...lock,
    id: getEntityId(lock),
    seatId,
    userId: lock.userId || "",
    lockedAt: lock.lockedAt,
    expiresAt: lock.expiresAt,
    status: lock.status || "Active",
    seat,
  };
}

export function normalizeSeatMap(payload = {}, fallbackEvent = null, fallbackSections = []) {
  const sectionsById = new Map(fallbackSections.map((section) => [normalizeSection(section).id, normalizeSection(section)]));
  const mapSections = Array.isArray(payload.sections) ? payload.sections : [];
  const sections = mapSections.map((entry) => {
    const section = normalizeSection(entry.section || entry);
    sectionsById.set(section.id, section);

    return {
      section,
      seats: getCollectionItems(entry.seats).map((seat) => normalizeSeat(seat, section)),
    };
  });

  return {
    event: normalizeEvent(payload.event || fallbackEvent || {}),
    sections: sections.length
      ? sections
      : fallbackSections.map((section) => ({
          section: normalizeSection(section),
          seats: [],
        })),
    sectionsById,
  };
}

export function getActiveLockItems(payload) {
  return getCollectionItems(payload).map(normalizeSeatLock).filter((lock) => lock.status === "Active");
}

export function groupSeatsByRow(seats = []) {
  const rows = seats.reduce((result, seat) => {
    const rowKey = String(seat.rowNumber || "0");

    if (!result.has(rowKey)) {
      result.set(rowKey, []);
    }

    result.get(rowKey).push(seat);
    return result;
  }, new Map());

  return Array.from(rows.entries())
    .sort(([rowA], [rowB]) => Number(rowA) - Number(rowB))
    .map(([rowNumber, rowSeats]) => ({
      rowNumber,
      seats: rowSeats.sort((seatA, seatB) => Number(seatA.seatNumber) - Number(seatB.seatNumber)),
    }));
}

export function sortSeats(seats = []) {
  return [...seats].sort((seatA, seatB) => {
    if (seatA.rowNumber !== seatB.rowNumber) {
      return Number(seatA.rowNumber) - Number(seatB.rowNumber);
    }

    return Number(seatA.seatNumber) - Number(seatB.seatNumber);
  });
}

export function buildSeatCode(sectionName, rowNumber, seatNumber) {
  if (!rowNumber || !seatNumber) {
    return "";
  }

  return `${sectionName || "Section"}-R${rowNumber}-${seatNumber}`;
}

export function getSeatDisplayName(seat) {
  if (!seat) {
    return "Seat";
  }

  return `Row ${seat.rowNumber || "-"}, Seat ${seat.seatNumber || "-"}`;
}
