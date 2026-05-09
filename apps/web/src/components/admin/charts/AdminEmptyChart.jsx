import "./admin-charts.css";

export default function AdminEmptyChart({
  title = "No chart data",
  message = "There is not enough backend data to render this chart yet.",
}) {
  return (
    <div className="admin-empty-chart">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
