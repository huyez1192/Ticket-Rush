import { GENDERS } from "../../common/constants/index.js";
import { AppError } from "../../common/errors/AppError.js";
import {
  mapDemographicsStatsToDto,
  mapOverviewStatsToDto,
  mapRevenueStatsToDto,
  mapSeatOccupancyStatsToDto
} from "./dashboard.mapper.js";
import {
  findDashboardEventById,
  getEventRevenueStats,
  getEventSeatOccupancyStats,
  getOverviewStats,
  getPaidCustomerUsersForEvent
} from "./dashboard.repository.js";

const AGE_BUCKETS = [
  { range: "Under 18", min: 0, max: 17 },
  { range: "18-24", min: 18, max: 24 },
  { range: "25-34", min: 25, max: 34 },
  { range: "35-44", min: 35, max: 44 },
  { range: "45+", min: 45, max: Number.POSITIVE_INFINITY },
  { range: "Unknown", min: null, max: null }
];

async function assertEventExists(eventId) {
  const event = await findDashboardEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  return event;
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDelta = now.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function getAgeBucket(age) {
  if (age === null) {
    return "Unknown";
  }

  return AGE_BUCKETS.find((bucket) => bucket.min !== null && age >= bucket.min && age <= bucket.max)?.range || "Unknown";
}

export async function getDashboardOverview() {
  return mapOverviewStatsToDto(await getOverviewStats());
}

export async function getDashboardEventRevenue(eventId, query) {
  await assertEventExists(eventId);
  return mapRevenueStatsToDto(await getEventRevenueStats(eventId, query));
}

export async function getDashboardEventSeatOccupancy(eventId) {
  await assertEventExists(eventId);
  return mapSeatOccupancyStatsToDto(await getEventSeatOccupancyStats(eventId));
}

export async function getDashboardEventDemographics(eventId) {
  await assertEventExists(eventId);
  const users = await getPaidCustomerUsersForEvent(eventId);
  const genderCounts = {
    [GENDERS.MALE]: 0,
    [GENDERS.FEMALE]: 0,
    [GENDERS.OTHER]: 0
  };
  const ageCounts = AGE_BUCKETS.reduce((accumulator, bucket) => {
    accumulator[bucket.range] = 0;
    return accumulator;
  }, {});

  for (const user of users) {
    if (user.gender && Object.prototype.hasOwnProperty.call(genderCounts, user.gender)) {
      genderCounts[user.gender] += 1;
    }

    ageCounts[getAgeBucket(calculateAge(user.dateOfBirth))] += 1;
  }

  return mapDemographicsStatsToDto({
    eventId,
    gender: Object.entries(genderCounts).map(([gender, count]) => ({ gender, count })),
    ageGroups: AGE_BUCKETS.map((bucket) => ({ range: bucket.range, count: ageCounts[bucket.range] }))
  });
}

