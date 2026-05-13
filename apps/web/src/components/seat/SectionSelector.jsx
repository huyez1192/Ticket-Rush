import { formatCurrency } from "../../utils/formatCurrency";
import "./seat.css";

export default function SectionSelector({ sections = [], seatCounts = {} }) {
  if (!sections.length) {
    return null;
  }

  return (
    <section className="section-selector" aria-label="Seat section pricing and availability">
      {sections.map((section) => {
        const counts = seatCounts[section.id] || {};

        return (
          <article
            key={section.id}
            className="section-option"
          >
            <span>{section.name}</span>
            <strong>{formatCurrency(section.price)}</strong>
            <small>
              {counts.available || 0} available / {counts.total || 0} total
            </small>
            {section.description ? <p>{section.description}</p> : null}
          </article>
        );
      })}
    </section>
  );
}
