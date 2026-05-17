import { Ticket } from "./ticket.model.js";
import { TICKET_STATUSES } from "../../common/constants/index.js";

const TICKET_POPULATE = [
  { path: "eventId" },
  { path: "userId", select: "username email fullName avatarUrl" },
  { path: "orderId", select: "status totalAmount createdAt updatedAt" },
  {
    path: "seatId",
    populate: {
      path: "sectionId",
      select: "eventId name description price color displayOrder defaultSeatWidth defaultSeatHeight seatShape createdAt updatedAt"
    }
  }
];

export async function createTicket(ticketData, session) {
  const [ticket] = await Ticket.create([ticketData], { session });
  return ticket;
}

export async function findTicketsByUser(userId, filters, pagination) {
  const query = { userId };

  if (filters.eventId) {
    query.eventId = filters.eventId;
  }

  const skip = (pagination.page - 1) * pagination.limit;
  const [items, total] = await Promise.all([
    Ticket.find(query).populate(TICKET_POPULATE).sort({ issuedAt: -1, _id: -1 }).skip(skip).limit(pagination.limit).lean(),
    Ticket.countDocuments(query)
  ]);

  return { items, total };
}

export function findTicketByIdForUser(ticketId, userId) {
  return Ticket.findOne({ _id: ticketId, userId }).populate(TICKET_POPULATE).lean();
}

export function findTicketByQrCode(qrCode) {
  return Ticket.findOne({ qrCode }).populate(TICKET_POPULATE).lean();
}

export function markTicketUsedByQrCode(qrCode, adminUserId, checkedInAt = new Date()) {
  return Ticket.findOneAndUpdate(
    {
      qrCode,
      $or: [
        { status: { $in: [TICKET_STATUSES.ISSUED, TICKET_STATUSES.VALID] } },
        { status: null },
        { status: { $exists: false } }
      ]
    },
    {
      $set: {
        status: TICKET_STATUSES.USED,
        verifiedAt: checkedInAt,
        checkedInAt,
        verifiedByAdminId: adminUserId
      }
    },
    { new: true, runValidators: true }
  )
    .populate(TICKET_POPULATE)
    .lean();
}

export function findTicketByOrderItemId(orderItemId, session) {
  return Ticket.findOne({ orderItemId }).session(session || null);
}

export function countTicketsByEventId(eventId) {
  return Ticket.countDocuments({ eventId });
}
