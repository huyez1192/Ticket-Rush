import { getCollectionItems, getEntityId, normalizeEvent } from "./eventMappers";
import {
  applyGlobalSeatDisplayLabelsToSections,
  compareSeatsByDisplayLabel,
  getSeatDisplayLabel as getComputedSeatDisplayLabel,
} from "./seatDisplayLabels";
import { normalizeSeatStatus } from "./seatStatus";
import { normalizeSeatShape } from "../constants/seatShapes";

export { getComputedSeatDisplayLabel as getSeatDisplayLabel };

export function normalizeSection(section = {}) {
  const displayOrder = Number(section.displayOrder);
  const defaultSeatWidth = Number(section.defaultSeatWidth);
  const defaultSeatHeight = Number(section.defaultSeatHeight);

  return {
    ...section,
    id: getEntityId(section) || section.sectionId || "",
    eventId: section.eventId || "",
    name: section.name || "Section",
    description: section.description || "",
    price: Number.isFinite(Number(section.price)) ? Number(section.price) : 0,
    color: section.color || "",
    displayOrder: Number.isFinite(displayOrder) ? displayOrder : null,
    defaultSeatWidth: Number.isFinite(defaultSeatWidth) && defaultSeatWidth > 0 ? defaultSeatWidth : 32,
    defaultSeatHeight: Number.isFinite(defaultSeatHeight) && defaultSeatHeight > 0 ? defaultSeatHeight : 32,
    seatShape: normalizeSeatShape(section.seatShape),
  };
}

export function normalizeSeat(seat = {}, section = null) {
  const normalizedSection = section ? normalizeSection(section) : null;
  const sectionId = seat.sectionId || normalizedSection?.id || "";
  const rowNumber = Number(seat.rowNumber ?? seat.row ?? 0);
  const seatNumber = Number(seat.seatNumber ?? seat.number ?? 0);
  const code = seat.code || buildSeatCode(normalizedSection?.name, rowNumber, seatNumber);
  const rowLabel = seat.rowLabel || getRowLabel(rowNumber);
  const layout = normalizeSeatLayout(seat.layout, {
    label: seat.layout?.label || seat.label || code || `${rowLabel}${seatNumber || ""}`,
    rowLabel,
    width: normalizedSection?.defaultSeatWidth,
    height: normalizedSection?.defaultSeatHeight,
  });

  return {
    ...seat,
    id: getEntityId(seat) || seat.seatId || "",
    sectionId,
    sectionName: normalizedSection?.name || seat.sectionName || "Section",
    seatShape: normalizeSeatShape(normalizedSection?.seatShape || seat.seatShape),
    rowNumber: Number.isFinite(rowNumber) ? rowNumber : 0,
    seatNumber: Number.isFinite(seatNumber) ? seatNumber : 0,
    rowLabel,
    label: code || `Row ${rowNumber}, Seat ${seatNumber}`,
    code,
    status: normalizeSeatStatus(seat.status),
    price: Number.isFinite(Number(seat.price)) ? Number(seat.price) : normalizedSection?.price || 0,
    layout,
    isPlaced: isSeatPlaced({ ...seat, layout }),
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
  const resolvedSections = sections.length
    ? applyGlobalSeatDisplayLabelsToSections(sections)
    : fallbackSections.map((section) => ({
        section: normalizeSection(section),
        seats: [],
      }));

  return {
    event: normalizeEvent(payload.event || fallbackEvent || {}),
    layout: normalizeSeatMapLayout(payload.layout),
    sections: resolvedSections,
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
      rowLabel: rowSeats[0]?.displayRowLabel || rowSeats[0]?.rowLabel || getRowLabel(Number(rowNumber)),
      seats: rowSeats.sort((seatA, seatB) => Number(seatA.seatNumber) - Number(seatB.seatNumber)),
    }));
}

export function sortSeats(seats = []) {
  return [...seats].sort((seatA, seatB) => {
    const displayCompare = compareSeatsByDisplayLabel(seatA, seatB);

    if (displayCompare !== 0) {
      return displayCompare;
    }

    const sectionCompare = String(seatA.sectionName || "").localeCompare(String(seatB.sectionName || ""), undefined, {
      numeric: true,
      sensitivity: "base",
    });

    if (sectionCompare !== 0 && seatA.sectionId !== seatB.sectionId) {
      return sectionCompare;
    }

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

  return getComputedSeatDisplayLabel(seat);
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

function finiteOrDefault(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function positiveOrDefault(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}
