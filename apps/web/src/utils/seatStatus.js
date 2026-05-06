export const SEAT_STATUS_META = {
  Available: {
    label: "Available",
    className: "seat--available",
    selectable: true,
  },
  Locked: {
    label: "Locked",
    className: "seat--locked",
    selectable: false,
  },
  Sold: {
    label: "Sold",
    className: "seat--sold",
    selectable: false,
  },
  Released: {
    label: "Released",
    className: "seat--released",
    selectable: false,
  },
};

export function normalizeSeatStatus(status) {
  const normalized = String(status || "").toLowerCase();
  return Object.keys(SEAT_STATUS_META).find((key) => key.toLowerCase() === normalized) || "Released";
}

export function getSeatStatusMeta(status) {
  return SEAT_STATUS_META[normalizeSeatStatus(status)] || SEAT_STATUS_META.Released;
}

export function isSeatSelectable(status) {
  return Boolean(getSeatStatusMeta(status).selectable);
}
