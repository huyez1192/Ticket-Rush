const DISPLAY_LABEL_PATTERN = /^([A-Z])(\d+)$/;
const ROW_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function applyGlobalSeatDisplayLabelsToSections(sectionEntries = [], options = {}) {
  const nextSections = sectionEntries.map((entry, sectionIndex) => ({
    ...entry,
    seats: (entry.seats || []).map((seat) => ({ ...seat })),
    __sectionIndex: sectionIndex,
  }));

  const entries = nextSections.flatMap((entry) =>
    entry.seats.map((seat, seatIndex) => buildSeatEntry(seat, entry.section, entry.__sectionIndex, seatIndex, options)),
  );

  assignGlobalDisplayLabels(entries);

  return nextSections.map(({ __sectionIndex, ...entry }) => entry);
}

export function applyGlobalSeatDisplayLabelsToSeats(seats = [], options = {}) {
  const nextSeats = seats.map((seat) => ({ ...seat }));
  const entries = nextSeats.map((seat, seatIndex) =>
    buildSeatEntry(seat, seat.section || null, Number(seat.sectionIndex ?? 0), seatIndex, options),
  );

  assignGlobalDisplayLabels(entries);
  return nextSeats;
}

export function buildSeatDisplayLabelLookup(sections = []) {
  return sections.reduce((lookup, entry) => {
    (entry.seats || []).forEach((seat) => {
      const id = getSeatId(seat);

      if (!id || !seat.displayLabel) {
        return;
      }

      lookup.set(id, {
        displayLabel: seat.displayLabel,
        displayRowLabel: seat.displayRowLabel,
        displaySeatNumber: seat.displaySeatNumber,
      });
    });

    return lookup;
  }, new Map());
}

export function applySeatDisplayLabelToSeat(seat, lookup) {
  if (!seat || !lookup) {
    return seat;
  }

  const display = lookup.get(getSeatId(seat));
  return display ? { ...seat, ...display } : seat;
}

export function getSeatDisplayLabel(seat) {
  if (!seat) {
    return "Seat";
  }

  const explicitLabel = normalizeDisplayLabel(seat.displayLabel);

  if (explicitLabel) {
    return explicitLabel;
  }

  const rowLetter = getSeatRowLetter(seat, seat.layout);
  const seatNumber = getPositiveInteger(seat.displaySeatNumber ?? seat.globalSeatNumber ?? seat.seatNumber ?? seat.number);

  if (rowLetter && seatNumber) {
    return `${rowLetter}${seatNumber}`;
  }

  return normalizeDisplayLabel(seat.layout?.label || seat.label) || "Seat";
}

export function getSeatDisplayRowLabel(seat) {
  if (!seat) {
    return "";
  }

  return extractSingleRowLetter(seat.displayRowLabel) || getSeatRowLetter(seat, seat.layout) || "";
}

export function compareSeatsByDisplayLabel(seatA, seatB) {
  const rowA = getSeatDisplayRowLabel(seatA);
  const rowB = getSeatDisplayRowLabel(seatB);

  if (rowA && rowB && rowA !== rowB) {
    return rowA.localeCompare(rowB);
  }

  const numberA = getPositiveInteger(seatA?.displaySeatNumber);
  const numberB = getPositiveInteger(seatB?.displaySeatNumber);

  if (numberA && numberB && numberA !== numberB) {
    return numberA - numberB;
  }

  return 0;
}

export function getSingleLetterRowLabel(rowNumber) {
  const numericRow = Math.floor(Number(rowNumber));

  if (!Number.isFinite(numericRow) || numericRow <= 0) {
    return "";
  }

  return ROW_LETTERS[(numericRow - 1) % ROW_LETTERS.length];
}

function assignGlobalDisplayLabels(entries) {
  if (!entries.length) {
    return;
  }

  assignMissingRowLetters(entries);

  const entriesByRow = entries.reduce((result, entry) => {
    const rowLetter = entry.rowLetter || "A";

    if (!result.has(rowLetter)) {
      result.set(rowLetter, []);
    }

    result.get(rowLetter).push(entry);
    return result;
  }, new Map());

  Array.from(entriesByRow.entries())
    .sort(([rowA], [rowB]) => rowA.localeCompare(rowB))
    .forEach(([rowLetter, rowEntries]) => {
      let nextSeatNumber = 1;

      groupEntriesIntoVisualBands(rowEntries).forEach((band) => {
        band.entries.sort(compareEntriesByVisualX).forEach((entry) => {
          entry.seat.displayRowLabel = rowLetter;
          entry.seat.displaySeatNumber = nextSeatNumber;
          entry.seat.displayLabel = `${rowLetter}${nextSeatNumber}`;
          nextSeatNumber += 1;
        });
      });
    });
}

