import {
  isSeatPlaced,
  normalizeSeatLayout,
  normalizeSeatMapLayout,
} from "./seatMappers";

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
  const normalized = normalizeSeatMapLayout(layout);

  if (!normalized) {
    return null;
  }

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

export function flattenCustomerSeatMap(sections = []) {
  return sections.flatMap((entry) =>
    (entry.seats || []).map((seat) => ({
      ...seat,
      section: entry.section,
      sectionName: seat.sectionName || entry.section?.name || "Section",
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
  return Boolean(normalizeSeatMapLayout(layout) && getPlacedCustomerSeats(seats).length > 0);
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
    label: seat.layout?.label || seat.label || seat.code,
    rowLabel: seat.rowLabel,
    width: seat.section?.defaultSeatWidth,
    height: seat.section?.defaultSeatHeight,
  });
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
