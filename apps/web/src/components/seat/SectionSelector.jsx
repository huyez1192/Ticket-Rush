import { formatCurrency } from "../../utils/formatCurrency";
import "./seat.css";

export default function SectionSelector({ sections = [], activeSectionId, seatCounts = {}, onChange }) {
  if (!sections.length) {
    return null;
  }

  return (
    <section className="section-selector" aria-label="Seat sections">
      {sections.map((section) => {
        const isActive = section.id === activeSectionId;
        const counts = seatCounts[section.id] || {};

        return (
          <button
            key={section.id}
            type="button"
            className={`section-option ${isActive ? "section-option--active" : ""}`.trim()}
            onClick={() => onChange(section.id)}
          >
            <span>{section.name}</span>
            <strong>{formatCurrency(section.price)}</strong>
            <small>
              {counts.available || 0} available / {counts.total || 0} total
            </small>
          </button>
        );
      })}
    </section>
  );
}
