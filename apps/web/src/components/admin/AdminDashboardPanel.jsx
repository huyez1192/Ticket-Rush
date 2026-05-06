import { formatCurrency } from "../../utils/formatCurrency";
import "./admin.css";

export default function AdminDashboardPanel({ title, eyebrow, children, action }) {
  return (
    <section className="admin-panel">
      <header className="admin-panel__header">
        <div>
          {eyebrow ? <p className="admin-panel__eyebrow">{eyebrow}</p> : null}
          <h2 className="admin-panel__title">{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function RevenuePanel({ stats }) {
  return (
    <AdminDashboardPanel title="Revenue" eyebrow="Selected event">
      <ul className="admin-analytics-list">
        <AnalyticsRow label="Total revenue" value={formatCurrency(stats?.totalRevenue)} />
        <AnalyticsRow label="Paid orders" value={stats?.paidOrders || 0} />
        <AnalyticsRow label="Sold tickets" value={stats?.soldTickets || 0} />
      </ul>
    </AdminDashboardPanel>
  );
}

export function OccupancyPanel({ stats }) {
  const occupancy = Math.max(0, Math.min(100, Number(stats?.occupancyRate || 0)));

  return (
    <AdminDashboardPanel title="Seat occupancy" eyebrow={`${occupancy.toFixed(1)}% filled`}>
      <div className="admin-analytics-bar" aria-label={`Occupancy ${occupancy.toFixed(1)} percent`}>
        <span style={{ width: `${occupancy}%` }} />
      </div>
      <ul className="admin-analytics-list">
        <AnalyticsRow label="Available" value={stats?.available || 0} />
        <AnalyticsRow label="Locked" value={stats?.locked || 0} />
        <AnalyticsRow label="Sold" value={stats?.sold || 0} />
        <AnalyticsRow label="Released" value={stats?.released || 0} />
      </ul>
    </AdminDashboardPanel>
  );
}

export function DemographicsPanel({ stats }) {
  return (
    <AdminDashboardPanel title="Customer demographics" eyebrow="Paid ticket buyers">
      <h3>Gender</h3>
      <AnalyticsList items={stats?.gender || []} labelKey="gender" />
      <h3>Age groups</h3>
      <AnalyticsList items={stats?.ageGroups || []} labelKey="range" />
    </AdminDashboardPanel>
  );
}

function AnalyticsList({ items, labelKey }) {
  if (!items.length) {
    return <p>No demographic data available yet.</p>;
  }

  return (
    <ul className="admin-analytics-list">
      {items.map((item) => (
        <AnalyticsRow key={item[labelKey] || "Unknown"} label={item[labelKey] || "Unknown"} value={item.count || 0} />
      ))}
    </ul>
  );
}

function AnalyticsRow({ label, value }) {
  return (
    <li className="admin-analytics-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </li>
  );
}
