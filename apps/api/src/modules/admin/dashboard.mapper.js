export function mapOverviewStatsToDto(stats) {
  return {
    totalEvents: stats.totalEvents,
    totalUsers: stats.totalUsers,
    totalCustomers: stats.totalCustomers,
    totalAdmins: stats.totalAdmins,
    totalOrders: stats.totalOrders,
    paidOrders: stats.paidOrders,
    soldTickets: stats.soldTickets,
    totalRevenue: stats.totalRevenue,
    availableSeats: stats.availableSeats,
    lockedSeats: stats.lockedSeats,
    soldSeats: stats.soldSeats,
    waitingQueueEntries: stats.waitingQueueEntries
  };
}

export function mapRevenueStatsToDto(stats) {
  return {
    eventId: stats.eventId?.toString?.() || stats.eventId,
    totalRevenue: stats.totalRevenue,
    paidOrders: stats.paidOrders,
    soldTickets: stats.soldTickets
  };
}

export function mapSeatOccupancyStatsToDto(stats) {
  return {
    eventId: stats.eventId?.toString?.() || stats.eventId,
    available: stats.available,
    locked: stats.locked,
    sold: stats.sold,
    released: stats.released,
    occupancyRate: stats.occupancyRate
  };
}

export function mapDemographicsStatsToDto(stats) {
  return {
    eventId: stats.eventId?.toString?.() || stats.eventId,
    gender: stats.gender,
    ageGroups: stats.ageGroups
  };
}

