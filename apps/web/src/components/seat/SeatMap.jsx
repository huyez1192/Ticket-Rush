import EmptyState from "../common/EmptyState";
import Seat from "./Seat";
import { groupSeatsByRow } from "../../utils/seatMappers";
import "./seat.css";

export default function SeatMap({
  sections = null,
  section,
  seats = [],
  selectedSeatIds = new Set(),
  lockedByMeSeatIds = new Set(),
  disabled = false,
  onToggleSeat,
}) {
  const sectionEntries = Array.isArray(sections) && sections.length
    ? sections
    : section
      ? [{ section, seats }]
      : [];
  const totalSeats = sectionEntries.reduce((sum, entry) => sum + (entry.seats || []).length, 0);

  if (!sectionEntries.length) {
    return <EmptyState title="No seat sections" message="Seat sections are not available for this event." />;
  }

  if (!totalSeats) {
    return <EmptyState title="No seats generated" message="This event does not have seats available yet." />;
  }

  return (
    <section className="seat-map-panel" aria-label="Seat matrix fallback">
      <header className="seat-map-panel__header">
        <div>
          <p className="page-kicker">Seat matrix</p>
          <h2>Choose your seats</h2>
          <p>All generated sections are listed below.</p>
        </div>
      </header>
      <div className="seat-stage" aria-hidden="true">
        Stage
      </div>
      <div className="seat-map-scroll">
        <div className="seat-map-sections">
          {sectionEntries.map((entry) => (
            <SeatMatrixSection
              key={entry.section?.id || entry.section?.name}
              section={entry.section}
              seats={entry.seats || []}
              selectedSeatIds={selectedSeatIds}
              lockedByMeSeatIds={lockedByMeSeatIds}
              disabled={disabled}
              onToggleSeat={onToggleSeat}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SeatMatrixSection({
  section,
  seats = [],
  selectedSeatIds = new Set(),
  lockedByMeSeatIds = new Set(),
  disabled = false,
  onToggleSeat,
}) {
  const rows = groupSeatsByRow(seats);
  const maxColumns = rows.reduce((max, row) => Math.max(max, row.seats.length), 0);

  if (!section) {
    return null;
  }

  if (!seats.length) {
    return null;
  }

  return (
    <section className="seat-map-section" aria-label={`${section.name} seats`}>
      <header className="seat-map-section__header">
        <h3>{section.name}</h3>
        <span>{seats.length} seats</span>
      </header>
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
                  lockedByMe={lockedByMeSeatIds.has(seat.id)}
                  disabled={disabled}
                  onToggle={onToggleSeat}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
