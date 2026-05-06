import { getSeatDisplayName } from "../../utils/seatMappers";
import { getSeatStatusMeta, isSeatSelectable } from "../../utils/seatStatus";
import "./seat.css";

export default function Seat({ seat, selected = false, lockedByMe = false, disabled = false, onToggle }) {
  const statusMeta = getSeatStatusMeta(seat.status);
  const canSelect = !disabled && isSeatSelectable(seat.status);
  const stateClass = selected ? "seat--selected" : lockedByMe ? "seat--mine" : statusMeta.className;
  const label = `${seat.sectionName}, ${getSeatDisplayName(seat)}. ${
    selected ? "Selected" : lockedByMe ? "Locked by you" : statusMeta.label
  }`;

  return (
    <button
      type="button"
      className={`seat ${stateClass}`.trim()}
      aria-label={label}
      aria-pressed={selected}
      disabled={!canSelect}
      title={label}
      onClick={() => onToggle?.(seat)}
    >
      <span>{seat.seatNumber}</span>
    </button>
  );
}
