import { TICKET_STATUSES } from "../../common/constants/index.js";
import { AppError } from "../../common/errors/AppError.js";
import { mapPagination, mapTicketToDto } from "./ticket.mapper.js";
import {
  findTicketByIdForUser,
  findTicketByQrCode,
  findTicketsByUser,
  markTicketUsedByQrCode
} from "./ticket.repository.js";

export async function listMyTickets(userId, query) {
  const pagination = { page: query.page, limit: query.limit };
  const { items, total } = await findTicketsByUser(userId, query, pagination);

  return {
    items: items.map((ticket) => mapTicketToDto(ticket)).filter(Boolean),
    pagination: mapPagination({ ...pagination, total })
  };
}

export async function getMyTicket(ticketId, userId) {
  const ticket = await findTicketByIdForUser(ticketId, userId);

  if (!ticket) {
    throw new AppError("Ticket not found.", 404);
  }

  return mapTicketToDto(ticket);
}

export async function getMyTicketQr(ticketId, userId) {
  const ticket = await findTicketByIdForUser(ticketId, userId);

  if (!ticket) {
    throw new AppError("Ticket not found.", 404);
  }

  return {
    ticketId: ticket._id.toString(),
    qrCode: ticket.qrCode,
    status: ticket.status || TICKET_STATUSES.ISSUED,
    verifiedAt: ticket.verifiedAt || null,
    checkedInAt: ticket.checkedInAt || ticket.verifiedAt || null
  };
}

function isUsedTicket(ticket) {
  return [TICKET_STATUSES.USED, TICKET_STATUSES.CHECKED_IN].includes(ticket?.status);
}

export async function verifyTicketByQrCode(qrCode, adminUserId) {
  const normalizedQrCode = String(qrCode || "").trim();
  const checkedInAt = new Date();
  const verifiedTicket = await markTicketUsedByQrCode(normalizedQrCode, adminUserId, checkedInAt);

  if (verifiedTicket) {
    return {
      valid: true,
      reason: "verified",
      message: "Ticket verified successfully.",
      ticket: mapTicketToDto(verifiedTicket),
      verifiedAt: checkedInAt,
      checkedInAt
    };
  }

  const existingTicket = await findTicketByQrCode(normalizedQrCode);

  if (!existingTicket) {
    return {
      valid: false,
      reason: "not_found",
      message: "Ticket was not found or the QR token is invalid.",
      ticket: null
    };
  }

  if (isUsedTicket(existingTicket)) {
    return {
      valid: false,
      reason: "already_used",
      message: "Ticket has already been used.",
      ticket: mapTicketToDto(existingTicket),
      verifiedAt: existingTicket.verifiedAt || existingTicket.checkedInAt || null,
      checkedInAt: existingTicket.checkedInAt || existingTicket.verifiedAt || null
    };
  }

  return {
    valid: false,
    reason: "not_usable",
    message: `Ticket cannot be verified because its status is ${existingTicket.status || "Unknown"}.`,
    ticket: mapTicketToDto(existingTicket)
  };
}
