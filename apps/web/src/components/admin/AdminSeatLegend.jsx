import { SEAT_STATUSES } from "../../constants/statuses";
import "./admin-seating.css";

const LEGEND_STATUSES = SEAT_STATUSES.filter((status) => status !== "Released");

export default function AdminSeatLegend() {
  return (
    <section className="admin-seat-legend" aria-label="Seat status legend">
      {LEGEND_STATUSES.map((status) => (
        <span key={status} className="admin-seat-legend__item">
          <span className={`admin-seat-legend__swatch admin-seat admin-seat--${status.toLowerCase()}`} />
          {status}
        </span>
      ))}
      <span className="admin-seat-legend__item">
        <span className="admin-seat-legend__edit-swatch" aria-hidden="true" />
        Selected for edit
      </span>
    </section>
  );
}
