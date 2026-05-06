import Card from "../common/Card";
import StatusBadge from "../common/StatusBadge";
import { formatDate, formatDateRange } from "../../utils/formatDate";
import { getSeatDisplayName } from "../../utils/seatMappers";
import "./ticket.css";

export default function TicketDetailPanel({ ticket }) {
  return (
    <Card className="ticket-detail-panel">
      <header className="ticket-detail-panel__header">
        <div>
          <p className="page-kicker">Electronic ticket</p>
          <h1>{ticket.event?.name || "Ticket Rush event"}</h1>
          <p>{ticket.event?.location || "Location to be announced"}</p>
        </div>
        <StatusBadge status={ticket.status} />
      </header>
      <div className="ticket-detail-panel__grid">
        <TicketFact label="Date" value={formatDateRange(ticket.event?.startTime, ticket.event?.endTime)} />
        <TicketFact label="Issued" value={formatDate(ticket.issuedAt, { dateStyle: "medium", timeStyle: "short" })} />
        <TicketFact label="Section" value={ticket.seat?.sectionName || "Section"} />
        <TicketFact label="Seat" value={ticket.seat ? getSeatDisplayName(ticket.seat) : "Seat details unavailable"} />
      </div>
      <footer className="ticket-detail-panel__footer">
        <span>Ticket ID</span>
        <strong>{ticket.id}</strong>
      </footer>
    </Card>
  );
}

function TicketFact({ label, value }) {
  return (
    <div className="ticket-fact">
      <span>{label}</span>
      <strong>{value || "Unavailable"}</strong>
    </div>
  );
}
