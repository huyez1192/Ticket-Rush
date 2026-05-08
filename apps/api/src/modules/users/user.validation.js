import { z } from "zod";

const optionalNullableString = (maxLength) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .nullable()
    .optional()
    .transform((value) => (value === null || value === "" ? null : value));

const optionalNullableUrl = z
  .preprocess(
    (value) => (value === null || value === "" ? null : value),
    z.string().trim().url("Avatar URL must be a valid URL.").max(1000).nullable().optional()
  );

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date format YYYY-MM-DD.")
  .nullable()
  .optional()
  .transform((value) => (value === null || value === "" ? null : value));

export const updateProfileSchema = {
  body: z
    .object({
      username: z.string().trim().min(3).max(100).optional(),
      email: z.string().trim().email().toLowerCase().optional(),
      dateOfBirth: dateOnlySchema,
      gender: z.enum(["Male", "Female", "Other"]).optional(),
      fullName: optionalNullableString(200),
      avatarUrl: optionalNullableUrl
    })
    .strict()
};

export const changePasswordSchema = {
  body: z
    .object({
      oldPassword: z.string().min(1).optional(),
      currentPassword: z.string().min(1).optional(),
      newPassword: z.string().min(6)
    })
    .strict()
    .refine((value) => value.oldPassword || value.currentPassword, {
      message: "Current password is required.",
      path: ["currentPassword"]
    })
};
