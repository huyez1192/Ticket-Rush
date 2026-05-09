import "./admin-charts.css";

export default function AdminStatCard({ label, value, detail, tone = "default" }) {
  return (
    <article className={`admin-stat-card admin-stat-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <p>{detail}</p> : null}
    </article>
  );
}
