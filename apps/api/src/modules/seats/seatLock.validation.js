import mongoose from "mongoose";
import { z } from "zod";

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid resource identifier."
});

export const eventIdParamsSchema = {
  params: z.object({ eventId: objectIdSchema }).strict()
};

export const seatLockSeatParamsSchema = {
  params: z
    .object({
      eventId: objectIdSchema,
      seatId: objectIdSchema
    })
    .strict()
};

export const lockSeatsSchema = {
  params: eventIdParamsSchema.params,
  body: z
    .object({
      seatIds: z.array(objectIdSchema).min(1),
      queueToken: z.string().trim().nullable().optional()
    })
    .strict()
};
