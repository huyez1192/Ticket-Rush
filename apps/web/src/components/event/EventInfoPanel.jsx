import Card from "../common/Card";
import { formatDateRange } from "../../utils/formatDate";
import { normalizeEvent } from "../../utils/eventMappers";
import EventMetaItem from "./EventMetaItem";
import "./event.css";

export default function EventInfoPanel({ event }) {
  const normalized = normalizeEvent(event);

  return (
    <Card title="Event information">
      <div className="event-info-list">
        <EventMetaItem label="Date and time" value={formatDateRange(normalized.startTime, normalized.endTime)} />
        <EventMetaItem label="Location" value={normalized.location} />
        <EventMetaItem label="Status" value={normalized.status} />
      </div>
    </Card>
  );
}
