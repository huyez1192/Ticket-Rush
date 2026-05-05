export default function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  ...props
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Working..." : children}
    </button>
  );
}
