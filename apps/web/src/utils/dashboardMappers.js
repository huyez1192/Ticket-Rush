import { formatCurrency } from "./formatCurrency";

function numberFrom(value) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function pickNumber(source, keys) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return numberFrom(source[key]);
    }
  }

  return 0;
}

export function normalizeDashboardOverview(payload = {}) {
  return {
    totalEvents: pickNumber(payload, ["totalEvents", "events"]),
    totalUsers: pickNumber(payload, ["totalUsers", "users"]),
    totalCustomers: pickNumber(payload, ["totalCustomers", "customers"]),
    totalAdmins: pickNumber(payload, ["totalAdmins", "admins"]),
    totalOrders: pickNumber(payload, ["totalOrders", "orders"]),
    paidOrders: pickNumber(payload, ["paidOrders"]),
    soldTickets: pickNumber(payload, ["soldTickets", "ticketsSold"]),
    totalRevenue: pickNumber(payload, ["totalRevenue", "revenue"]),
    availableSeats: pickNumber(payload, ["availableSeats", "available"]),
    lockedSeats: pickNumber(payload, ["lockedSeats", "locked"]),
    soldSeats: pickNumber(payload, ["soldSeats", "sold"]),
    waitingQueueEntries: pickNumber(payload, ["waitingQueueEntries", "queueEntries", "waiting"]),
  };
}

export function getOverviewMetricItems(overview) {
  const normalized = normalizeDashboardOverview(overview);

  return [
    { label: "Total events", value: normalized.totalEvents, detail: "Events tracked by the platform" },
    { label: "Customers", value: normalized.totalCustomers, detail: `${normalized.totalAdmins} admin accounts` },
    { label: "Orders", value: normalized.totalOrders, detail: `${normalized.paidOrders} paid orders` },
    { label: "Sold tickets", value: normalized.soldTickets, detail: "Issued after successful checkout" },
    { label: "Revenue", value: formatCurrency(normalized.totalRevenue), detail: "Total paid order revenue" },
    { label: "Available seats", value: normalized.availableSeats, detail: `${normalized.lockedSeats} locked right now` },
    { label: "Sold seats", value: normalized.soldSeats, detail: "Seats completed through checkout" },
    { label: "Queue entries", value: normalized.waitingQueueEntries, detail: "Waiting room entries if enabled" },
  ];
}

export function normalizeRevenueStats(payload = {}) {
  return {
    eventId: payload.eventId || "",
    totalRevenue: numberFrom(payload.totalRevenue),
    paidOrders: numberFrom(payload.paidOrders),
    soldTickets: numberFrom(payload.soldTickets),
  };
}

export function normalizeSeatOccupancyStats(payload = {}) {
  return {
    eventId: payload.eventId || "",
    available: numberFrom(payload.available),
    locked: numberFrom(payload.locked),
    sold: numberFrom(payload.sold),
    released: numberFrom(payload.released),
    occupancyRate: numberFrom(payload.occupancyRate),
  };
}

export function normalizeDemographicsStats(payload = {}) {
  return {
    eventId: payload.eventId || "",
    gender: Array.isArray(payload.gender) ? payload.gender : [],
    ageGroups: Array.isArray(payload.ageGroups) ? payload.ageGroups : [],
  };
}
