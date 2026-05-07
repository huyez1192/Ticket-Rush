import StatusBadge from "../common/StatusBadge";

export default function AdminOrderStatusBadge({ status, className = "" }) {
  return <StatusBadge status={status || "Unknown"} className={className} />;
}
