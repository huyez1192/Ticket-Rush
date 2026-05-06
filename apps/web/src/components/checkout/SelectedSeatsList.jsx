import Card from "../common/Card";
import EmptyState from "../common/EmptyState";
import { formatCurrency } from "../../utils/formatCurrency";
import { getSeatDisplayName } from "../../utils/seatMappers";
import "./checkout.css";

export default function SelectedSeatsList({ items = [] }) {
  return (
    <Card className="checkout-panel" title="Selected tickets">
      {items.length ? (
        <div className="checkout-seat-list">
          {items.map((item) => (
            <div className="checkout-seat-row" key={item.id || item.seatId}>
              <div>
                <strong>{item.seat?.sectionName || "Section"}</strong>
                <span>{item.seat ? getSeatDisplayName(item.seat) : `Seat ${item.seatId}`}</span>
              </div>
              <strong>{formatCurrency(item.priceSnapshot)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No seats in this order" message="This order does not contain any selected seats." />
      )}
    </Card>
  );
}
