import { sendSuccess } from "../../common/responses/apiResponse.js";
import { getMyTicket, getMyTicketQr, listMyTickets, verifyTicketByQrCode } from "./ticket.service.js";

export async function listTickets(req, res, next) {
  try {
    const data = await listMyTickets(req.user.id, req.query);
    sendSuccess(res, 200, "Tickets fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function getTicket(req, res, next) {
  try {
    const data = await getMyTicket(req.params.ticketId, req.user.id);
    sendSuccess(res, 200, "Ticket fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function getTicketQr(req, res, next) {
  try {
    const data = await getMyTicketQr(req.params.ticketId, req.user.id);
    sendSuccess(res, 200, "Ticket QR fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function verifyTicket(req, res, next) {
  try {
    const data = await verifyTicketByQrCode(req.body.qrCode, req.user.id);
    sendSuccess(res, 200, "Ticket verification completed successfully.", data);
  } catch (error) {
    next(error);
  }
}
