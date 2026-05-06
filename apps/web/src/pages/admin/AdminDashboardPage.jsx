import { useCallback, useEffect, useState } from "react";
import {
  getAdminEvents,
  getDashboardOverview,
  getEventDemographics,
  getEventRevenue,
  getEventSeatOccupancy,
} from "../../api/adminApi";
import AdminDashboardEventSelector from "../../components/admin/AdminDashboardEventSelector";
import AdminDashboardOverview from "../../components/admin/AdminDashboardOverview";
import {
  DemographicsPanel,
  OccupancyPanel,
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
  normalizeRevenueStats,
  normalizeSeatOccupancyStats,
} from "../../utils/dashboardMappers";
import { normalizeAdminEventsPayload } from "../../utils/adminEventMappers";

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [analytics, setAnalytics] = useState({ revenue: null, occupancy: null, demographics: null });
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState("");
  const [analyticsError, setAnalyticsError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [overviewPayload, eventsPayload] = await Promise.all([
        getDashboardOverview(),
        getAdminEvents({ page: 1, limit: 50 }),
      ]);
      const normalizedEvents = normalizeAdminEventsPayload(eventsPayload).items;
      setOverview(normalizeDashboardOverview(overviewPayload));
      setEvents(normalizedEvents);
      setSelectedEventId((current) => current || normalizedEvents[0]?.id || "");
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!selectedEventId) {
      setAnalytics({ revenue: null, occupancy: null, demographics: null });
      return;
    }

    let cancelled = false;

    async function loadAnalytics() {
      setAnalyticsLoading(true);
      setAnalyticsError("");

      try {
        const [revenuePayload, occupancyPayload, demographicsPayload] = await Promise.all([
          getEventRevenue(selectedEventId),
          getEventSeatOccupancy(selectedEventId),
          getEventDemographics(selectedEventId),
        ]);

        if (!cancelled) {
          setAnalytics({
            revenue: normalizeRevenueStats(revenuePayload),
            occupancy: normalizeSeatOccupancyStats(occupancyPayload),
            demographics: normalizeDemographicsStats(demographicsPayload),
          });
        }
      } catch (apiError) {
        if (!cancelled) {
          setAnalyticsError(apiError.message);
          setAnalytics({ revenue: null, occupancy: null, demographics: null });
        }
      } finally {
        if (!cancelled) {
          setAnalyticsLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [selectedEventId]);

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
            disabled={analyticsLoading}
          />
          <p>
            The dashboard uses backend aggregate endpoints. Live-user and time-series widgets from the source design are intentionally represented as aggregate panels until matching data exists.
          </p>
        </div>

        {events.length ? null : (
          <EmptyState title="No analytics events" message="No published or selling events are available for event analytics." />
        )}
      </section>

      {analyticsError ? (
        <ErrorState title="Event analytics unavailable" message={analyticsError} />
      ) : analyticsLoading ? (
        <LoadingState title="Loading event analytics" message="Fetching selected event metrics." />
      ) : selectedEventId ? (
        <section className="admin-dashboard-layout">
          <RevenuePanel stats={analytics.revenue} />
          <OccupancyPanel stats={analytics.occupancy} />
          <DemographicsPanel stats={analytics.demographics} />
        </section>
      ) : null}
    </div>
  );
}
