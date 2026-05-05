import { Router } from "express";
import { ROLES } from "../../common/constants/index.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { getTicket, getTicketQr, listTickets, verifyTicket } from "./ticket.controller.js";
import { listTicketsSchema, ticketIdParamsSchema, verifyTicketSchema } from "./ticket.validation.js";

const router = Router();

router.get("/tickets", authenticate, requireRole(ROLES.CUSTOMER), validate(listTicketsSchema), listTickets);
router.get("/tickets/:ticketId", authenticate, requireRole(ROLES.CUSTOMER), validate(ticketIdParamsSchema), getTicket);
router.get("/tickets/:ticketId/qr", authenticate, requireRole(ROLES.CUSTOMER), validate(ticketIdParamsSchema), getTicketQr);
router.post("/admin/tickets/verify", authenticate, requireRole(ROLES.ADMIN), validate(verifyTicketSchema), verifyTicket);

export default router;
