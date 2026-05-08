import CoordinateSeat from "./CoordinateSeat";
import CustomerSeatMapViewport from "./CustomerSeatMapViewport";
import CustomerStageBlock from "./CustomerStageBlock";
import "./customer-freeform-seat-map.css";

export default function CustomerSeatMapCanvas({
  layout,
  seats = [],
  selectedSeatIds,
  lockedSeatIds,
  disabled = false,
  onToggleSeat,
}) {
  return (
    <CustomerSeatMapViewport layout={layout}>
      <CustomerStageBlock stage={layout.stage} />
      {seats.map((seat) => (
        <CoordinateSeat
          key={seat.id}
          seat={seat}
          selected={selectedSeatIds.has(seat.id)}
          lockedByMe={lockedSeatIds.has(seat.id)}
          disabled={disabled}
          onToggleSeat={onToggleSeat}
        />
      ))}
    </CustomerSeatMapViewport>
  );
}
