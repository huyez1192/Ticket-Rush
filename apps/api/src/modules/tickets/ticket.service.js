import { AppError } from "../../common/errors/AppError.js";
import { mapPagination, mapTicketToDto } from "./ticket.mapper.js";
import { findTicketByIdForUser, findTicketByQrCode, findTicketsByUser } from "./ticket.repository.js";

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
    qrCode: ticket.qrCode
  };
}

export async function verifyTicketByQrCode(qrCode) {
  const ticket = await findTicketByQrCode(qrCode);

  return {
    valid: Boolean(ticket),
    ticket: ticket ? mapTicketToDto(ticket) : null
  };
}
