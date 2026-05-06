import Card from "../common/Card";
import EmptyState from "../common/EmptyState";
import { formatCurrency } from "../../utils/formatCurrency";
import "./event.css";

export default function EventSectionSummary({ sections = [] }) {
  return (
    <Card title="Seat sections">
      {sections.length ? (
        <div className="event-section-list">
          {sections.map((section) => (
            <div className="event-section-row" key={section.id || section._id || section.name}>
              <div>
                <strong>{section.name || "Section"}</strong>
                {section.description ? <p className="phase-note">{section.description}</p> : null}
              </div>
              <span className="event-price">{formatCurrency(section.price)}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No sections yet" message="Seat sections and prices are not available for this event." />
      )}
    </Card>
  );
}
