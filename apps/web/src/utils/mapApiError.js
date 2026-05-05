export function mapApiError(error) {
  if (!error) {
    return {
      statusCode: 0,
      message: "Something went wrong.",
      errors: null,
      raw: error,
    };
  }

  if (error.isNormalizedApiError) {
    return error;
  }

  const response = error.response;
  const data = response?.data || {};
  const networkMessage = !response
    ? "Unable to reach the Ticket Rush API. Check that the backend is running and VITE_API_BASE_URL is correct."
    : null;
  const validationMessages = normalizeValidationErrors(data.errors);

  return {
    isNormalizedApiError: true,
    statusCode: response?.status || 0,
    status: data?.status || "failed",
    message: data?.message || networkMessage || error.message || "Something went wrong.",
    errors: validationMessages,
    raw: error,
  };
}

function normalizeValidationErrors(errors) {
  if (!errors) {
    return null;
  }

  if (Array.isArray(errors)) {
    return { form: errors.map(String) };
  }

  if (typeof errors === "string") {
    return { form: [errors] };
  }

  return Object.entries(errors).reduce((result, [field, messages]) => {
    result[field] = Array.isArray(messages) ? messages.map(String) : [String(messages)];
    return result;
  }, {});
}
