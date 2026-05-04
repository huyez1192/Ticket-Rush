import { AppError } from "../common/errors/AppError.js";

export function notFoundMiddleware(req, _res, next) {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
}
