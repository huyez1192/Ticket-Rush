import {
  getRowLabel,
  isSeatPlaced,
  normalizeSeatLayout,
  normalizeSeatMapLayout,
} from "./adminSeatMappers";

export const DEFAULT_LAYOUT_CONFIG = {
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

export function getEffectiveLayoutConfig(layout, seats = []) {
  const normalized = normalizeSeatMapLayout(layout) || DEFAULT_LAYOUT_CONFIG;
  const bounds = computeSeatBounds(seats);

  return {
    ...DEFAULT_LAYOUT_CONFIG,
    ...normalized,
    stage: {
      ...DEFAULT_LAYOUT_CONFIG.stage,
      ...(normalized.stage || {}),
    },
    viewport: {
      ...DEFAULT_LAYOUT_CONFIG.viewport,
      ...(normalized.viewport || {}),
    },
    canvasWidth: Math.max(normalized.canvasWidth || DEFAULT_LAYOUT_CONFIG.canvasWidth, bounds.maxX + 80),
    canvasHeight: Math.max(normalized.canvasHeight || DEFAULT_LAYOUT_CONFIG.canvasHeight, bounds.maxY + 80),
  };
}

export function flattenSeatMapSections(sections = []) {
  return sections.flatMap((entry) =>
    (entry.seats || []).map((seat) => ({
      ...seat,
      section: entry.section,
      sectionName: seat.sectionName || entry.section?.name || "Section",
      seatShape: seat.seatShape || entry.section?.seatShape,
    })),
  );
}

export function buildSeatLayoutMap(seats = []) {
  return seats.reduce((result, seat) => {
    result[seat.id] = normalizeSeatLayout(seat.layout, {
      label: seat.label || seat.code,
      rowLabel: seat.rowLabel || getRowLabel(seat.rowNumber),
      width: seat.section?.defaultSeatWidth,
      height: seat.section?.defaultSeatHeight,
    });
    return result;
  }, {});
}

export function getSeatLayout(seat, draftLayouts = {}) {
  return normalizeSeatLayout(draftLayouts[seat.id] || seat.layout, {
    label: seat.label || seat.code,
    rowLabel: seat.rowLabel || getRowLabel(seat.rowNumber),
    width: seat.section?.defaultSeatWidth,
    height: seat.section?.defaultSeatHeight,
  });
}

export function getPlacedSeats(seats = [], draftLayouts = {}) {
  return seats.filter((seat) => isSeatPlaced({ ...seat, layout: getSeatLayout(seat, draftLayouts) }));
}

export function getUnplacedSeats(seats = [], draftLayouts = {}) {
  return seats.filter((seat) => !isSeatPlaced({ ...seat, layout: getSeatLayout(seat, draftLayouts) }));
}

export function getDirtySeatIds(seats = [], savedLayouts = {}, draftLayouts = {}) {
  return seats
    .filter((seat) => {
      const saved = normalizeComparableLayout(savedLayouts[seat.id]);
      const draft = normalizeComparableLayout(draftLayouts[seat.id]);
      return JSON.stringify(saved) !== JSON.stringify(draft);
    })
    .map((seat) => seat.id);
}

export function buildBulkLayoutPayload(seats = [], draftLayouts = {}, dirtySeatIds = []) {
  const dirtySet = new Set(dirtySeatIds);

  return {
    seats: seats
      .filter((seat) => dirtySet.has(seat.id))
      .map((seat) => {
        const layout = getSeatLayout(seat, draftLayouts);
        return {
          seatId: seat.id,
          x: roundLayoutNumber(layout.x),
          y: roundLayoutNumber(layout.y),
          rotation: roundLayoutNumber(layout.rotation || 0),
          width: roundLayoutNumber(layout.width || 32),
          height: roundLayoutNumber(layout.height || 32),
          label: layout.label || seat.label || seat.code,
          rowLabel: layout.rowLabel || seat.rowLabel || getRowLabel(seat.rowNumber),
          isPlaced: true,
        };
      }),
  };
}

export function updateDraftSeatLayout(draftLayouts, seat, partialLayout, layoutConfig) {
  const current = getSeatLayout(seat, draftLayouts);
  const width = positiveOrDefault(partialLayout.width ?? current.width, 32);
  const height = positiveOrDefault(partialLayout.height ?? current.height, 32);
  const maxX = Math.max(0, layoutConfig.canvasWidth - width);
  const maxY = Math.max(0, layoutConfig.canvasHeight - height);

  return {
    ...draftLayouts,
    [seat.id]: {
      ...current,
      ...partialLayout,
      width,
      height,
      x: clamp(finiteOrDefault(partialLayout.x, current.x || 0), 0, maxX),
      y: clamp(finiteOrDefault(partialLayout.y, current.y || 0), 0, maxY),
      isPlaced: true,
    },
  };
}

export function updateDraftSeatLayouts(draftLayouts, seats = [], partialLayout, layoutConfig) {
  return seats.reduce(
    (result, seat) => updateDraftSeatLayout(result, seat, partialLayout, layoutConfig),
    draftLayouts,
  );
}

export function moveDraftSeatLayouts(draftLayouts, seats = [], delta, layoutConfig, snapToGrid = false, gridSize = 16) {
  const constrainedDelta = constrainGroupDelta(draftLayouts, seats, delta, layoutConfig);

  return seats.reduce((result, seat) => {
    const current = getSeatLayout(seat, result);
    let nextX = Number(current.x || 0) + Number(constrainedDelta.x || 0);
    let nextY = Number(current.y || 0) + Number(constrainedDelta.y || 0);

    if (snapToGrid && gridSize > 0) {
      nextX = Math.round(nextX / gridSize) * gridSize;
      nextY = Math.round(nextY / gridSize) * gridSize;
    }

    return updateDraftSeatLayout(result, seat, { x: nextX, y: nextY }, layoutConfig);
  }, draftLayouts);
}

export function reflowSeatLayoutsAfterResize(draftLayouts, seats = [], size, layoutConfig, options = {}) {
  const width = positiveOrDefault(size.width, 32);
  const height = positiveOrDefault(size.height, 32);
  const gapX = positiveOrDefault(options.gapX, Math.max(8, layoutConfig.gridSize || 12));
  const gapY = positiveOrDefault(options.gapY, Math.max(10, layoutConfig.gridSize || 14));
  const rows = groupSeatsForReflow(seats, draftLayouts, height);

  return rows.reduce((result, row, rowIndex) => {
    const sortedSeats = [...row.seats].sort((seatA, seatB) => {
      const layoutA = getSeatLayout(seatA, result);
      const layoutB = getSeatLayout(seatB, result);
      if (Number(layoutA.x) !== Number(layoutB.x)) {
        return Number(layoutA.x) - Number(layoutB.x);
      }
      return Number(seatA.seatNumber || 0) - Number(seatB.seatNumber || 0);
    });

    const minimumRowWidth = sortedSeats.length * width;
    const effectiveGapX =
      sortedSeats.length > 1 && minimumRowWidth + (sortedSeats.length - 1) * gapX > layoutConfig.canvasWidth
        ? Math.max(2, (layoutConfig.canvasWidth - minimumRowWidth) / (sortedSeats.length - 1))
        : gapX;
    const rowWidth = minimumRowWidth + Math.max(0, sortedSeats.length - 1) * effectiveGapX;
    const originalStartX = Math.min(...sortedSeats.map((seat) => Number(getSeatLayout(seat, result).x || 0)));
    const originalStartY = rowIndex === 0
      ? Math.min(...row.seats.map((seat) => Number(getSeatLayout(seat, result).y || 0)))
      : Math.max(
          0,
          Math.min(layoutConfig.canvasHeight - height, rows[rowIndex - 1].nextY),
        );
    const startX = clamp(originalStartX, 0, Math.max(0, layoutConfig.canvasWidth - rowWidth));
    const startY = clamp(originalStartY, 0, Math.max(0, layoutConfig.canvasHeight - height));

    row.nextY = startY + height + gapY;

    return sortedSeats.reduce((nextResult, seat, seatIndex) => {
      const current = getSeatLayout(seat, nextResult);
      return updateDraftSeatLayout(
        nextResult,
        seat,
        {
          ...current,
          x: startX + seatIndex * (width + effectiveGapX),
          y: startY,
          width,
          height,
          isPlaced: true,
        },
        layoutConfig,
      );
    }, result);
  }, draftLayouts);
}

export function getSeatsIntersectingRect(seats = [], draftLayouts = {}, rect = null) {
  if (!rect) {
    return [];
  }

  return seats.filter((seat) => {
    const layout = getSeatLayout(seat, draftLayouts);
    if (!isSeatPlaced({ ...seat, layout })) {
      return false;
    }

    return rectanglesIntersect(
      rect,
      {
        left: layout.x,
        top: layout.y,
        right: layout.x + layout.width,
        bottom: layout.y + layout.height,
      },
    );
  });
}

export function autoArrangeSeatLayouts(sections = [], layoutConfig = DEFAULT_LAYOUT_CONFIG, options = {}) {
  const seatWidth = positiveOrDefault(options.seatWidth, 32);
  const seatHeight = positiveOrDefault(options.seatHeight, 32);
  const seatGapX = positiveOrDefault(options.seatGapX, 12);
  const seatGapY = positiveOrDefault(options.seatGapY, 14);
  const sectionGapX = positiveOrDefault(options.sectionGapX, 56);
  const sectionGapY = positiveOrDefault(options.sectionGapY, 64);
  const stageBottom = (layoutConfig.stage?.y || 48) + (layoutConfig.stage?.height || 72);
  const startY = positiveOrDefault(options.startY, stageBottom + 72);
  const draftLayouts = {};
  let cursorX = 56;
  let cursorY = startY;
  let rowHeight = 0;
  const maxCanvasX = Math.max(layoutConfig.canvasWidth - 56, 320);

  sections.forEach((entry) => {
    const seats = [...(entry.seats || [])].sort(compareSeats);
    if (!seats.length) {
      return;
    }

    const rows = groupByRow(seats);
    const maxColumns = rows.reduce((max, row) => Math.max(max, row.seats.length), 0);
    const blockWidth = Math.max(maxColumns * seatWidth + Math.max(0, maxColumns - 1) * seatGapX, 180);
    const blockHeight = rows.length * seatHeight + Math.max(0, rows.length - 1) * seatGapY + 34;

    if (cursorX > 56 && cursorX + blockWidth > maxCanvasX) {
      cursorX = 56;
      cursorY += rowHeight + sectionGapY;
      rowHeight = 0;
    }

    rows.forEach((row, rowIndex) => {
      row.seats.forEach((seat, seatIndex) => {
        const rowLabel = getRowLabel(seat.rowNumber);
        draftLayouts[seat.id] = {
          x: clamp(cursorX + seatIndex * (seatWidth + seatGapX), 0, layoutConfig.canvasWidth - seatWidth),
          y: clamp(cursorY + 34 + rowIndex * (seatHeight + seatGapY), 0, layoutConfig.canvasHeight - seatHeight),
          rotation: 0,
          width: seatWidth,
          height: seatHeight,
          label: seat.layout?.label || `${rowLabel}${seat.seatNumber || ""}`,
          rowLabel,
          isPlaced: true,
        };
      });
    });

    cursorX += blockWidth + sectionGapX;
    rowHeight = Math.max(rowHeight, blockHeight);
  });

  return draftLayouts;
}

export function computeSeatBounds(seats = []) {
  return seats.reduce(
    (bounds, seat) => {
      if (!isSeatPlaced(seat)) {
        return bounds;
      }

      const layout = normalizeSeatLayout(seat.layout);
      return {
        minX: Math.min(bounds.minX, layout.x),
        minY: Math.min(bounds.minY, layout.y),
        maxX: Math.max(bounds.maxX, layout.x + layout.width),
        maxY: Math.max(bounds.maxY, layout.y + layout.height),
      };
    },
    { minX: 0, minY: 0, maxX: 0, maxY: 0 },
  );
}

export function getCanvasWarnings(seats = [], layoutConfig = DEFAULT_LAYOUT_CONFIG, draftLayouts = {}) {
  const outsideCount = seats.filter((seat) => {
    const layout = getSeatLayout(seat, draftLayouts);
    if (!isSeatPlaced({ ...seat, layout })) {
      return false;
    }

    return (
      layout.x < 0 ||
      layout.y < 0 ||
      layout.x + layout.width > layoutConfig.canvasWidth ||
      layout.y + layout.height > layoutConfig.canvasHeight
    );
  }).length;

  return {
    outsideCount,
  };
}

export function roundLayoutNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric * 100) / 100 : 0;
}

