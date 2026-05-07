import "./freeform-seating.css";

const ITEMS = [
  ["Available", "available"],
  ["Locked", "locked"],
  ["Sold", "sold"],
  ["Released", "released"],
  ["Selected", "selected"],
];

export default function FreeformSeatLegend() {
  return (
    <div className="freeform-seat-legend" aria-label="Seat status legend">
      {ITEMS.map(([label, status]) => (
        <span className="freeform-seat-legend__item" key={status}>
          <span className={`freeform-seat-legend__swatch freeform-seat-legend__swatch--${status}`} aria-hidden="true" />
          {label}
        </span>
      ))}
    </div>
  );
}
