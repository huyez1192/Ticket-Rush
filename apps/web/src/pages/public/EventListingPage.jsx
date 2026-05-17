import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getEvents } from "../../api/eventApi";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import Pagination from "../../components/common/Pagination";
import EventCard from "../../components/event/EventCard";
import EventFilters from "../../components/event/EventFilters";
import { normalizeEventsPayload } from "../../utils/eventMappers";
import { mapApiError } from "../../utils/mapApiError";

const defaultFilters = {
  keyword: "",
  status: "",
  from: "",
  to: "",
  page: 1,
  limit: 12,
};

export default function EventListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => readFiltersFromParams(searchParams));
  const [appliedFilters, setAppliedFilters] = useState(() => readFiltersFromParams(searchParams));
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const requestParams = useMemo(() => buildRequestParams(appliedFilters), [appliedFilters]);

  async function loadEvents(params = requestParams) {
    setIsLoading(true);
    setError(null);

    try {
      const payload = await getEvents(params);
      const normalized = normalizeEventsPayload(payload);
      setEvents(normalized.items);
      setPagination(normalized.pagination);
    } catch (apiError) {
      setError(mapApiError(apiError));
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const nextFilters = readFiltersFromParams(searchParams);
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  }, [searchParams]);

  useEffect(() => {
    loadEvents(buildRequestParams(appliedFilters));
  }, [appliedFilters]);

  function updateUrl(nextFilters) {
    const params = new URLSearchParams();

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, String(value));
      }
    });

    setSearchParams(params, { replace: true });
  }

  function handleFilterSubmit(event) {
    event.preventDefault();
    updateUrl({ ...filters, page: 1 });
  }

  function handleReset() {
    updateUrl(defaultFilters);
  }

  function handlePageChange(nextPage) {
    updateUrl({ ...appliedFilters, page: nextPage });
  }

  return (
    <>
      <section className="event-hero">
        <div className="event-hero__inner">
          <div className="event-hero__copy">
            <h1>Your gateway to <span className="event-hero__headline-accent">unforgettable</span> shows</h1>
            <p className="event-hero__lede">
              Explore a curated world of entertainment and find the events that speak to your soul.
            </p>
          </div>
          <div className="event-hero__search">
            <EventFilters
              filters={filters}
              onChange={setFilters}
              onSubmit={handleFilterSubmit}
              onReset={handleReset}
              isLoading={isLoading}
            />
          </div>
        </div>
      </section>

      <main className="page-shell">
        <div className="page-stack">
          <header className="page-header event-list-header">
            <p className="page-kicker">Public catalog</p>
            <p className="phase-note">
              {pagination.total ? `${pagination.total} event${pagination.total === 1 ? "" : "s"} found` : "Showing public events"}
            </p>
          </header>

          {isLoading ? <LoadingState title="Loading events" message="Fetching public events from the API." /> : null}

          {error && !isLoading ? (
            <ErrorState
              title="Could not load events"
              message={error.message}
              action={<Button onClick={() => loadEvents(buildRequestParams(filters))}>Retry</Button>}
            />
          ) : null}

          {!isLoading && !error && !events.length ? (
            <EmptyState
              title="No events found"
              message="Try changing the keyword, date range, or status filter."
              action={<Button onClick={handleReset}>Reset filters</Button>}
            />
          ) : null}

          {!isLoading && !error && events.length ? (
            <>
              <section className="event-grid" aria-label="Event list">
                {events.map((event) => (
                  <EventCard key={event.id || event._id} event={event} sections={event.sections || []} />
                ))}
              </section>
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
            </>
          ) : null}

          <Link to="/events">
            <Button variant="ghost">Refresh event catalog</Button>
          </Link>
        </div>
      </main>
    </>
  );
}

function readFiltersFromParams(searchParams) {
  return {
    keyword: searchParams.get("keyword") || "",
    status: searchParams.get("status") || "",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    page: Number(searchParams.get("page") || defaultFilters.page),
    limit: Number(searchParams.get("limit") || defaultFilters.limit),
  };
}

function buildRequestParams(filters) {
  const params = {
    page: filters.page || defaultFilters.page,
    limit: filters.limit || defaultFilters.limit,
  };

  ["keyword", "status", "from", "to"].forEach((key) => {
    if (filters[key]) {
      params[key] = filters[key];
    }
  });

  return params;
}