function normalizeComparableLayout(layout = {}) {
  const normalized = normalizeSeatLayout(layout);
  return {
    x: normalized.x === null ? null : roundLayoutNumber(normalized.x),
    y: normalized.y === null ? null : roundLayoutNumber(normalized.y),
    rotation: roundLayoutNumber(normalized.rotation || 0),
    width: roundLayoutNumber(normalized.width || 32),
    height: roundLayoutNumber(normalized.height || 32),
    label: normalized.label || "",
    rowLabel: normalized.rowLabel || "",
    isPlaced: Boolean(normalized.isPlaced),
  };
}

function groupByRow(seats = []) {
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
      seats: rowSeats.sort(compareSeats),
    }));
}

function compareSeats(seatA, seatB) {
  if (Number(seatA.rowNumber) !== Number(seatB.rowNumber)) {
    return Number(seatA.rowNumber) - Number(seatB.rowNumber);
  }

  return Number(seatA.seatNumber) - Number(seatB.seatNumber);
}

function constrainGroupDelta(draftLayouts, seats = [], delta, layoutConfig) {
  if (!seats.length) {
    return delta;
  }

  const bounds = seats.reduce(
    (result, seat) => {
      const layout = getSeatLayout(seat, draftLayouts);
      return {
        minX: Math.min(result.minX, Number(layout.x || 0)),
        minY: Math.min(result.minY, Number(layout.y || 0)),
        maxX: Math.max(result.maxX, Number(layout.x || 0) + Number(layout.width || 32)),
        maxY: Math.max(result.maxY, Number(layout.y || 0) + Number(layout.height || 32)),
      };
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );

  return {
    x: clamp(Number(delta.x || 0), -bounds.minX, Math.max(0, layoutConfig.canvasWidth - bounds.maxX)),
    y: clamp(Number(delta.y || 0), -bounds.minY, Math.max(0, layoutConfig.canvasHeight - bounds.maxY)),
  };
}

function groupSeatsForReflow(seats = [], draftLayouts = {}, newHeight = 32) {
  const sortedSeats = [...seats].sort((seatA, seatB) => {
    const layoutA = getSeatLayout(seatA, draftLayouts);
    const layoutB = getSeatLayout(seatB, draftLayouts);
    if (Math.abs(Number(layoutA.y || 0) - Number(layoutB.y || 0)) > 1) {
      return Number(layoutA.y || 0) - Number(layoutB.y || 0);
    }
    return Number(layoutA.x || 0) - Number(layoutB.x || 0);
  });
  const rowThreshold = Math.max(18, newHeight * 0.75);

  return sortedSeats.reduce((rows, seat) => {
    const layout = getSeatLayout(seat, draftLayouts);
    const y = Number(layout.y || 0);
    const currentRow = rows[rows.length - 1];

    if (!currentRow || Math.abs(y - currentRow.anchorY) > rowThreshold) {
      rows.push({ anchorY: y, seats: [seat], nextY: y + newHeight });
      return rows;
    }

    currentRow.seats.push(seat);
    currentRow.anchorY = (currentRow.anchorY * (currentRow.seats.length - 1) + y) / currentRow.seats.length;
    return rows;
  }, []);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function rectanglesIntersect(rectA, rectB) {
  return rectA.left <= rectB.right && rectA.right >= rectB.left && rectA.top <= rectB.bottom && rectA.bottom >= rectB.top;
}

function finiteOrDefault(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function positiveOrDefault(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}
