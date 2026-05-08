import "./customer-freeform-seat-map.css";

const legendItems = [
  { label: "Available", className: "customer-freeform-legend__swatch--available" },
  { label: "Selected", className: "customer-freeform-legend__swatch--selected" },
  { label: "Locked", className: "customer-freeform-legend__swatch--locked" },
  { label: "Locked by you", className: "customer-freeform-legend__swatch--mine" },
  { label: "Sold", className: "customer-freeform-legend__swatch--sold" },
  { label: "Released", className: "customer-freeform-legend__swatch--released" },
];

export default function CustomerSeatMapLegend() {
  return (
    <div className="customer-freeform-legend" aria-label="Seat status meanings">
      {legendItems.map((item) => (
        <span className="customer-freeform-legend__item" key={item.label}>
          <span className={`customer-freeform-legend__swatch ${item.className}`} aria-hidden="true" />
          {item.label}
        </span>
      ))}
    </div>
  );
}
