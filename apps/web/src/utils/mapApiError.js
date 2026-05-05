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
  const data = response?.data;

  return {
    isNormalizedApiError: true,
    statusCode: response?.status || 0,
    status: data?.status || "failed",
    message: data?.message || error.message || "Something went wrong.",
    errors: data?.errors || null,
    raw: error,
  };
}
