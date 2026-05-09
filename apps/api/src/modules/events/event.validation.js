import mongoose from "mongoose";
import { z } from "zod";
import { EVENT_STATUS_VALUES } from "../../common/constants/index.js";

const queueAdmissionModeSchema = z.enum(["Manual", "Auto"]);
const queueConfigFields = {
  virtualQueueEnabled: z.boolean().optional(),
  queueBatchSize: z.coerce.number().int().min(1).max(500).optional(),
  queueAccessTtlMinutes: z.coerce.number().int().min(1).max(240).optional(),
  queueMaxActiveUsers: z.coerce.number().int().min(1).max(100000).nullable().optional(),
  queueAdmissionMode: queueAdmissionModeSchema.optional()
};

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid resource identifier."
});

const dateTimeSchema = z.coerce.date();
const nullableTrimmedString = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => (value === null ? undefined : value));
const optionalNullableTrimmedString = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => (value === null ? undefined : value));

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

export const eventImageParamsSchema = {
  params: z
    .object({
      eventId: objectIdSchema,
      id: objectIdSchema
    })
    .strict()
};

export const createEventSchema = {
  body: z
    .object({
      name: z.string().trim().min(1),
      description: nullableTrimmedString,
      startTime: dateTimeSchema,
      endTime: dateTimeSchema,
      status: z.enum(EVENT_STATUS_VALUES),
      imageUrls: z.array(z.string().trim().url()).optional(),
      location: z.string().trim().min(1),
      ...queueConfigFields
    })
    .strict()
    .refine((value) => value.endTime > value.startTime, {
      message: "endTime must be after startTime.",
      path: ["endTime"]
    })
};

export const updateEventSchema = {
  params: eventIdParamsSchema.params,
  body: z
    .object({
      name: z.string().trim().min(1).optional(),
      description: optionalNullableTrimmedString,
      startTime: dateTimeSchema.optional(),
      endTime: dateTimeSchema.optional(),
      location: z.string().trim().min(1).optional()
    })
    .strict()
};

export const updateEventQueueConfigSchema = {
  params: eventIdParamsSchema.params,
  body: z
    .object({
      virtualQueueEnabled: z.boolean(),
      queueBatchSize: z.coerce.number().int().min(1).max(500),
      queueAccessTtlMinutes: z.coerce.number().int().min(1).max(240),
      queueMaxActiveUsers: z.coerce.number().int().min(1).max(100000).nullable().optional(),
      queueAdmissionMode: queueAdmissionModeSchema.default("Manual")
    })
    .strict()
};

export const createEventImageSchema = {
  params: eventIdParamsSchema.params,
  body: z
    .object({
      imageUrl: z.string().trim().url()
    })
    .strict()
};