function assignMissingRowLetters(entries) {
  const missingEntries = entries.filter((entry) => !entry.rowLetter);

  if (!missingEntries.length) {
    return;
  }

  groupEntriesIntoVisualBands(missingEntries).forEach((band, index) => {
    const rowLetter = getSingleLetterRowLabel(index + 1) || "A";
    band.entries.forEach((entry) => {
      entry.rowLetter = rowLetter;
    });
  });
}

function buildSeatEntry(seat, section, sectionIndex, seatIndex, options) {
  const layout = options.getLayout?.(seat) || seat.layout || {};
  const rowNumber = Number(seat.rowNumber ?? seat.row ?? 0);
  const seatNumber = Number(seat.seatNumber ?? seat.number ?? 0);

  return {
    seat,
    section,
    sectionIndex,
    sectionOrder: getSectionOrder(section, sectionIndex),
    seatIndex,
    rowLetter: getSeatRowLetter(seat, layout),
    rowNumber: Number.isFinite(rowNumber) ? rowNumber : 0,
    seatNumber: Number.isFinite(seatNumber) ? seatNumber : 0,
    x: getFiniteNumber(layout.x),
    y: getFiniteNumber(layout.y),
    height: getPositiveNumber(layout.height),
  };
}

function getSeatRowLetter(seat, layout = {}) {
  return (
    extractSingleRowLetter(layout?.rowLabel) ||
    extractSingleRowLetter(seat.rowLabel) ||
    getSingleLetterRowLabel(seat.rowNumber ?? seat.row)
  );
}

function groupEntriesIntoVisualBands(entries) {
  if (!entries.length) {
    return [];
  }

  const threshold = getRowBandThreshold(entries);
  const sortedEntries = [...entries].sort(compareEntriesByVisualY);
  const bands = [];

  sortedEntries.forEach((entry) => {
    const y = getSortY(entry);
    const currentBand = bands[bands.length - 1];

    if (!currentBand || Math.abs(y - currentBand.anchorY) > threshold) {
      bands.push({ anchorY: y, entries: [entry] });
      return;
    }

    currentBand.entries.push(entry);
    currentBand.anchorY =
      (currentBand.anchorY * (currentBand.entries.length - 1) + y) / currentBand.entries.length;
  });

  return bands;
}

function compareEntriesByVisualY(entryA, entryB) {
  const yCompare = getSortY(entryA) - getSortY(entryB);

  if (yCompare !== 0) {
    return yCompare;
  }

  return compareEntriesByVisualX(entryA, entryB);
}

function compareEntriesByVisualX(entryA, entryB) {
  const xCompare = getSortX(entryA) - getSortX(entryB);

  if (xCompare !== 0) {
    return xCompare;
  }

  if (entryA.sectionOrder !== entryB.sectionOrder) {
    return entryA.sectionOrder - entryB.sectionOrder;
  }

  if (entryA.seatNumber !== entryB.seatNumber) {
    return entryA.seatNumber - entryB.seatNumber;
  }

  return entryA.seatIndex - entryB.seatIndex;
}

function getSortX(entry) {
  if (Number.isFinite(entry.x)) {
    return entry.x;
  }

  return entry.sectionOrder * 10000 + (entry.seatNumber || entry.seatIndex);
}

function getSortY(entry) {
  if (Number.isFinite(entry.y)) {
    return entry.y;
  }

  return (entry.rowNumber || 1) * 1000;
}

function getRowBandThreshold(entries) {
  const heights = entries.map((entry) => entry.height).filter((height) => Number.isFinite(height) && height > 0);
  const averageHeight = heights.length ? heights.reduce((sum, height) => sum + height, 0) / heights.length : 32;

  return Math.max(18, averageHeight * 0.75);
}

function getSectionOrder(section, sectionIndex) {
  const displayOrder = Number(section?.displayOrder);

  if (Number.isFinite(displayOrder)) {
    return displayOrder;
  }

  return Number.isFinite(sectionIndex) ? sectionIndex : 0;
}

function normalizeDisplayLabel(value) {
  const compact = String(value || "").trim().replace(/\s+/g, "").toUpperCase();
  const match = compact.match(DISPLAY_LABEL_PATTERN);

  if (!match) {
    return "";
  }

  const number = Number(match[2]);
  return Number.isFinite(number) && number > 0 ? `${match[1]}${number}` : "";
}

function extractSingleRowLetter(value) {
  const match = String(value || "").trim().toUpperCase().match(/[A-Z]/);
  return match ? match[0] : "";
}

function getSeatId(seat) {
  return String(seat?.id || seat?._id || seat?.seatId || "");
}

function getFiniteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function getPositiveNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function getPositiveInteger(value) {
  const numeric = Math.floor(Number(value));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}
