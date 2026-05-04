export class AppError extends Error {
  constructor(message, statusCode = 500, errors = undefined, isOperational = true) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}
