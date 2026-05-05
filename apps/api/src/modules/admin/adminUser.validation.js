import mongoose from "mongoose";
import { z } from "zod";

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid resource identifier."
});

export const listUsersSchema = {
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      keyword: z.string().trim().min(1).max(120).optional(),
      role: z.string().trim().min(1).max(80).optional()
    })
    .strict()
};

export const userIdParamsSchema = {
  params: z.object({ id: objectIdSchema }).strict()
};

export const assignRolesSchema = {
  params: userIdParamsSchema.params,
  body: z
    .object({
      roleIds: z.array(objectIdSchema).min(1)
    })
    .strict()
};

