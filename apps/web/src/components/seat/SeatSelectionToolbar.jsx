import Button from "../common/Button";
import "./seat.css";

export default function SeatSelectionToolbar({
  selectedCount,
  lockedCount,
  canSelect = true,
  isLocking = false,
  onLockSelected,
  onClearSelected,
}) {
  return (
    <section className="seat-selection-toolbar" aria-label="Seat selection actions">
      <div>
        <strong>{selectedCount} selected</strong>
        <span>{lockedCount} locked by you</span>
      </div>
      <div className="auth-state-actions">
        <Button
          type="button"
          loading={isLocking}
          disabled={!canSelect || !selectedCount || isLocking}
          onClick={onLockSelected}
        >
          Lock selected seats
        </Button>
        <Button type="button" variant="outline" disabled={!selectedCount || isLocking} onClick={onClearSelected}>
          Clear selection
        </Button>
      </div>
    </section>
  );
}
