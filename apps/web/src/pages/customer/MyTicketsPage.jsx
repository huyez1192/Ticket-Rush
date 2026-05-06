import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getMyTickets } from "../../api/ticketApi";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import Pagination from "../../components/common/Pagination";
import TicketCard from "../../components/ticket/TicketCard";
import { mapApiError } from "../../utils/mapApiError";
import { normalizeTicketsPayload } from "../../utils/ticketMappers";

export default function MyTicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const page = Number(searchParams.get("page") || 1);
  const requestParams = useMemo(() => ({ page, limit: 20 }), [page]);

  async function loadTickets(params = requestParams) {
    setIsLoading(true);
    setError(null);

    try {
      const payload = await getMyTickets(params);
      const normalized = normalizeTicketsPayload(payload);
      setTickets(normalized.items);
      setPagination(normalized.pagination);
    } catch (apiError) {
      setError(mapApiError(apiError));
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTickets(requestParams);
  }, [requestParams]);

  function handlePageChange(nextPage) {
    setSearchParams({ page: String(nextPage) }, { replace: true });
  }

  return (
    <main className="ticket-page">
      <div className="page-stack">
        <header className="page-header">
          <div>
            <p className="page-kicker">Customer tickets</p>
            <h1 className="page-title">My tickets</h1>
          </div>
          <p className="phase-note">
            {pagination.total ? `${pagination.total} ticket${pagination.total === 1 ? "" : "s"}` : "Paid tickets appear here"}
          </p>
        </header>

        {isLoading ? <LoadingState title="Loading tickets" message="Fetching your issued tickets." /> : null}

        {error && !isLoading ? (
          <ErrorState
            title="Could not load tickets"
            message={error.message}
            action={<Button onClick={() => loadTickets(requestParams)}>Retry</Button>}
          />
        ) : null}

        {!isLoading && !error && !tickets.length ? (
          <EmptyState
            title="No tickets yet"
            message="Paid checkout tickets will appear here."
            action={
              <Link to="/events">
                <Button>Browse events</Button>
              </Link>
            }
          />
        ) : null}

        {!isLoading && !error && tickets.length ? (
          <>
            <section className="ticket-list" aria-label="My tickets">
              {tickets.map((ticket) => (
                <TicketCard ticket={ticket} key={ticket.id} />
              ))}
            </section>
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
          </>
        ) : null}
      </div>
    </main>
  );
}
