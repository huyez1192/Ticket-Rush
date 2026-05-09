import Button from "../../common/Button";
import AdminEmptyChart from "./AdminEmptyChart";
import "./admin-charts.css";

export default function AdminChartCard({
  title,
  eyebrow,
  action,
  children,
  loading = false,
  error = "",
  empty = false,
  emptyTitle,
  emptyMessage,
  onRetry,
}) {
  return (
    <section className="admin-chart-card">
      <header className="admin-chart-card__header">
        <div>
          {eyebrow ? <p className="admin-chart-card__eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
        {action}
      </header>

      {loading ? (
        <div className="admin-chart-loading" aria-live="polite">
          <span />
          <span />
          <span />
        </div>
      ) : error ? (
        <div className="admin-chart-error" role="alert">
          <strong>Chart unavailable</strong>
          <p>{error}</p>
          {onRetry ? <Button variant="outline" onClick={onRetry}>Retry</Button> : null}
        </div>
      ) : empty ? (
        <AdminEmptyChart title={emptyTitle} message={emptyMessage} />
      ) : (
        children
      )}
    </section>
  );
}
