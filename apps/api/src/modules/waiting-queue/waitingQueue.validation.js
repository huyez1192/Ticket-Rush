import mongoose from "mongoose";
import { z } from "zod";
import { QUEUE_STATUS_VALUES } from "../../common/constants/index.js";

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid resource identifier."
});

export const joinQueueSchema = {
  body: z
    .object({
      eventId: objectIdSchema
    })
    .strict()
};

export const queueIdParamsSchema = {
  params: z
    .object({
      queueId: objectIdSchema
    })
    .strict()
};

export const eventQueueParamsSchema = {
  params: z
    .object({
      eventId: objectIdSchema
    })
    .strict()
};

export const adminListQueueSchema = {
  params: eventQueueParamsSchema.params,
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      status: z.enum(QUEUE_STATUS_VALUES).optional()
    })
    .strict()
};

export const admitQueueBatchSchema = {
  params: eventQueueParamsSchema.params,
  body: z
    .object({
      batchSize: z.coerce.number().int().min(1).max(500)
    })
    .strict()
};
