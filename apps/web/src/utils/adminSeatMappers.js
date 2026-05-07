import { getCollectionItems, getEntityId } from "./eventMappers";
import { normalizeSeatStatus } from "./seatStatus";

export function normalizeAdminSection(section = {}) {
  const id = getEntityId(section) || section.sectionId || "";
  const seatCount = Number(section.seatCount ?? section.capacity ?? section.totalSeats ?? 0);
  const displayOrder = Number(section.displayOrder);
  const defaultSeatWidth = Number(section.defaultSeatWidth);
  const defaultSeatHeight = Number(section.defaultSeatHeight);

  return {
    ...section,
    id,
    eventId: section.eventId || "",
    name: section.name || "Section",
    description: section.description || "",
    price: Number.isFinite(Number(section.price)) ? Number(section.price) : 0,
    color: section.color || "",
    displayOrder: Number.isFinite(displayOrder) ? displayOrder : null,
    defaultSeatWidth: Number.isFinite(defaultSeatWidth) ? defaultSeatWidth : 32,
    defaultSeatHeight: Number.isFinite(defaultSeatHeight) ? defaultSeatHeight : 32,
    seatCount: Number.isFinite(seatCount) ? seatCount : 0,
    capacity: Number.isFinite(seatCount) ? seatCount : 0,
    createdAt: section.createdAt || "",
    updatedAt: section.updatedAt || "",
  };
}

export function normalizeAdminSectionsPayload(payload) {
  return getCollectionItems(payload).map(normalizeAdminSection).sort(compareSections);
}

export function normalizeAdminSeat(seat = {}, section = null) {
  const normalizedSection = section ? normalizeAdminSection(section) : null;
  const sectionId = seat.sectionId || normalizedSection?.id || "";
  const rowNumber = Number(seat.rowNumber ?? seat.row ?? 0);
  const seatNumber = Number(seat.seatNumber ?? seat.number ?? 0);
  const status = normalizeSeatStatus(seat.status);
  const layout = normalizeSeatLayout(seat.layout, {
    label: seat.code || seat.label || `${getRowLabel(rowNumber)}${seatNumber || ""}`,
    rowLabel: getRowLabel(rowNumber),
    width: normalizedSection?.defaultSeatWidth,
    height: normalizedSection?.defaultSeatHeight,
  });

  return {
    ...seat,
    id: getEntityId(seat) || seat.seatId || "",
    eventId: seat.eventId || "",
    sectionId,
    sectionName: normalizedSection?.name || seat.sectionName || "Section",
    rowNumber: Number.isFinite(rowNumber) ? rowNumber : 0,
    seatNumber: Number.isFinite(seatNumber) ? seatNumber : 0,
    rowLabel: getRowLabel(rowNumber),
    label: seat.code || seat.label || `${getRowLabel(rowNumber)}${seatNumber || ""}`,
    code: seat.code || `${normalizedSection?.name || "Section"}-${getRowLabel(rowNumber)}${seatNumber || ""}`,
    status,
    price: Number.isFinite(Number(seat.price)) ? Number(seat.price) : normalizedSection?.price || 0,
    layout,
    isPlaced: isSeatPlaced({ ...seat, layout }),
    createdAt: seat.createdAt || "",
    updatedAt: seat.updatedAt || "",
  };
}

export function normalizeAdminSeatsPayload(payload, sections = []) {
  const sectionsById = new Map(sections.map((section) => [normalizeAdminSection(section).id, normalizeAdminSection(section)]));

  return getCollectionItems(payload)
    .map((seat) => normalizeAdminSeat(seat, sectionsById.get(seat.sectionId)))
    .sort(compareSeats);
}

export function normalizeAdminSeatMap(payload = {}, fallbackSections = []) {
  const sectionEntries = Array.isArray(payload.sections) ? payload.sections : [];
  const sections = sectionEntries.map((entry) => {
    const section = normalizeAdminSection(entry.section || entry);
    const seats = getCollectionItems(entry.seats).map((seat) => normalizeAdminSeat(seat, section)).sort(compareSeats);
    return { section: { ...section, seatCount: seats.length, capacity: seats.length }, seats };
  });

  const presentIds = new Set(sections.map((entry) => entry.section.id));
  fallbackSections.forEach((fallbackSection) => {
    const section = normalizeAdminSection(fallbackSection);
    if (!presentIds.has(section.id)) {
      sections.push({ section, seats: [] });
    }
  });

  return {
    event: payload.event || null,
    layout: normalizeSeatMapLayout(payload.layout),
    sections: sections.sort((a, b) => compareSections(a.section, b.section)),
  };
}

export function groupSeatsBySection(seats = [], sections = []) {
  const sectionMap = new Map(sections.map((section) => [normalizeAdminSection(section).id, { section: normalizeAdminSection(section), seats: [] }]));

  seats.forEach((seat) => {
    const normalizedSeat = normalizeAdminSeat(seat);
    if (!sectionMap.has(normalizedSeat.sectionId)) {
      sectionMap.set(normalizedSeat.sectionId, {
        section: normalizeAdminSection({ id: normalizedSeat.sectionId, name: normalizedSeat.sectionName }),
        seats: [],
      });
    }
    sectionMap.get(normalizedSeat.sectionId).seats.push(normalizedSeat);
  });

  return Array.from(sectionMap.values()).map((entry) => ({
    section: entry.section,
    seats: entry.seats.sort(compareSeats),
  }));
}

