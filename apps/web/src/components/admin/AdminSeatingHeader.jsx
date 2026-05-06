import { Link } from "react-router-dom";
import { adminEventDetail, adminEvents } from "../../constants/routes";
import { formatDateRange } from "../../utils/formatDate";
import Button from "../common/Button";
import StatusBadge from "../common/StatusBadge";
import "./admin-seating.css";

export default function AdminSeatingHeader({ event }) {
  return (
    <section className="admin-seating-header">
      <div className="admin-seating-header__main">
        <p className="admin-page-header__kicker">Seating configuration</p>
        <h1>{event?.name || "Event seating"}</h1>
        <div className="admin-seating-header__meta">
          <StatusBadge status={event?.status || "Draft"} />
          <span>{event?.location || "Location to be announced"}</span>
          <span>{formatDateRange(event?.startTime, event?.endTime)}</span>
        </div>
      </div>
      <div className="admin-row-actions">
        <Link className="btn btn--outline" to={adminEvents()}>
          Back to events
        </Link>
        {event?.id ? (
          <Link className="btn btn--primary" to={adminEventDetail(event.id)}>
            Event detail
          </Link>
        ) : (
          <Button disabled>Event detail</Button>
        )}
      </div>
    </section>
  );
}
