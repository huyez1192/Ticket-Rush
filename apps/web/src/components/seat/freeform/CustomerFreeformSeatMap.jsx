import EmptyState from "../../common/EmptyState";
import {
  flattenCustomerSeatMap,
  getCustomerLayoutConfig,
  getPlacedCustomerSeats,
} from "../../../utils/customerSeatLayout";
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
  const allSeats = flattenCustomerSeatMap(sections);
  const placedSeats = getPlacedCustomerSeats(allSeats);
  const layoutConfig = getCustomerLayoutConfig(layout, placedSeats);

  if (!layoutConfig || !placedSeats.length) {
    return <EmptyState title="No coordinate seat map" message="This event does not have a saved coordinate layout yet." />;
  }

  return (
    <section className="customer-freeform-map" aria-label="Interactive coordinate seat map">
      <header className="customer-freeform-map__header">
        <div>
          <p className="page-kicker">Seat map</p>
          <h2>Choose your seats</h2>
          <p>All placed sections are visible together. Seat colors show availability and your selections.</p>
        </div>
        <CustomerSeatMapLegend />
      </header>
      <CustomerSeatMapCanvas
        layout={layoutConfig}
        seats={placedSeats}
        selectedSeatIds={selectedSeatIds}
        lockedByMeSeatIds={lockedByMeSeatIds}
        disabled={disabled}
        onToggleSeat={onToggleSeat}
      />
    </section>
  );
}
