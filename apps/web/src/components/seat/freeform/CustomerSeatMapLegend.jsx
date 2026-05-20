import { getSeatShapeClassName } from "../../../constants/seatShapes";
import "../seat-shapes.css";
import "./customer-freeform-seat-map.css";

const legendItems = [
  { label: "Available", className: "customer-freeform-legend__swatch--available" },
  { label: "Selected", className: "customer-freeform-legend__swatch--selected" },
  { label: "Locked", className: "customer-freeform-legend__swatch--locked" },
  { label: "Locked by you", className: "customer-freeform-legend__swatch--mine" },
  { label: "Sold", className: "customer-freeform-legend__swatch--sold" },
];

export default function CustomerSeatMapLegend({ sections = [] }) {
  const shapeItems = getShapeLegendItems(sections);

  return (
    <div className="customer-freeform-legend-stack">
      <div className="customer-freeform-legend" aria-label="Seat status meanings">
        {legendItems.map((item) => (
          <span className="customer-freeform-legend__item" key={item.label}>
            <span className={`customer-freeform-legend__swatch ${item.className}`} aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </div>
      {shapeItems.length ? (
        <div className="customer-freeform-shape-legend" aria-label="Section shape meanings">
          {shapeItems.map((section) => (
            <span className="customer-freeform-legend__item" key={section.id || section.name}>
              <span className={`seat-shape-icon ${getSeatShapeClassName(section.seatShape)}`} aria-hidden="true">
                <span>{section.name?.slice(0, 2) || "S"}</span>
              </span>
              {section.name}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getShapeLegendItems(sections) {
  const seen = new Set();
  return sections.filter((entry) => {
    const section = entry.section || entry;
    const key = section.id || section.name;
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }).map((entry) => entry.section || entry);
}
