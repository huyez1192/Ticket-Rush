import Badge from "./Badge";

export default function StatusBadge({ status, className = "" }) {
  const normalized = String(status || "Unknown").toLowerCase();

  return (
    <Badge className={`status-badge--${normalized} ${className}`.trim()} variant="default">
      {status || "Unknown"}
    </Badge>
  );
}
