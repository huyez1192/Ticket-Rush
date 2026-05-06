import { Link } from "react-router-dom";
import Button from "../common/Button";
import StatusBadge from "../common/StatusBadge";
import { formatDateRange } from "../../utils/formatDate";
import { normalizeEvent } from "../../utils/eventMappers";
import "./event.css";

export default function EventDetailsHeader({ event }) {
  const normalized = normalizeEvent(event);
  const isSelling = normalized.status === "Selling";

  return (
    <header className="event-detail-header">
      <div className="event-detail-header__top">
        <div>
          <p className="page-kicker">Event detail</p>
          <h1>{normalized.name}</h1>
          <p>{normalized.description || "Event information is being finalized."}</p>
        </div>
        <StatusBadge status={normalized.status} />
      </div>
      <div className="event-meta">
        <span>{formatDateRange(normalized.startTime, normalized.endTime)}</span>
        <span>{normalized.location}</span>
      </div>
      {isSelling ? (
        <Link className="btn btn--primary btn--lg" to={`/events/${normalized.id}/seats`}>
          Select seats
        </Link>
      ) : (
        <Button size="lg" variant="outline" disabled>
          Seat selection opens when selling starts
        </Button>
      )}
    </header>
  );
}
