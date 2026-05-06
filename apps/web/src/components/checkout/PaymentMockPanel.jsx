import Button from "../common/Button";
import Card from "../common/Card";
import "./checkout.css";

export default function PaymentMockPanel({ disabled = false, loading = false, onConfirm }) {
  return (
    <Card className="checkout-panel" title="Payment method">
      <div className="payment-method payment-method--active">
        <span aria-hidden="true">CARD</span>
        <div>
          <strong>Mock card confirmation</strong>
          <p>No real payment gateway is connected. Confirming calls the Ticket Rush checkout API.</p>
        </div>
      </div>
      <div className="checkout-actions">
        <Button type="button" size="lg" loading={loading} disabled={disabled || loading} onClick={onConfirm}>
          Confirm checkout
        </Button>
      </div>
    </Card>
  );
}
