import EmptyState from "../common/EmptyState";
import Seat from "./Seat";
import { groupSeatsByRow } from "../../utils/seatMappers";
import "./seat.css";

export default function SeatMap({
  section,
  seats = [],
  selectedSeatIds,
  lockedSeatIds,
  disabled = false,
  onToggleSeat,
}) {
  const rows = groupSeatsByRow(seats);
  const maxColumns = rows.reduce((max, row) => Math.max(max, row.seats.length), 0);

  if (!section) {
    return <EmptyState title="No section selected" message="Choose a section to view its seats." />;
  }

  if (!seats.length) {
    return <EmptyState title="No seats generated" message="This section does not have seats available yet." />;
  }

  return (
    <section className="seat-map-panel" aria-label={`${section.name} seat map`}>
      <header className="seat-map-panel__header">
        <div>
          <p className="page-kicker">Seat matrix</p>
          <h2>{section.name}</h2>
        </div>
      </header>
      <div className="seat-stage" aria-hidden="true">
        Stage
      </div>
      <div className="seat-map-scroll">
        <div className="seat-map" style={{ "--seat-columns": maxColumns }}>
          {rows.map((row) => (
            <div className="seat-row" key={row.rowNumber}>
              <span className="seat-row__label">R{row.rowNumber}</span>
              <div className="seat-row__grid" style={{ "--seat-columns": maxColumns }}>
                {row.seats.map((seat) => (
                  <Seat
                    key={seat.id}
                    seat={seat}
                    selected={selectedSeatIds.has(seat.id)}
                    lockedByMe={lockedSeatIds.has(seat.id)}
                    disabled={disabled}
                    onToggle={onToggleSeat}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
