import Button from "../../common/Button";
import EmptyState from "../../common/EmptyState";
import "./freeform-seating.css";

export default function UnplacedSeatsPanel({ seats = [], onAutoArrange }) {
  return (
    <section className="freeform-side-panel">
      <header className="freeform-side-panel__header">
        <div>
          <h3>Unplaced seats</h3>
          <p>{seats.length ? "Seats without saved coordinates." : "Every generated seat has coordinates."}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={onAutoArrange} disabled={!seats.length}>
          Auto arrange
        </Button>
      </header>

      {!seats.length ? (
        <EmptyState title="No unplaced seats" message="Coordinate layout is complete for this event." />
      ) : (
        <div className="freeform-unplaced-list">
          {seats.slice(0, 80).map((seat) => (
            <span key={seat.id} className="freeform-unplaced-chip">
              {seat.code || seat.label}
            </span>
          ))}
          {seats.length > 80 ? <span className="freeform-unplaced-chip">+{seats.length - 80} more</span> : null}
        </div>
      )}
    </section>
  );
}
