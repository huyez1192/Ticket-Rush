import { Link } from "react-router-dom";
import Button from "../common/Button";
import StatusBadge from "../common/StatusBadge";
import { ticketDetail } from "../../constants/routes";
import { formatDate } from "../../utils/formatDate";
import { getSeatDisplayName } from "../../utils/seatMappers";
import "./ticket.css";

export default function TicketCard({ ticket }) {
  const issuedDate = ticket.issuedAt ? new Date(ticket.issuedAt) : null;
  const hasIssuedDate = issuedDate && !Number.isNaN(issuedDate.getTime());

  return (
    <article className="ticket-card">
      <div className="ticket-card__date">
        <span>{hasIssuedDate ? issuedDate.toLocaleString("en-US", { month: "short" }) : "TR"}</span>
        <strong>{hasIssuedDate ? issuedDate.getDate() : "--"}</strong>
        <small>{hasIssuedDate ? issuedDate.getFullYear() : "Ticket"}</small>
      </div>
      <div className="ticket-card__body">
        <header>
          <div>
            <h3>{ticket.event?.name || "Ticket Rush event"}</h3>
            <p>{ticket.event?.location || "Location to be announced"}</p>
          </div>
          <StatusBadge status={ticket.status} />
        </header>
        <div className="ticket-card__meta">
          <span>{ticket.seat?.sectionName || "Section"}</span>
          <span>{ticket.seat ? getSeatDisplayName(ticket.seat) : "Seat details unavailable"}</span>
          <span>Issued {formatDate(ticket.issuedAt, { dateStyle: "medium", timeStyle: "short" }) || "recently"}</span>
        </div>
        <footer>
          <span>Ticket #{String(ticket.id).slice(-8).toUpperCase()}</span>
          <Link to={ticketDetail(ticket.id)}>
            <Button size="sm" variant="outline">View QR</Button>
          </Link>
        </footer>
      </div>
    </article>
  );
}
