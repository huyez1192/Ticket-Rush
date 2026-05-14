import { getSeatShapeClassName, getSeatShapeMeta } from "../../../constants/seatShapes";
import "../../seat/seat-shapes.css";
import "./freeform-seating.css";

const ITEMS = [
  ["Available", "available"],
  ["Locked", "locked"],
  ["Sold", "sold"],
  ["Released", "released"],
  ["Selected for edit", "selected-edit"],
];

export default function FreeformSeatLegend({ sections = [] }) {
  const shapeItems = getShapeLegendItems(sections);

  return (
    <div className="freeform-legend-stack">
      <div className="freeform-seat-legend" aria-label="Seat status legend">
        {ITEMS.map(([label, status]) => (
          <span className="freeform-seat-legend__item" key={status}>
            <span className={`freeform-seat-legend__swatch freeform-seat-legend__swatch--${status}`} aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>
      {shapeItems.length ? (
        <div className="freeform-shape-legend" aria-label="Section shape legend">
          {shapeItems.map((section) => (
            <span className="freeform-seat-legend__item" key={section.id || section.name}>
              <span className={`seat-shape-icon ${getSeatShapeClassName(section.seatShape)}`} aria-hidden="true">
                <span>{section.name?.slice(0, 2) || "S"}</span>
              </span>
              {section.name} ({getSeatShapeMeta(section.seatShape).label})
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getShapeLegendItems(sections) {
  const seen = new Set();
  return sections.filter((section) => {
    const key = section.id || section.name;
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
