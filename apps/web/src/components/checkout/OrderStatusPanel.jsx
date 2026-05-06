import Button from "../common/Button";
import Card from "../common/Card";
import StatusBadge from "../common/StatusBadge";
import "./checkout.css";

export default function OrderStatusPanel({ order, canceling = false, onCancel }) {
  const canCancel = order.status === "Pending";

  return (
    <Card className="checkout-panel">
      <div className="order-status-panel">
        <div>
          <p className="page-kicker">Order state</p>
          <h3>{order.status}</h3>
          <p>{getStatusMessage(order.status)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      {canCancel ? (
        <div className="checkout-actions">
          <Button type="button" variant="outline" loading={canceling} disabled={canceling} onClick={onCancel}>
            Cancel pending order
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

function getStatusMessage(status) {
  if (status === "Paid") {
    return "Checkout is complete. Tickets are available in My Tickets.";
  }

  if (status === "Cancelled") {
    return "This order was cancelled and cannot be checked out.";
  }

  if (status === "Expired") {
    return "This order expired before checkout could complete.";
  }

  return "Confirm mock payment before the seat locks expire.";
}
