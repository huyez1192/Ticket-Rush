import "./admin-charts.css";

function getMax(items) {
  return Math.max(0, ...items.map((item) => Number(item.value || 0)));
}

export default function AdminHorizontalBarChart({ items = [], valueFormatter = (value) => value }) {
  const max = getMax(items);

  return (
    <div className="admin-horizontal-chart">
      {items.map((item) => {
        const value = Math.max(0, Number(item.value || 0));
        const width = max > 0 ? (value / max) * 100 : 0;

        return (
          <div className="admin-horizontal-chart__row" key={item.label}>
            <div className="admin-horizontal-chart__label">
              <span>{item.label}</span>
              <strong>{item.displayValue ?? valueFormatter(value)}</strong>
            </div>
            <div className="admin-horizontal-chart__track" aria-label={`${item.label}: ${item.displayValue ?? valueFormatter(value)}`}>
              <span style={{ width: `${width}%`, background: item.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
