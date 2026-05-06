import Button from "../common/Button";
import Card from "../common/Card";
import SeatLockTimer from "./SeatLockTimer";
import { formatCurrency } from "../../utils/formatCurrency";
import { getSeatDisplayName, sortSeats } from "../../utils/seatMappers";
import "./seat.css";

export default function SeatSummary({
  selectedSeats = [],
  lockedSeats = [],
  lockExpiresAt,
  onReleaseSeat,
  releasingSeatId,
  onTimerExpired,
}) {
  const selectedTotal = selectedSeats.reduce((sum, seat) => sum + Number(seat.price || 0), 0);
  const lockedTotal = lockedSeats.reduce((sum, seat) => sum + Number(seat.price || 0), 0);

  return (
    <Card className="seat-summary">
      <header className="seat-summary__header">
        <div>
          <p className="page-kicker">Your seats</p>
          <h3>Selection summary</h3>
        </div>
        {lockedSeats.length ? <SeatLockTimer expiresAt={lockExpiresAt} onExpired={onTimerExpired} /> : null}
      </header>

      <SeatList title="Selected seats" seats={selectedSeats} emptyMessage="Choose available seats from the map." />

      <section className="seat-summary__block">
        <h4>Locked seats</h4>
        {lockedSeats.length ? (
          <div className="seat-summary__list">
            {sortSeats(lockedSeats).map((seat) => (
              <div className="seat-summary__item" key={seat.id}>
                <div>
                  <span>{seat.sectionName}</span>
                  <strong>{getSeatDisplayName(seat)}</strong>
                </div>
                <div className="seat-summary__item-actions">
                  <span>{formatCurrency(seat.price)}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={releasingSeatId === seat.id}
                    disabled={Boolean(releasingSeatId)}
                    onClick={() => onReleaseSeat(seat.id)}
                  >
                    Release
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="phase-note">No seats are locked yet.</p>
        )}
      </section>

      <footer className="seat-summary__footer">
        <div>
          <span>Selected subtotal</span>
          <strong>{formatCurrency(selectedTotal)}</strong>
        </div>
        <div>
          <span>Locked subtotal</span>
          <strong>{formatCurrency(lockedTotal)}</strong>
        </div>
      </footer>
    </Card>
  );
}

function SeatList({ title, seats, emptyMessage }) {
  return (
    <section className="seat-summary__block">
      <h4>{title}</h4>
      {seats.length ? (
        <div className="seat-summary__list">
          {sortSeats(seats).map((seat) => (
            <div className="seat-summary__item" key={seat.id}>
              <div>
                <span>{seat.sectionName}</span>
                <strong>{getSeatDisplayName(seat)}</strong>
              </div>
              <span>{formatCurrency(seat.price)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="phase-note">{emptyMessage}</p>
      )}
    </section>
  );
}
