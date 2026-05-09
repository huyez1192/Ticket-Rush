import { useCallback, useEffect, useState } from "react";
import {
  getAdminEvents,
  getDashboardOverview,
  getEventDemographics,
  getEventRevenue,
  getEventSeatOccupancy,
  getAdminOrders,
} from "../../api/adminApi";
import AdminDashboardEventSelector from "../../components/admin/AdminDashboardEventSelector";
import AdminDashboardOverview from "../../components/admin/AdminDashboardOverview";
import {
  DemographicsPanel,
  OccupancyPanel,
  OrderStatusPanel,
  RevenuePanel,
} from "../../components/admin/AdminDashboardPanel";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import {
  normalizeDashboardOverview,
  normalizeDemographicsStats,
  normalizeOrderStatusCounts,
  normalizeRevenueStats,
  normalizeSeatOccupancyStats,
} from "../../utils/dashboardMappers";
import { normalizeAdminEventsPayload } from "../../utils/adminEventMappers";

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [revenueState, setRevenueState] = useState({ data: null, loading: false, error: "" });
  const [occupancyState, setOccupancyState] = useState({ data: null, loading: false, error: "" });
  const [demographicsState, setDemographicsState] = useState({ data: null, loading: false, error: "" });
  const [orderStatusState, setOrderStatusState] = useState({ data: null, loading: false, error: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [overviewPayload, eventsPayload] = await Promise.all([
        getDashboardOverview(),
        getAdminEvents({ page: 1, limit: 50 }),
      ]);
      const normalizedEvents = normalizeAdminEventsPayload(eventsPayload).items;
      const defaultEvent = normalizedEvents.find((event) => event.status === "Selling") || normalizedEvents[0];
      setOverview(normalizeDashboardOverview(overviewPayload));
      setEvents(normalizedEvents);
      setSelectedEventId((current) => current || defaultEvent?.id || "");
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const loadRevenue = useCallback(async (eventId) => {
    if (!eventId) {
      setRevenueState({ data: null, loading: false, error: "" });
      return;
    }

    setRevenueState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const payload = await getEventRevenue(eventId);
      setRevenueState({ data: normalizeRevenueStats(payload), loading: false, error: "" });
    } catch (apiError) {
      setRevenueState({ data: null, loading: false, error: apiError.message });
    }
  }, []);

  const loadOccupancy = useCallback(async (eventId) => {
    if (!eventId) {
      setOccupancyState({ data: null, loading: false, error: "" });
      return;
    }

    setOccupancyState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const payload = await getEventSeatOccupancy(eventId);
      setOccupancyState({ data: normalizeSeatOccupancyStats(payload), loading: false, error: "" });
    } catch (apiError) {
      setOccupancyState({ data: null, loading: false, error: apiError.message });
    }
  }, []);

  const loadDemographics = useCallback(async (eventId) => {
    if (!eventId) {
      setDemographicsState({ data: null, loading: false, error: "" });
      return;
    }

    setDemographicsState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const payload = await getEventDemographics(eventId);
      setDemographicsState({ data: normalizeDemographicsStats(payload), loading: false, error: "" });
    } catch (apiError) {
      setDemographicsState({ data: null, loading: false, error: apiError.message });
    }
  }, []);

  const loadOrderStatus = useCallback(async () => {
    setOrderStatusState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const payload = await getAdminOrders({ page: 1, limit: 100 });
      setOrderStatusState({ data: normalizeOrderStatusCounts(payload), loading: false, error: "" });
    } catch (apiError) {
      setOrderStatusState({ data: null, loading: false, error: apiError.message });
    }
  }, []);

  useEffect(() => {
    loadOrderStatus();
  }, [loadOrderStatus]);

  useEffect(() => {
    loadRevenue(selectedEventId);
    loadOccupancy(selectedEventId);
    loadDemographics(selectedEventId);
  }, [loadDemographics, loadOccupancy, loadRevenue, selectedEventId]);

  if (loading) {
    return <LoadingState title="Loading dashboard" message="Fetching admin overview metrics." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        message={error}
        action={<Button onClick={loadDashboard}>Retry</Button>}
      />
    );
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        kicker="Admin analytics"
        title="Dashboard Overview"
        subtitle="Track platform totals and event-level sales, occupancy, and customer mix."
        actions={<Button variant="outline" onClick={loadDashboard}>Refresh</Button>}
      />

      <AdminDashboardOverview overview={overview} />

      <section className="admin-dashboard-layout">
        <div className="admin-panel admin-panel--tinted">
          <AdminDashboardEventSelector
            events={events}
            value={selectedEventId}
            onChange={setSelectedEventId}
            disabled={revenueState.loading || occupancyState.loading || demographicsState.loading}
          />
          <p>
            Event-specific charts use backend dashboard aggregate endpoints. Time-series bars render only when the API returns buckets.
          </p>
        </div>

        {events.length ? null : (
          <EmptyState title="No analytics events" message="No published or selling events are available for event analytics." />
        )}
      </section>

      <section className="admin-dashboard-chart-grid">
        <RevenuePanel
          stats={revenueState.data}
          loading={revenueState.loading}
          error={revenueState.error}
          onRetry={() => loadRevenue(selectedEventId)}
        />
        <OccupancyPanel
          stats={occupancyState.data}
          loading={occupancyState.loading}
          error={occupancyState.error}
          onRetry={() => loadOccupancy(selectedEventId)}
        />
        <DemographicsPanel
          stats={demographicsState.data}
          loading={demographicsState.loading}
          error={demographicsState.error}
          onRetry={() => loadDemographics(selectedEventId)}
        />
        <OrderStatusPanel
          stats={orderStatusState.data}
          loading={orderStatusState.loading}
          error={orderStatusState.error}
          onRetry={loadOrderStatus}
        />
      </section>
    </div>
  );
}
