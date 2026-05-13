import EmptyState from "../../common/EmptyState";
import { buildCustomerCoordinateSeatMap } from "../../../utils/customerSeatLayout";
import CustomerSeatMapCanvas from "./CustomerSeatMapCanvas";
import CustomerSeatMapLegend from "./CustomerSeatMapLegend";
import "./customer-freeform-seat-map.css";

export default function CustomerFreeformSeatMap({
  layout,
  sections = [],
  selectedSeatIds = new Set(),
  lockedByMeSeatIds = new Set(),
  disabled = false,
  onToggleSeat,
}) {
  const { layout: layoutConfig, seats } = buildCustomerCoordinateSeatMap(layout, sections);

  if (!seats.length) {
    return <EmptyState title="No seat map yet" message="Seat sections and generated seats are not available for this event." />;
  }

  return (
    <section className="customer-freeform-map" aria-label="Interactive coordinate seat map">
      <header className="customer-freeform-map__header">
        <div>
          <p className="page-kicker">Seat map</p>
          <h2>Choose your seats</h2>
          <p>All sections are visible together. Seat colors show availability and your selections.</p>
        </div>
        <CustomerSeatMapLegend sections={sections.map((entry) => entry.section || entry)} />
      </header>
      <CustomerSeatMapCanvas
        layout={layoutConfig}
        seats={seats}
        selectedSeatIds={selectedSeatIds}
        lockedByMeSeatIds={lockedByMeSeatIds}
        disabled={disabled}
        onToggleSeat={onToggleSeat}
      />
    </section>
  );
}
