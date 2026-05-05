export function formatCurrency(value, options = {}) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: options.currency || "USD",
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
    ...options,
  }).format(amount);
}
