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

const nullableTrimmedString = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => (value === null ? undefined : value));

export const createSeatSectionSchema = {
  params: eventIdParamsSchema.params,
  body: z
    .object({
      name: z.string().trim().min(1),
      price: z.coerce.number().positive(),
      description: nullableTrimmedString
    })
    .strict()
};

export const updateSeatSectionSchema = {
  params: sectionParamsSchema.params,
  body: z
    .object({
      name: z.string().trim().min(1).optional(),
      price: z.coerce.number().positive().optional(),
      description: nullableTrimmedString
    })
    .strict()
};

export const generateSeatsSchema = {
  params: sectionParamsSchema.params,
  body: z
    .object({
      rows: z.coerce.number().int().min(1),
      seatsPerRow: z.coerce.number().int().min(1),
      initialStatus: z.enum(SEAT_STATUS_VALUES).optional()
    })
    .strict()
};

export const updateSeatStatusSchema = {
  params: seatParamsSchema.params,
  body: z
    .object({
      status: z.enum(SEAT_STATUS_VALUES)
    })
    .strict()
};
