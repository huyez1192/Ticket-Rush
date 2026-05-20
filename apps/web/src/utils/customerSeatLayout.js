import {
  getRowLabel,
  isSeatPlaced,
  normalizeSeatLayout,
  normalizeSeatMapLayout,
} from "./seatMappers";
import { applyGlobalSeatDisplayLabelsToSeats, getSeatDisplayLabel } from "./seatDisplayLabels";

export const CUSTOMER_DEFAULT_LAYOUT = {
  canvasWidth: 1200,
  canvasHeight: 720,
  gridSize: 16,
  stage: {
    x: 360,
    y: 48,
    width: 480,
    height: 72,
    label: "Stage",
  },
  defaultZoom: 1,
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
};

export function getCustomerLayoutConfig(layout, seats = []) {
  const normalized = normalizeCustomerSeatMapLayout(layout);

  const bounds = getSeatBounds(seats);

  return {
    ...CUSTOMER_DEFAULT_LAYOUT,
    ...normalized,
    stage: {
      ...CUSTOMER_DEFAULT_LAYOUT.stage,
      ...(normalized.stage || {}),
    },
    viewport: {
      ...CUSTOMER_DEFAULT_LAYOUT.viewport,
      ...(normalized.viewport || {}),
    },
    canvasWidth: Math.max(normalized.canvasWidth, bounds.maxX + 80),
    canvasHeight: Math.max(normalized.canvasHeight, bounds.maxY + 80),
  };
}

export function normalizeCustomerSeatMapLayout(layout = null, seats = []) {
  const normalized = normalizeSeatMapLayout(layout);
  const bounds = getSeatBounds(seats);
  const canvasWidth = Math.max(normalized?.canvasWidth || CUSTOMER_DEFAULT_LAYOUT.canvasWidth, bounds.maxX + 80);
  const canvasHeight = Math.max(normalized?.canvasHeight || CUSTOMER_DEFAULT_LAYOUT.canvasHeight, bounds.maxY + 80);
  const stageWidth = Math.min(480, Math.max(320, canvasWidth - 160));

  return {
    ...CUSTOMER_DEFAULT_LAYOUT,
    ...(normalized || {}),
    canvasWidth,
    canvasHeight,
    stage: {
      ...CUSTOMER_DEFAULT_LAYOUT.stage,
      x: Math.max(56, Math.round((canvasWidth - stageWidth) / 2)),
      y: CUSTOMER_DEFAULT_LAYOUT.stage.y,
      width: stageWidth,
      height: CUSTOMER_DEFAULT_LAYOUT.stage.height,
      label: normalized?.stage?.label || CUSTOMER_DEFAULT_LAYOUT.stage.label,
      ...(normalized?.stage || {}),
    },
    viewport: {
      ...CUSTOMER_DEFAULT_LAYOUT.viewport,
      ...(normalized?.viewport || {}),
    },
  };
}

export function flattenCustomerSeatMap(sections = []) {
  return sections.flatMap((entry, sectionIndex) =>
    (entry.seats || []).map((seat) => ({
      ...seat,
      section: entry.section,
      sectionIndex,
      sectionName: seat.sectionName || entry.section?.name || "Section",
      seatShape: seat.seatShape || entry.section?.seatShape,
    })),
  );
}

export function getPlacedCustomerSeats(seats = []) {
  return seats.filter((seat) => isSeatPlaced(seat));
}

export function getUnplacedCustomerSeats(seats = []) {
  return seats.filter((seat) => !isSeatPlaced(seat));
}

export function shouldUseCustomerCoordinateMap(layout, seats = []) {
  return Boolean(normalizeCustomerSeatMapLayout(layout) && seats.length > 0);
}

export function groupCustomerSeatsBySection(seats = [], sections = []) {
  const entriesBySection = new Map(
    sections.map((section) => [
      section.id,
      {
        section,
        seats: [],
      },
    ]),
  );

  seats.forEach((seat) => {
    const sectionId = seat.sectionId || seat.section?.id || "";

    if (!entriesBySection.has(sectionId)) {
      entriesBySection.set(sectionId, {
        section: seat.section || {
          id: sectionId,
          name: seat.sectionName || "Section",
          price: seat.price || 0,
          seatShape: seat.seatShape,
        },
        seats: [],
      });
    }

    entriesBySection.get(sectionId).seats.push(seat);
  });

  return Array.from(entriesBySection.values()).filter((entry) => entry.seats.length);
}

export function getCoordinateSeatLayout(seat) {
  return normalizeSeatLayout(seat.layout, {
    label: seat.layout?.label || getSeatDisplayLabel(seat),
    rowLabel: seat.rowLabel,
    width: seat.section?.defaultSeatWidth,
    height: seat.section?.defaultSeatHeight,
  });
}

