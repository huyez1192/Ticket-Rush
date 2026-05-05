import { SeatSection } from "./seatSection.model.js";
import { Seat } from "./seat.model.js";

export function findSeatSectionsByEventId(eventId) {
  return SeatSection.find({ eventId }).sort({ name: 1, _id: 1 }).lean();
}

export function findSeatSectionByIdForEvent(eventId, sectionId) {
  return SeatSection.findOne({ _id: sectionId, eventId }).lean();
}

export function countSeatSectionsByEventId(eventId) {
  return SeatSection.countDocuments({ eventId });
}

function buildSeatFilter(eventId, filters = {}) {
  const query = { eventId };

  if (filters.sectionId) {
    query.sectionId = filters.sectionId;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  return query;
}

export async function findSeatsByEventId(eventId, filters, pagination) {
  const query = buildSeatFilter(eventId, filters);
  const skip = (pagination.page - 1) * pagination.limit;

  const [items, total] = await Promise.all([
    Seat.find(query)
      .populate({ path: "sectionId", select: "eventId name description price createdAt updatedAt" })
      .sort({ sectionId: 1, rowNumber: 1, seatNumber: 1, _id: 1 })
      .skip(skip)
      .limit(pagination.limit)
      .lean(),
    Seat.countDocuments(query)
  ]);

  return { items, total };
}

export function findSeatByIdForEvent(eventId, seatId) {
  return Seat.findOne({ _id: seatId, eventId })
    .populate({ path: "sectionId", select: "eventId name description price createdAt updatedAt" })
    .lean();
}

export function findAllSeatsForEvent(eventId) {
  return Seat.find({ eventId })
    .populate({ path: "sectionId", select: "eventId name description price createdAt updatedAt" })
    .sort({ sectionId: 1, rowNumber: 1, seatNumber: 1, _id: 1 })
    .lean();
}

export function findSeatChanges(eventId, since) {
  const query = { eventId };

  if (since) {
    query.updatedAt = { $gt: since };
  }

  return Seat.find(query)
    .populate({ path: "sectionId", select: "eventId name description price createdAt updatedAt" })
    .sort({ updatedAt: 1, _id: 1 })
    .lean();
}
