import mongoose from "mongoose";
import { z } from "zod";
import { EVENT_STATUS_VALUES } from "../../common/constants/index.js";

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid resource identifier."
});

const dateTimeSchema = z.coerce.date();

export const listEventsSchema = {
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      keyword: z.string().trim().min(1).optional(),
      status: z.enum(EVENT_STATUS_VALUES).optional(),
      from: dateTimeSchema.optional(),
      to: dateTimeSchema.optional()
    })
    .strict()
    .refine((value) => !value.from || !value.to || value.to >= value.from, {
      message: "to must be greater than or equal to from.",
      path: ["to"]
    })
};

export const eventIdParamsSchema = {
  params: z
    .object({
      eventId: objectIdSchema
    })
    .strict()
};
