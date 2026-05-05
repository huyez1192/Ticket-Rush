import mongoose from "mongoose";
import { z } from "zod";

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid resource identifier."
});

export const roleIdParamsSchema = {
  params: z.object({ id: objectIdSchema }).strict()
};

