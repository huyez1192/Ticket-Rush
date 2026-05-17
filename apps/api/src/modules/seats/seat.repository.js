import { SeatSection } from "./seatSection.model.js";
import { Seat } from "./seat.model.js";

const SECTION_SELECT = "eventId name description price color displayOrder defaultSeatWidth defaultSeatHeight seatShape createdAt updatedAt";

export function findSeatSectionsByEventId(eventId) {
  return SeatSection.find({ eventId }).sort({ displayOrder: 1, name: 1, _id: 1 }).lean();
}

export async function findMinimumSeatSectionPricesByEventIds(eventIds = []) {
  const ids = eventIds.filter(Boolean);

  if (!ids.length) {
    return new Map();
  }

  const rows = await SeatSection.aggregate([
    {
      $match: {
        eventId: { $in: ids },
        price: { $type: "number", $gte: 0 }
      }
    },
    {
      $group: {
        _id: "$eventId",
        minTicketPrice: { $min: "$price" }
      }
    }
  ]);

  return new Map(rows.map((row) => [row._id.toString(), row.minTicketPrice]));
}

export function findSeatSectionByIdForEvent(eventId, sectionId) {
  return SeatSection.findOne({ _id: sectionId, eventId }).lean();
}

export function countSeatSectionsByEventId(eventId) {
  return SeatSection.countDocuments({ eventId });
}

export async function createSeatSection(sectionData) {
  const section = await SeatSection.create(sectionData);
  return section.toObject();
}

export function updateSeatSectionByIdForEvent(eventId, sectionId, update) {
  return SeatSection.findOneAndUpdate({ _id: sectionId, eventId }, update, { new: true, runValidators: true }).lean();
}

export function deleteSeatSectionByIdForEvent(eventId, sectionId) {
  return SeatSection.findOneAndDelete({ _id: sectionId, eventId });
}

export function deleteSeatSectionsByEventId(eventId) {
  return SeatSection.deleteMany({ eventId });
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
      .populate({ path: "sectionId", select: SECTION_SELECT })
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
    .populate({ path: "sectionId", select: SECTION_SELECT })
    .lean();
}

export function updateSeatByIdForEvent(eventId, seatId, update) {
  return Seat.findOneAndUpdate({ _id: seatId, eventId }, update, { new: true, runValidators: true })
    .populate({ path: "sectionId", select: SECTION_SELECT })
    .lean();
}

export function updateSeatLayout(eventId, seatId, layoutPayload, session) {
  return Seat.findOneAndUpdate(
    { _id: seatId, eventId },
    { $set: { layout: layoutPayload } },
    { new: true, runValidators: true }
  )
    .populate({ path: "sectionId", select: SECTION_SELECT })
    .session(session || null)
    .lean();
}

export function countSeatsBySectionId(sectionId) {
  return Seat.countDocuments({ sectionId });
}

export function countSeatsByEventId(eventId) {
  return Seat.countDocuments({ eventId });
}

export function deleteSeatsByEventId(eventId) {
  return Seat.deleteMany({ eventId });
}

export async function createSeats(seats) {
  return Seat.insertMany(seats, { ordered: true });
}

export function findAllSeatsForEvent(eventId) {
  return Seat.find({ eventId })
    .populate({ path: "sectionId", select: SECTION_SELECT })
    .sort({ sectionId: 1, rowNumber: 1, seatNumber: 1, _id: 1 })
    .lean();
}

export function findSeatsByIdsForEvent(eventId, seatIds, session) {
  return Seat.find({ _id: { $in: seatIds }, eventId })
    .populate({ path: "sectionId", select: SECTION_SELECT })
    .session(session || null)
    .lean();
}

export async function bulkUpdateSeatLayouts(eventId, seatLayouts, session) {
  const operations = seatLayouts.map((seatLayout) => ({
    updateOne: {
      filter: { _id: seatLayout.seatId, eventId },
      update: { $set: { layout: seatLayout.layout } }
    }
  }));

  if (!operations.length) {
    return { modifiedCount: 0, matchedCount: 0 };
  }

  return Seat.bulkWrite(operations, { session, ordered: true });
}

export function findSeatIdsByEventId(eventId) {
  return Seat.find({ eventId }).select("_id").lean();
}

export function findSeatChanges(eventId, since) {
  const query = { eventId };

  if (since) {
    query.updatedAt = { $gt: since };
  }

  return Seat.find(query)
    .populate({ path: "sectionId", select: SECTION_SELECT })
    .sort({ updatedAt: 1, _id: 1 })
    .lean();
}
