import mongoose from "mongoose";
import { z } from "zod";

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid resource identifier."
});

export const listAuditLogsSchema = {
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      userId: objectIdSchema.optional(),
      action: z.string().trim().min(1).max(120).optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional()
    })
    .strict()
    .refine((value) => !value.from || !value.to || value.to >= value.from, {
      message: "to must be greater than or equal to from.",
      path: ["to"]
    })
};

