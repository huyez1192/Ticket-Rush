import "./admin-charts.css";

function getMax(items) {
  return Math.max(0, ...items.map((item) => Number(item.value || 0)));
}

export default function AdminBarChart({ items = [], valueFormatter = (value) => value }) {
  const max = getMax(items);

  return (
    <div className="admin-bar-chart">
      {items.map((item) => {
        const value = Math.max(0, Number(item.value || 0));
        const height = max > 0 ? Math.max(6, (value / max) * 100) : 0;

        return (
          <div className="admin-bar-chart__item" key={item.label}>
            <div className="admin-bar-chart__track" aria-label={`${item.label}: ${valueFormatter(value)}`}>
              <span style={{ height: `${height}%`, background: item.color }} />
            </div>
            <strong>{valueFormatter(value)}</strong>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
