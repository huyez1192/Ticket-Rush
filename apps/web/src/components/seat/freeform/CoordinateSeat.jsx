import { formatCurrency } from "../../../utils/formatCurrency";
import { getSeatShapeClassName } from "../../../constants/seatShapes";
import { getSeatDisplayName } from "../../../utils/seatMappers";
import { getSeatStatusMeta, isSeatSelectable } from "../../../utils/seatStatus";
import { getCoordinateSeatLayout } from "../../../utils/customerSeatLayout";
import "../seat-shapes.css";
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
  const isLockedByMe = lockedByMe && seat.status === "Locked";
  const canSelect = !disabled && !isLockedByMe && isSeatSelectable(seat.status);
  const visualState = selected ? "selected" : isLockedByMe ? "mine" : String(seat.status || "Released").toLowerCase();
  const statusLabel = selected ? "Selected" : isLockedByMe ? "Locked by you" : statusMeta.label;
  const displayLabel = getDisplayLabel(seat, layout);
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
        "seat-shape-shell",
        `customer-coordinate-seat--${visualState}`,
        getSeatShapeClassName(seat.seatShape),
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: `${layout.x}px`,
        top: `${layout.y}px`,
        width: `${layout.width}px`,
        height: `${layout.height}px`,
        "--seat-visual-size": `${Math.min(Number(layout.width || 32), Number(layout.height || 32))}px`,
        transform: `rotate(${layout.rotation || 0}deg)`,
      }}
      aria-label={ariaLabel}
      aria-pressed={selected}
      disabled={!canSelect}
      title={ariaLabel}
      onClick={() => onToggleSeat?.(seat)}
    >
      <span className="seat-shape-visual">
        <span className="seat-shape-label">{displayLabel}</span>
      </span>
    </button>
  );
}

function getDisplayLabel(seat, layout) {
  const rowLabel = String(layout.rowLabel || seat.rowLabel || "").trim();
  const seatNumber = seat.seatNumber ? String(seat.seatNumber) : "";
  const rowNumber = seat.rowNumber ? String(seat.rowNumber) : "";

  if (rowLabel && rowLabel !== "-" && seatNumber) {
    return `${rowLabel}${seatNumber}`;
  }

  if (rowNumber && seatNumber) {
    return `R${rowNumber}-${seatNumber}`;
  }

  const value = String(layout.label || seat.label || seat.code || seat.id || "");

  if (["Diamond", "Hexagon", "Circle"].includes(seat.seatShape) && value.length > 3) {
    return String(seat.seatNumber || value.slice(-3));
  }

  return value;
}
