import mongoose from "mongoose";
import { z } from "zod";

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid resource identifier."
});

export const listTicketsSchema = {
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      eventId: objectIdSchema.optional()
    })
    .strict()
};

export const ticketIdParamsSchema = {
  params: z.object({ ticketId: objectIdSchema }).strict()
};

export const verifyTicketSchema = {
  body: z
    .object({
      qrCode: z.string().trim().min(1)
    })
    .strict()
};
