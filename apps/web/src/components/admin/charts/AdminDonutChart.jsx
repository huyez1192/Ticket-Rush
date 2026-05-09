import "./admin-charts.css";

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function AdminDonutChart({ items = [], centerLabel, centerValue }) {
  const total = items.reduce((sum, item) => sum + Math.max(0, Number(item.value || 0)), 0);
  let offset = 0;

  return (
    <figure className="admin-donut-chart">
      <svg viewBox="0 0 120 120" role="img" aria-label={`${centerLabel || "Total"} ${centerValue ?? total}`}>
        <circle className="admin-donut-chart__base" cx="60" cy="60" r={RADIUS} />
        {total > 0
          ? items.map((item) => {
              const value = Math.max(0, Number(item.value || 0));
              const dash = (value / total) * CIRCUMFERENCE;
              const segment = (
                <circle
                  key={item.label}
                  className="admin-donut-chart__segment"
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  stroke={item.color}
                  strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return segment;
            })
          : null}
      </svg>
      <figcaption>
        <strong>{centerValue ?? total}</strong>
        <span>{centerLabel}</span>
      </figcaption>
    </figure>
  );
}