export function buildCustomerCoordinateSeatMap(layout, sections = []) {
  const flatSeats = flattenCustomerSeatMap(sections);

  if (!flatSeats.length) {
    return {
      layout: normalizeCustomerSeatMapLayout(layout),
      seats: [],
    };
  }

  const baseLayout = normalizeCustomerSeatMapLayout(layout, flatSeats);
  const fallbackLayouts = buildCustomerCoordinateFallbackFromMatrix(sections, baseLayout, flatSeats);
  const seatsWithLayouts = flatSeats.map((seat) => {
    const savedLayout = normalizeSeatLayout(seat.layout, {
      label: getSeatDisplayLabel(seat),
      rowLabel: seat.rowLabel || getRowLabel(seat.rowNumber),
      width: seat.section?.defaultSeatWidth,
      height: seat.section?.defaultSeatHeight,
    });
    const shouldUseSavedLayout = isSeatPlaced({ ...seat, layout: savedLayout });
    const nextLayout = shouldUseSavedLayout ? savedLayout : fallbackLayouts[seat.id];

    return {
      ...seat,
      layout: nextLayout,
      isPlaced: true,
    };
  });
  const seats = applyGlobalSeatDisplayLabelsToSeats(seatsWithLayouts);

  return {
    layout: normalizeCustomerSeatMapLayout(layout, seats),
    seats,
  };
}

export function hasUsableFreeformLayout(layout, seats = []) {
  return Boolean(normalizeSeatMapLayout(layout) && getPlacedCustomerSeats(seats).length > 0);
}

export function mergePlacedAndFallbackSeatLayouts(layout, sections = []) {
  return buildCustomerCoordinateSeatMap(layout, sections);
}

export function buildCustomerCoordinateFallbackFromMatrix(sections = [], layout = CUSTOMER_DEFAULT_LAYOUT, allSeats = []) {
  const placedBounds = getSeatBounds(getPlacedCustomerSeats(allSeats));
  const seatWidth = 32;
  const seatHeight = 32;
  const seatGapX = 12;
  const seatGapY = 14;
  const sectionGapX = 56;
  const sectionGapY = 64;
  const sidePadding = 56;
  const stageBottom = Number(layout.stage?.y || 48) + Number(layout.stage?.height || 72);
  const startY = Math.max(stageBottom + 72, placedBounds.maxY ? placedBounds.maxY + 80 : 0);
  const maxCanvasX = Math.max(Number(layout.canvasWidth || CUSTOMER_DEFAULT_LAYOUT.canvasWidth) - sidePadding, 320);
  const fallbackLayouts = {};
  let cursorX = sidePadding;
  let cursorY = startY;
  let rowHeight = 0;

  sections.forEach((entry) => {
    const section = entry.section || {};
    const seats = (entry.seats || []).filter((seat) => {
      const flatSeat = {
        ...seat,
        section,
        sectionName: seat.sectionName || section.name || "Section",
        seatShape: seat.seatShape || section.seatShape,
      };
      return !isSeatPlaced(flatSeat);
    });

    if (!seats.length) {
      return;
    }

    const rows = groupSeatsByMatrixRow(seats);
    const maxColumns = rows.reduce((max, row) => Math.max(max, row.seats.length), 0);
    const blockWidth = Math.max(maxColumns * seatWidth + Math.max(0, maxColumns - 1) * seatGapX, 180);
    const blockHeight = rows.length * seatHeight + Math.max(0, rows.length - 1) * seatGapY + 34;

    if (cursorX > sidePadding && cursorX + blockWidth > maxCanvasX) {
      cursorX = sidePadding;
      cursorY += rowHeight + sectionGapY;
      rowHeight = 0;
    }

    rows.forEach((row, rowIndex) => {
      row.seats.forEach((seat, seatIndex) => {
        const rowLabel = seat.rowLabel || getRowLabel(seat.rowNumber);
        fallbackLayouts[seat.id] = {
          x: cursorX + seatIndex * (seatWidth + seatGapX),
          y: cursorY + 34 + rowIndex * (seatHeight + seatGapY),
          rotation: 0,
          width: Number(section.defaultSeatWidth) > 0 ? Number(section.defaultSeatWidth) : seatWidth,
          height: Number(section.defaultSeatHeight) > 0 ? Number(section.defaultSeatHeight) : seatHeight,
          label: `${rowLabel}${seat.seatNumber || ""}`,
          rowLabel,
          isPlaced: true,
        };
      });
    });

    cursorX += blockWidth + sectionGapX;
    rowHeight = Math.max(rowHeight, blockHeight);
  });

  return fallbackLayouts;
}

function getSeatBounds(seats = []) {
  return seats.reduce(
    (bounds, seat) => {
      if (!isSeatPlaced(seat)) {
        return bounds;
      }

      const layout = getCoordinateSeatLayout(seat);
      return {
        maxX: Math.max(bounds.maxX, Number(layout.x || 0) + Number(layout.width || 32)),
        maxY: Math.max(bounds.maxY, Number(layout.y || 0) + Number(layout.height || 32)),
      };
    },
    { maxX: 0, maxY: 0 },
  );
}

function groupSeatsByMatrixRow(seats = []) {
  const rowMap = seats.reduce((result, seat) => {
    const rowNumber = Number(seat.rowNumber || 0);
    if (!result.has(rowNumber)) {
      result.set(rowNumber, []);
    }
    result.get(rowNumber).push(seat);
    return result;
  }, new Map());

  return Array.from(rowMap.entries())
    .sort(([rowA], [rowB]) => rowA - rowB)
    .map(([rowNumber, rowSeats]) => ({
      rowNumber,
      seats: rowSeats.sort((seatA, seatB) => Number(seatA.seatNumber || 0) - Number(seatB.seatNumber || 0)),
    }));
}

function getCompactSeatLabel(seat) {
  return getSeatDisplayLabel(seat);
}
