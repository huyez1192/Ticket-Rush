export function sendSuccess(res, statusCode = 200, message = "Operation completed successfully.", data = {}) {
  return res.status(statusCode).json({
    status: "success",
    message,
    data
  });
}

export function sendCreated(res, message = "Resource created successfully.", data = {}) {
  return sendSuccess(res, 201, message, data);
}

export function sendNoContent(res) {
  return res.status(204).send();
}

export function sendError(res, statusCode = 500, message = "Internal server error.", errors) {
  const payload = {
    status: "failed",
    message
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
}
