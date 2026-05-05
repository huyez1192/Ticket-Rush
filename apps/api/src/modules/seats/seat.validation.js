import mongoose from "mongoose";
import { z } from "zod";
import { SEAT_STATUS_VALUES } from "../../common/constants/index.js";

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid resource identifier."
});

export const eventIdParamsSchema = {
  params: z
    .object({
      eventId: objectIdSchema
    })
    .strict()
};

export const sectionParamsSchema = {
  params: z
    .object({
      eventId: objectIdSchema,
      sectionId: objectIdSchema
    })
    .strict()
};

export const seatParamsSchema = {
  params: z
    .object({
      eventId: objectIdSchema,
      seatId: objectIdSchema
    })
    .strict()
};

export const listSeatsSchema = {
  params: eventIdParamsSchema.params,
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(100),
      sectionId: objectIdSchema.optional(),
      status: z.enum(SEAT_STATUS_VALUES).optional()
    })
    .strict()
};

export const seatMapChangesSchema = {
  params: eventIdParamsSchema.params,
  query: z
    .object({
      since: z.coerce.date().optional()
    })
    .strict()
};
