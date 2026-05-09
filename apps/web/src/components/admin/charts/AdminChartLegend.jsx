import "./admin-charts.css";

export default function AdminChartLegend({ items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <ul className="admin-chart-legend">
      {items.map((item) => (
        <li key={item.label}>
          <span className="admin-chart-legend__swatch" style={{ background: item.color }} aria-hidden="true" />
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </li>
      ))}
    </ul>
  );
}
