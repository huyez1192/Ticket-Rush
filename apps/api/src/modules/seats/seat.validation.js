import mongoose from "mongoose";
import { z } from "zod";
import { SEAT_STATUS_VALUES, SECTION_SEAT_SHAPE_VALUES } from "../../common/constants/index.js";

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid resource identifier."
});

const finiteNumber = z.coerce.number().finite();
const positiveFiniteNumber = finiteNumber.positive();
const optionalTrimmedString = (maxLength) => z.string().trim().min(1).max(maxLength).optional();

const stageSchema = z
  .object({
    x: finiteNumber,
    y: finiteNumber,
    width: positiveFiniteNumber,
    height: positiveFiniteNumber,
    label: z.string().trim().min(1).max(80).optional()
  })
  .strict();

const viewportSchema = z
  .object({
    x: finiteNumber,
    y: finiteNumber,
    zoom: positiveFiniteNumber
  })
  .strict();

const seatLayoutBodySchema = z
  .object({
    x: finiteNumber.optional(),
    y: finiteNumber.optional(),
    rotation: finiteNumber.optional(),
    width: positiveFiniteNumber.optional(),
    height: positiveFiniteNumber.optional(),
    label: optionalTrimmedString(80),
    rowLabel: optionalTrimmedString(40),
    isPlaced: z.boolean().optional()
  })
  .strict();

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
      description: nullableTrimmedString,
      color: optionalTrimmedString(32),
      displayOrder: finiteNumber.optional(),
      defaultSeatWidth: positiveFiniteNumber.optional(),
      defaultSeatHeight: positiveFiniteNumber.optional(),
      seatShape: z.enum(SECTION_SEAT_SHAPE_VALUES).optional()
    })
    .strict()
};

export const updateSeatSectionSchema = {
  params: sectionParamsSchema.params,
  body: z
    .object({
      name: z.string().trim().min(1).optional(),
      price: z.coerce.number().positive().optional(),
      description: nullableTrimmedString,
      color: optionalTrimmedString(32),
      displayOrder: finiteNumber.optional(),
      defaultSeatWidth: positiveFiniteNumber.optional(),
      defaultSeatHeight: positiveFiniteNumber.optional(),
      seatShape: z.enum(SECTION_SEAT_SHAPE_VALUES).optional()
    })
    .strict()
};

const autoLayoutSchema = z
  .object({
    enabled: z.boolean().optional(),
    startX: finiteNumber.optional(),
    startY: finiteNumber.optional(),
    seatGapX: positiveFiniteNumber.optional(),
    seatGapY: positiveFiniteNumber.optional(),
    seatWidth: positiveFiniteNumber.optional(),
    seatHeight: positiveFiniteNumber.optional()
  })
  .strict();

export const generateSeatsSchema = {
  params: sectionParamsSchema.params,
  body: z
    .object({
      rows: z.coerce.number().int().min(1),
      seatsPerRow: z.coerce.number().int().min(1),
      initialStatus: z.enum(SEAT_STATUS_VALUES).optional(),
      autoLayout: autoLayoutSchema.optional()
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

export const updateSeatMapLayoutSchema = {
  params: eventIdParamsSchema.params,
  body: z
    .object({
      canvasWidth: positiveFiniteNumber,
      canvasHeight: positiveFiniteNumber,
      gridSize: positiveFiniteNumber.optional(),
      stage: stageSchema.optional(),
      defaultZoom: positiveFiniteNumber.optional(),
      viewport: viewportSchema.optional()
    })
    .strict()
};

export const updateStageSchema = {
  params: eventIdParamsSchema.params,
  body: stageSchema
};

export const updateSeatLayoutSchema = {
  params: seatParamsSchema.params,
  body: seatLayoutBodySchema
};

export const bulkUpdateSeatLayoutsSchema = {
  params: eventIdParamsSchema.params,
  body: z
    .object({
      seats: z
        .array(
          seatLayoutBodySchema
            .extend({
              seatId: objectIdSchema
            })
            .strict()
        )
        .min(1)
        .max(1000)
        .refine(
          (seats) => new Set(seats.map((seat) => seat.seatId)).size === seats.length,
          "Duplicate seatId values are not allowed."
        )
    })
    .strict()
};
