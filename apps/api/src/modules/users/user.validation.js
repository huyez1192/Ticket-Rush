import { z } from "zod";

const optionalNullableString = (maxLength) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .nullable()
    .optional()
    .transform((value) => (value === null || value === "" ? undefined : value));

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date format YYYY-MM-DD.")
  .nullable()
  .optional()
  .transform((value) => (value === null || value === "" ? undefined : value));

export const updateProfileSchema = {
  body: z
    .object({
      username: z.string().trim().min(3).max(100).optional(),
      email: z.string().trim().email().toLowerCase().optional(),
      dateOfBirth: dateOnlySchema,
      gender: z.enum(["Male", "Female", "Other"]).optional(),
      fullName: optionalNullableString(200)
    })
    .strict()
};

export const changePasswordSchema = {
  body: z
    .object({
      oldPassword: z.string().min(1),
      newPassword: z.string().min(6)
    })
    .strict()
};
