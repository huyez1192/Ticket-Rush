export function getFieldError(errors, fieldName) {
  const value = errors?.[fieldName];

  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}
