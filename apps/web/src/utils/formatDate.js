export function formatDate(value, options = {}) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: options.dateStyle || "medium",
    timeStyle: options.timeStyle,
    ...options,
  }).format(date);
}
