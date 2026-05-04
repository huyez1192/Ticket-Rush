import mongoose from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../common/errors/AppError.js";
import { sendError } from "../common/responses/apiResponse.js";
import { env } from "../config/env.js";

function mapZodErrors(error) {
  const formattedErrors = {};

  for (const issue of error.errors) {
    const field = issue.path.join(".") || "root";
    formattedErrors[field] = formattedErrors[field] || [];
    formattedErrors[field].push(issue.message);
  }

  return formattedErrors;
}

function mapMongooseValidationErrors(error) {
  const formattedErrors = {};

  for (const [field, value] of Object.entries(error.errors)) {
    formattedErrors[field] = [value.message];
  }

  return formattedErrors;
}

export function errorMiddleware(error, _req, res, _next) {
  if (error instanceof AppError) {
    return sendError(res, error.statusCode, error.message, error.errors);
  }

  if (error instanceof ZodError) {
    return sendError(res, 400, "Validation failed.", mapZodErrors(error));
  }

  if (error instanceof mongoose.Error.CastError) {
    return sendError(res, 400, "Invalid resource identifier.");
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return sendError(res, 400, "Validation failed.", mapMongooseValidationErrors(error));
  }

  const message = env.NODE_ENV === "production" ? "Internal server error." : error.message;

  return sendError(res, 500, message || "Internal server error.");
}
