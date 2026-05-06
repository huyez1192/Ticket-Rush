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

export function formatDateRange(startValue, endValue) {
  const start = formatDate(startValue, { dateStyle: "medium", timeStyle: "short" });
  const end = formatDate(endValue, { dateStyle: "medium", timeStyle: "short" });

  if (start && end) {
    return `${start} - ${end}`;
  }

  return start || end || "Date to be announced";
}
