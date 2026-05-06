import "./admin.css";

export default function AdminMetricCard({ label, value, detail }) {
  return (
    <article className="admin-metric-card">
      <span className="admin-metric-card__label">{label}</span>
      <strong className="admin-metric-card__value">{value}</strong>
      {detail ? <p>{detail}</p> : null}
    </article>
  );
}
