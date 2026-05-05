import mongoose from "mongoose";
import { z } from "zod";
import { ORDER_STATUS_VALUES } from "../../common/constants/index.js";

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid resource identifier."
});

export const listOrdersSchema = {
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      status: z.enum(ORDER_STATUS_VALUES).optional()
    })
    .strict()
};

export const adminListOrdersSchema = {
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      eventId: objectIdSchema.optional(),
      status: z.enum(ORDER_STATUS_VALUES).optional()
    })
    .strict()
};

export const createOrderSchema = {
  body: z
    .object({
      eventId: objectIdSchema,
      seatIds: z.array(objectIdSchema).min(1)
    })
    .strict()
};

export const orderIdParamsSchema = {
  params: z.object({ orderId: objectIdSchema }).strict()
};

export const checkoutSchema = {
  params: orderIdParamsSchema.params,
  body: z
    .object({
      confirm: z.boolean()
    })
    .strict()
};
