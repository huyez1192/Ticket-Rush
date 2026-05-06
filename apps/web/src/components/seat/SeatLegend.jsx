import "./seat.css";

const items = [
  { label: "Available", className: "seat-legend__swatch--available" },
  { label: "Selected", className: "seat-legend__swatch--selected" },
  { label: "Locked by you", className: "seat-legend__swatch--mine" },
  { label: "Locked", className: "seat-legend__swatch--locked" },
  { label: "Sold", className: "seat-legend__swatch--sold" },
  { label: "Released", className: "seat-legend__swatch--released" },
];

export default function SeatLegend() {
  return (
    <section className="seat-legend" aria-label="Seat status legend">
      <h3>Legend</h3>
      <ul>
        {items.map((item) => (
          <li key={item.label}>
            <span className={`seat-legend__swatch ${item.className}`} aria-hidden="true" />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
