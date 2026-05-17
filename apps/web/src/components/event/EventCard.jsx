import { Link } from "react-router-dom";
import Card from "../common/Card";
import StatusBadge from "../common/StatusBadge";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateRange } from "../../utils/formatDate";
import { getImageUrl, getMinimumEventPrice, normalizeEvent } from "../../utils/eventMappers";
import "./event.css";

export default function EventCard({ event, sections = [] }) {
  const normalized = normalizeEvent(event);
  const imageUrl = getImageUrl(normalized.images?.[0]);
  const minimumPrice = getMinimumEventPrice(normalized, sections);

  return (
    <Card className="event-card">
      <div className="event-card__media">
        {imageUrl ? <img src={imageUrl} alt={normalized.name} /> : <div className="event-image-placeholder">TR</div>}
        <div className="event-card__status">
          <StatusBadge status={normalized.status} />
        </div>
      </div>
      <div className="event-card__body">
        <div>
          <h3 className="event-card__title">{normalized.name}</h3>
          <div className="event-meta">
            <span>{formatDateRange(normalized.startTime, normalized.endTime)}</span>
            <span>{normalized.location}</span>
          </div>
        </div>
        <div className="event-card__footer">
          <span className="event-price">{minimumPrice !== null ? `From ${formatCurrency(minimumPrice)}` : "Pricing soon"}</span>
          <Link className="btn btn--primary btn--sm" to={`/events/${normalized.id}`}>
            View
          </Link>
        </div>
      </div>
    </Card>
  );
}
