import { SEAT_STATUSES } from "../../constants/statuses";
import "./admin-seating.css";

export default function AdminSeatLegend() {
  return (
    <section className="admin-seat-legend" aria-label="Seat status legend">
      {SEAT_STATUSES.map((status) => (
        <span key={status} className="admin-seat-legend__item">
          <span className={`admin-seat-legend__swatch admin-seat admin-seat--${status.toLowerCase()}`} />
          {status}
        </span>
      ))}
    </section>
  );
}
