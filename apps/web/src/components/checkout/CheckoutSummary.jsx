import Card from "../common/Card";
import StatusBadge from "../common/StatusBadge";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateRange } from "../../utils/formatDate";
import "./checkout.css";

export default function CheckoutSummary({ order, event }) {
  const ticketCount = order.items?.length || 0;

  return (
    <Card className="checkout-summary">
      <header className="checkout-summary__header">
        <div>
          <p className="page-kicker">Order summary</p>
          <h3>Order #{shortId(order.id)}</h3>
        </div>
        <StatusBadge status={order.status} />
      </header>
      <div className="checkout-summary__body">
        <div>
          <span>Event</span>
          <strong>{event?.name || "Event details unavailable"}</strong>
        </div>
        <div>
          <span>When</span>
          <strong>{event ? formatDateRange(event.startTime, event.endTime) : "Date to be announced"}</strong>
        </div>
        <div>
          <span>Tickets</span>
          <strong>{ticketCount}</strong>
        </div>
        <div>
          <span>Total</span>
          <strong className="checkout-summary__total">{formatCurrency(order.totalAmount)}</strong>
        </div>
      </div>
    </Card>
  );
}

function shortId(id) {
  return id ? String(id).slice(-8).toUpperCase() : "Pending";
}
