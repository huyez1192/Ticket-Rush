import mongoose from "mongoose";
import { z } from "zod";

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid resource identifier."
});

export const eventIdParamsSchema = {
  params: z.object({ eventId: objectIdSchema }).strict()
};

export const eventRevenueSchema = {
  params: eventIdParamsSchema.params,
  query: z
    .object({
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional()
    })
    .strict()
    .refine((value) => !value.from || !value.to || value.to >= value.from, {
      message: "to must be greater than or equal to from.",
      path: ["to"]
    })
};

