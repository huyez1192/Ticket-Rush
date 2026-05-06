import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTicketById, getTicketQr } from "../../api/ticketApi";
import Button from "../../components/common/Button";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import TicketDetailPanel from "../../components/ticket/TicketDetailPanel";
import TicketQrCard from "../../components/ticket/TicketQrCard";
import { eventDetail } from "../../constants/routes";
import { mapApiError } from "../../utils/mapApiError";
import { normalizeTicket, normalizeTicketQr } from "../../utils/ticketMappers";

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [qr, setQr] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTicket = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [ticketPayload, qrPayload] = await Promise.all([getTicketById(ticketId), getTicketQr(ticketId)]);
      setTicket(normalizeTicket(ticketPayload));
      setQr(normalizeTicketQr(qrPayload));
    } catch (apiError) {
      setError(mapApiError(apiError));
      setTicket(null);
      setQr(null);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  if (isLoading) {
    return (
      <main className="page-shell">
        <LoadingState title="Loading ticket" message="Fetching ticket details and QR token." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-shell">
        <ErrorState
          title="Could not load ticket"
          message={error.message}
          action={
            <div className="auth-state-actions">
              <Button onClick={loadTicket}>Retry</Button>
              <Link to="/my-tickets">
                <Button variant="outline">Back to my tickets</Button>
              </Link>
            </div>
          }
        />
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="page-shell">
        <ErrorState title="Ticket not found" message="This ticket could not be loaded." />
      </main>
    );
  }

  return (
    <main className="ticket-detail-page">
      <div className="page-stack">
        <div className="auth-state-actions">
          <Link to="/my-tickets" className="auth-link">
            Back to my tickets
          </Link>
          <Link to={ticket.event?.id ? eventDetail(ticket.event.id) : "/events"} className="auth-link">
            Back to events
          </Link>
        </div>
        <section className="ticket-detail-layout">
          <TicketDetailPanel ticket={ticket} />
          <TicketQrCard qr={qr} />
        </section>
      </div>
    </main>
  );
}
