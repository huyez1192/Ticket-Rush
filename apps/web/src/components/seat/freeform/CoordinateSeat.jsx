import { formatCurrency } from "../../../utils/formatCurrency";
import { getSeatDisplayName } from "../../../utils/seatMappers";
import { getSeatStatusMeta, isSeatSelectable } from "../../../utils/seatStatus";
import { getCoordinateSeatLayout } from "../../../utils/customerSeatLayout";
import "./customer-freeform-seat-map.css";

export default function CoordinateSeat({
  seat,
  selected = false,
  lockedByMe = false,
  disabled = false,
  onToggleSeat,
}) {
  const layout = getCoordinateSeatLayout(seat);
  const statusMeta = getSeatStatusMeta(seat.status);
  const canSelect = !disabled && !lockedByMe && isSeatSelectable(seat.status);
  const visualState = selected ? "selected" : lockedByMe ? "mine" : String(seat.status || "Released").toLowerCase();
  const statusLabel = selected ? "Selected" : lockedByMe ? "Locked by you" : statusMeta.label;
  const displayLabel = layout.label || seat.code || seat.seatNumber;
  const ariaLabel = [
    seat.sectionName || "Section",
    getSeatDisplayName(seat),
    statusLabel,
    seat.price ? formatCurrency(seat.price) : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <button
      type="button"
      className={[
        "customer-coordinate-seat",
        `customer-coordinate-seat--${visualState}`,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: `${layout.x}px`,
        top: `${layout.y}px`,
        width: `${layout.width}px`,
        height: `${layout.height}px`,
        transform: `rotate(${layout.rotation || 0}deg)`,
      }}
      aria-label={ariaLabel}
      aria-pressed={selected}
      disabled={!canSelect}
      title={ariaLabel}
      onClick={() => onToggleSeat?.(seat)}
    >
      <span>{displayLabel}</span>
    </button>
  );
}
