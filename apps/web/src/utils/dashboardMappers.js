import { formatCurrency } from "./formatCurrency";
import { getCollectionItems, getEntityId } from "./eventMappers";

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

function pickArray(source, keys) {
  for (const key of keys) {
    if (Array.isArray(source?.[key])) {
      return source[key];
    }
  }

  return [];
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
    releasedSeats: pickNumber(payload, ["releasedSeats", "released"]),
    waitingQueueEntries: pickNumber(payload, ["waitingQueueEntries", "queueEntries", "waiting"]),
  };
}

export function getOverviewMetricItems(overview) {
  const normalized = normalizeDashboardOverview(overview);

  return [
    { label: "Total events", value: normalized.totalEvents, detail: "Events tracked by the platform" },
    { label: "Total users", value: normalized.totalUsers, detail: "All customer and admin accounts" },
    { label: "Customers", value: normalized.totalCustomers, detail: "Customer accounts" },
    { label: "Admins", value: normalized.totalAdmins, detail: "Admin accounts" },
    { label: "Orders", value: normalized.totalOrders, detail: "All order statuses" },
    { label: "Paid orders", value: normalized.paidOrders, detail: "Completed checkout orders" },
    { label: "Sold tickets", value: normalized.soldTickets, detail: "Issued after successful checkout" },
    { label: "Revenue", value: formatCurrency(normalized.totalRevenue), detail: "Total paid order revenue" },
    { label: "Available seats", value: normalized.availableSeats, detail: "Seats open for purchase" },
    { label: "Locked seats", value: normalized.lockedSeats, detail: "Seats held temporarily" },
    { label: "Sold seats", value: normalized.soldSeats, detail: "Seats completed through checkout" },
    { label: "Queue entries", value: normalized.waitingQueueEntries, detail: "Waiting room entries if enabled" },
  ];
}

export function normalizeRevenueStats(payload = {}) {
  const buckets = pickArray(payload, ["buckets", "revenueByDate", "dailyRevenue", "series"]).map((item) => ({
    label: item?.label || item?.date || item?.period || item?.bucket || "Bucket",
    value: numberFrom(item?.revenue ?? item?.totalRevenue ?? item?.amount ?? item?.value),
  }));
  const paidOrders = pickNumber(payload, ["paidOrders", "paidOrderCount", "orders"]);

  return {
    eventId: payload.eventId || payload.id || "",
    totalRevenue: pickNumber(payload, ["totalRevenue", "revenue", "amount"]),
    paidOrders,
    soldTickets: pickNumber(payload, ["soldTickets", "ticketsSold", "tickets"]),
    averageRevenuePerPaidOrder: paidOrders > 0 ? pickNumber(payload, ["totalRevenue", "revenue", "amount"]) / paidOrders : 0,
    buckets,
  };
}

export function normalizeSeatOccupancyStats(payload = {}) {
  const available = pickNumber(payload, ["available", "availableSeats"]);
  const locked = pickNumber(payload, ["locked", "lockedSeats"]);
  const sold = pickNumber(payload, ["sold", "soldSeats"]);
  const released = pickNumber(payload, ["released", "releasedSeats"]);
  const totalSeats = pickNumber(payload, ["totalSeats", "total"]) || available + locked + sold + released;
  const occupancyRate = payload.occupancyRate === undefined && totalSeats > 0 ? ((sold + locked) / totalSeats) * 100 : numberFrom(payload.occupancyRate);

  return {
    eventId: payload.eventId || payload.id || "",
    available,
    locked,
    sold,
    released,
    totalSeats,
    occupancyRate,
  };
}

export function normalizeDemographicsStats(payload = {}) {
  const gender = pickArray(payload, ["gender", "genderDistribution", "genders"]).map((item) => ({
    ...item,
    gender: item?.gender || item?.label || "Unknown",
    count: numberFrom(item?.count ?? item?.value ?? item?.total),
  }));
  const ageGroups = pickArray(payload, ["ageGroups", "ageBuckets", "ages"]).map((item) => ({
    ...item,
    range: item?.range || item?.label || item?.ageGroup || "Unknown",
    count: numberFrom(item?.count ?? item?.value ?? item?.total),
  }));

  return {
    eventId: payload.eventId || payload.id || "",
    gender,
    ageGroups,
  };
}

export function normalizeOrderStatusCounts(payload = {}) {
  const items = getCollectionItems(payload);
  const counts = {
    Pending: 0,
    Paid: 0,
    Expired: 0,
    Cancelled: 0,
    Unknown: 0,
  };

  items.forEach((order) => {
    const status = order?.status || "Unknown";
    counts[status] = (counts[status] || 0) + 1;
  });

  return {
    total: items.length,
    items: Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([label, value]) => ({ label, value })),
  };
}

export function normalizeDashboardEventOption(event) {
  return {
    ...event,
    id: getEntityId(event),
    name: event?.name || event?.title || "Untitled event",
    status: event?.status || "Draft",
  };
}
