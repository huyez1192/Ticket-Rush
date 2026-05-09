import { formatCurrency } from "../../utils/formatCurrency";
import AdminBarChart from "./charts/AdminBarChart";
import AdminChartCard from "./charts/AdminChartCard";
import AdminChartLegend from "./charts/AdminChartLegend";
import AdminDonutChart from "./charts/AdminDonutChart";
import AdminHorizontalBarChart from "./charts/AdminHorizontalBarChart";
import AdminStatCard from "./charts/AdminStatCard";

const COLORS = {
  available: "var(--color-success)",
  locked: "var(--color-warning)",
  sold: "var(--color-danger)",
  released: "var(--color-muted)",
  primary: "var(--color-primary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  muted: "var(--color-muted)",
};

function numberText(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function hasAnyValue(items) {
  return items.some((item) => Number(item.value || 0) > 0);
}

export function RevenuePanel({ stats, loading, error, onRetry }) {
  const summaryItems = [
    { label: "Revenue", value: stats?.totalRevenue || 0, displayValue: formatCurrency(stats?.totalRevenue), color: COLORS.primary },
    { label: "Paid orders", value: stats?.paidOrders || 0, displayValue: numberText(stats?.paidOrders), color: COLORS.success },
    { label: "Sold tickets", value: stats?.soldTickets || 0, displayValue: numberText(stats?.soldTickets), color: COLORS.warning },
  ];
  const hasBuckets = Array.isArray(stats?.buckets) && stats.buckets.length > 0 && hasAnyValue(stats.buckets);
  const hasAggregate = hasAnyValue(summaryItems);

  return (
    <AdminChartCard
      title="Revenue"
      eyebrow="Selected event"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!hasAggregate && !hasBuckets}
      emptyTitle={stats ? "No paid revenue yet" : "No event selected"}
      emptyMessage={stats ? "This event has no paid orders or sold tickets in the dashboard response." : "Choose an event to load revenue analytics."}
    >
      <div className="admin-stat-grid">
        <AdminStatCard label="Total revenue" value={formatCurrency(stats?.totalRevenue)} tone="success" />
        <AdminStatCard label="Paid orders" value={numberText(stats?.paidOrders)} />
        <AdminStatCard
          label="Avg. per paid order"
          value={formatCurrency(stats?.averageRevenuePerPaidOrder)}
          detail="Derived from revenue / paid orders"
        />
      </div>

      {hasBuckets ? (
        <AdminBarChart items={stats.buckets} valueFormatter={(value) => formatCurrency(value, { maximumFractionDigits: 0 })} />
      ) : (
        <AdminHorizontalBarChart items={summaryItems} valueFormatter={numberText} />
      )}
    </AdminChartCard>
  );
}

export function OccupancyPanel({ stats, loading, error, onRetry }) {
  const occupancy = Math.max(0, Math.min(100, Number(stats?.occupancyRate || 0)));
  const items = [
    { label: "Available", value: stats?.available || 0, color: COLORS.available },
    { label: "Locked", value: stats?.locked || 0, color: COLORS.locked },
    { label: "Sold", value: stats?.sold || 0, color: COLORS.sold },
    { label: "Released", value: stats?.released || 0, color: COLORS.released },
  ];
  const totalSeats = stats?.totalSeats || items.reduce((sum, item) => sum + Number(item.value || 0), 0);

  return (
    <AdminChartCard
      title="Seat occupancy"
      eyebrow={`${occupancy.toFixed(1)}% occupied`}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!totalSeats}
      emptyTitle={stats ? "No seats configured" : "No event selected"}
      emptyMessage={stats ? "Seat occupancy appears after seats are generated for the selected event." : "Choose an event to load seat occupancy."}
    >
      <div className="admin-donut-with-legend">
        <AdminDonutChart items={items} centerValue={numberText(totalSeats)} centerLabel="Total seats" />
        <AdminChartLegend items={items.map((item) => ({ ...item, value: numberText(item.value) }))} />
      </div>
    </AdminChartCard>
  );
}

export function DemographicsPanel({ stats, loading, error, onRetry }) {
  const genderItems = (stats?.gender || []).map((item, index) => ({
    label: item.gender || "Unknown",
    value: item.count || 0,
    color: [COLORS.primary, COLORS.success, COLORS.warning, COLORS.muted][index % 4],
  }));
  const ageItems = (stats?.ageGroups || []).map((item, index) => ({
    label: item.range || "Unknown",
    value: item.count || 0,
    color: [COLORS.success, COLORS.primary, COLORS.warning, COLORS.danger, COLORS.muted][index % 5],
  }));
  const hasData = hasAnyValue(genderItems) || hasAnyValue(ageItems);

  return (
    <AdminChartCard
      title="Customer demographics"
      eyebrow="Paid ticket buyers"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!hasData}
      emptyTitle={stats ? "No demographic data" : "No event selected"}
      emptyMessage={stats ? "Demographics require paid customer orders with profile data for this event." : "Choose an event to load customer demographics."}
    >
      <div className="admin-donut-with-legend">
        <AdminDonutChart
          items={genderItems}
          centerValue={numberText(genderItems.reduce((sum, item) => sum + item.value, 0))}
          centerLabel="Gender"
        />
        <AdminChartLegend items={genderItems.map((item) => ({ ...item, value: numberText(item.value) }))} />
      </div>

      <AdminHorizontalBarChart items={ageItems} valueFormatter={numberText} />
    </AdminChartCard>
  );
}

export function OrderStatusPanel({ stats, loading, error, onRetry }) {
  const colorByStatus = {
    Paid: COLORS.success,
    Pending: COLORS.warning,
    Expired: COLORS.muted,
    Cancelled: COLORS.danger,
    Unknown: COLORS.primary,
  };
  const items = (stats?.items || []).map((item) => ({
    ...item,
    color: colorByStatus[item.label] || COLORS.primary,
  }));

  return (
    <AdminChartCard
      title="Order status"
      eyebrow="Recent admin orders"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!stats?.total}
      emptyTitle="No orders available"
      emptyMessage="Order status distribution appears when the admin orders endpoint returns order rows."
    >
      <AdminHorizontalBarChart items={items} valueFormatter={numberText} />
    </AdminChartCard>
  );
}
