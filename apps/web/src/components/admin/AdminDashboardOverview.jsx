import { getOverviewMetricItems } from "../../utils/dashboardMappers";
import AdminMetricCard from "./AdminMetricCard";
import "./admin.css";

export default function AdminDashboardOverview({ overview }) {
  const metrics = getOverviewMetricItems(overview);

  return (
    <section className="admin-metric-grid" aria-label="Dashboard overview metrics">
      {metrics.map((metric) => (
        <AdminMetricCard key={metric.label} {...metric} />
      ))}
    </section>
  );
}