export function groupSeatsByRow(seats = []) {
  const rows = seats.reduce((result, seat) => {
    const normalizedSeat = normalizeAdminSeat(seat);
    const rowKey = String(normalizedSeat.rowNumber || 0);
    if (!result.has(rowKey)) {
      result.set(rowKey, []);
    }
    result.get(rowKey).push(normalizedSeat);
    return result;
  }, new Map());

  return Array.from(rows.entries())
    .sort(([rowA], [rowB]) => Number(rowA) - Number(rowB))
    .map(([rowNumber, rowSeats]) => ({
      rowNumber: Number(rowNumber),
      rowLabel: getRowLabel(Number(rowNumber)),
      seats: rowSeats.sort(compareSeats),
    }));
}

export function getSectionSeatStats(seats = []) {
  const stats = {
    total: seats.length,
    Available: 0,
    Locked: 0,
    Sold: 0,
    Released: 0,
  };

  seats.forEach((seat) => {
    const status = normalizeSeatStatus(seat.status);
    stats[status] = (stats[status] || 0) + 1;
  });

  return stats;
}

export function buildSectionPayload(values) {
  return {
    name: values.name?.trim(),
    price: Number(values.price),
    description: values.description?.trim() || undefined,
  };
}

export function buildGenerateSeatsPayload(values) {
  const payload = {
    rows: Number(values.rows),
    seatsPerRow: Number(values.seatsPerRow),
  };

  if (values.initialStatus) {
    payload.initialStatus = values.initialStatus;
  }

  return payload;
}

export function normalizeSeatMapLayout(layout = null) {
  if (!layout) {
    return null;
  }

  const canvasWidth = Number(layout.canvasWidth);
  const canvasHeight = Number(layout.canvasHeight);
  const gridSize = Number(layout.gridSize);
  const defaultZoom = Number(layout.defaultZoom);
  const stage = layout.stage || {};
  const viewport = layout.viewport || {};

  return {
    ...layout,
    canvasWidth: Number.isFinite(canvasWidth) && canvasWidth > 0 ? canvasWidth : 1200,
    canvasHeight: Number.isFinite(canvasHeight) && canvasHeight > 0 ? canvasHeight : 720,
    gridSize: Number.isFinite(gridSize) && gridSize > 0 ? gridSize : 16,
    stage: {
      x: finiteOrDefault(stage.x, 360),
      y: finiteOrDefault(stage.y, 48),
      width: positiveOrDefault(stage.width, 480),
      height: positiveOrDefault(stage.height, 72),
      label: stage.label || "Stage",
    },
    defaultZoom: Number.isFinite(defaultZoom) && defaultZoom > 0 ? defaultZoom : 1,
    viewport: {
      x: finiteOrDefault(viewport.x, 0),
      y: finiteOrDefault(viewport.y, 0),
      zoom: positiveOrDefault(viewport.zoom, 1),
    },
  };
}

export function normalizeSeatLayout(layout = null, defaults = {}) {
  const source = layout || {};
  const x = Number(source.x);
  const y = Number(source.y);
  const rotation = Number(source.rotation);
  const width = Number(source.width);
  const height = Number(source.height);

  return {
    x: Number.isFinite(x) ? x : null,
    y: Number.isFinite(y) ? y : null,
    rotation: Number.isFinite(rotation) ? rotation : 0,
    width: Number.isFinite(width) && width > 0 ? width : positiveOrDefault(defaults.width, 32),
    height: Number.isFinite(height) && height > 0 ? height : positiveOrDefault(defaults.height, 32),
    label: source.label || defaults.label || "",
    rowLabel: source.rowLabel || defaults.rowLabel || "",
    isPlaced: source.isPlaced === true || (Number.isFinite(x) && Number.isFinite(y)),
  };
}

export function isSeatPlaced(seat = {}) {
  const layout = seat.layout || {};
  return layout.isPlaced === true || (Number.isFinite(Number(layout.x)) && Number.isFinite(Number(layout.y)));
}

export function getRowLabel(rowNumber) {
  const numericRow = Number(rowNumber);

  if (!Number.isFinite(numericRow) || numericRow <= 0) {
    return "-";
  }

  let value = numericRow;
  let label = "";

  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }

  return label;
}

function compareSections(sectionA, sectionB) {
  const displayOrderA = Number(sectionA.displayOrder);
  const displayOrderB = Number(sectionB.displayOrder);

  if (Number.isFinite(displayOrderA) && Number.isFinite(displayOrderB) && displayOrderA !== displayOrderB) {
    return displayOrderA - displayOrderB;
  }

  return String(sectionA.name || "").localeCompare(String(sectionB.name || ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function compareSeats(seatA, seatB) {
  if (Number(seatA.rowNumber) !== Number(seatB.rowNumber)) {
    return Number(seatA.rowNumber) - Number(seatB.rowNumber);
  }

  return Number(seatA.seatNumber) - Number(seatB.seatNumber);
}

function finiteOrDefault(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function positiveOrDefault(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}
