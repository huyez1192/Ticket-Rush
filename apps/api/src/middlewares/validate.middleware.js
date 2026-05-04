import { ZodError } from "zod";
import { AppError } from "../common/errors/AppError.js";

function mapZodErrors(error) {
  const formattedErrors = {};

  for (const issue of error.errors) {
    const field = issue.path.join(".") || "root";
    formattedErrors[field] = formattedErrors[field] || [];
    formattedErrors[field].push(issue.message);
  }

  return formattedErrors;
}

function parseRequestPart(schema, value) {
  if (!schema) {
    return value;
  }

  return schema.parse(value);
}

export function validate(schema) {
  return (req, _res, next) => {
    try {
      req.body = parseRequestPart(schema.body, req.body);
      req.params = parseRequestPart(schema.params, req.params);
      req.query = parseRequestPart(schema.query, req.query);

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError("Validation failed.", 400, mapZodErrors(error)));
        return;
      }

      next(error);
    }
  };
}
