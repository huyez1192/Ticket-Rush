import { getSeatDisplayLabel } from "../../utils/seatDisplayLabels";
import { getSeatStatusMeta } from "../../utils/seatStatus";
import "./admin-seating.css";

export default function AdminSeatCell({ seat, selected, onSelect }) {
  const statusMeta = getSeatStatusMeta(seat.status);
  const displayLabel = getSeatDisplayLabel(seat);
  const label = `${seat.sectionName}, ${displayLabel}, ${statusMeta.label}`;

  return (
    <button
      type="button"
      className={`admin-seat admin-seat--${seat.status.toLowerCase()} ${selected ? "admin-seat--selected" : ""}`.trim()}
      title={label}
      aria-label={label}
      aria-pressed={selected}
      onClick={() => onSelect?.(seat)}
    >
      {displayLabel}
    </button>
  );
}
