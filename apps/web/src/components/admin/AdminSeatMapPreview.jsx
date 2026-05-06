import { groupSeatsByRow } from "../../utils/adminSeatMappers";
import EmptyState from "../common/EmptyState";
import AdminSeatCell from "./AdminSeatCell";
import AdminSeatLegend from "./AdminSeatLegend";
import "./admin-seating.css";

export default function AdminSeatMapPreview({
  sections = [],
  selectedSectionId,
  selectedSeatId,
  onSelectSeat,
}) {
  const hasSeats = sections.some((entry) => entry.seats.length);

  return (
    <section className="admin-seating-panel admin-seat-map-panel">
      <header className="admin-seating-panel__header">
        <div>
          <h2>Seat map preview</h2>
          <p>All sections are shown together. Click a seat to inspect and patch safe admin status values.</p>
        </div>
        <AdminSeatLegend />
      </header>

      <div className="admin-seat-stage" aria-hidden="true">
        Stage
      </div>

      {!hasSeats ? (
        <EmptyState title="No seats generated" message="Create a section and generate seats to preview the layout." />
      ) : (
        <div className="admin-seat-map-scroll">
          <div className="admin-seat-map">
            {sections.map((entry) => (
              <SeatMapSection
                key={entry.section.id}
                section={entry.section}
                seats={entry.seats}
                selectedSeatId={selectedSeatId}
                selectedSectionId={selectedSectionId}
                onSelectSeat={onSelectSeat}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SeatMapSection({ section, seats, selectedSeatId, selectedSectionId, onSelectSeat }) {
  const rows = groupSeatsByRow(seats);
  const maxColumns = rows.reduce((max, row) => Math.max(max, row.seats.length), 0);
  const isSelectedSection = selectedSectionId === section.id;

  if (!seats.length) {
    return null;
  }

  return (
    <article
      className={`admin-seat-map-section ${isSelectedSection ? "admin-seat-map-section--active" : ""}`.trim()}
    >
      <header>
        <h3>{section.name}</h3>
        <span>{seats.length} seats</span>
      </header>
      <div className="admin-seat-map-section__rows">
        {rows.map((row) => (
          <div className="admin-seat-row" key={`${section.id}:${row.rowNumber}`}>
            <span className="admin-seat-row__label">{row.rowLabel}</span>
            <div className="admin-seat-row__grid" style={{ "--seat-columns": maxColumns }}>
              {row.seats.map((seat) => (
                <AdminSeatCell
                  key={seat.id}
                  seat={seat}
                  selected={selectedSeatId === seat.id}
                  onSelect={onSelectSeat}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
