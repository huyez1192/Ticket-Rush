import { Link, useLocation, useSearchParams } from "react-router-dom";
import Button from "../../components/common/Button";
import "../../components/checkout/checkout.css";

export default function CheckoutSuccessPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const orderId = location.state?.orderId || searchParams.get("orderId");

  return (
    <main className="checkout-result-page">
      <section className="checkout-result checkout-result--success">
        <p className="page-kicker">Payment confirmed</p>
        <h1>Checkout complete</h1>
        <p>Your mock payment was confirmed and the backend issued tickets for the paid order.</p>
        {orderId ? <p className="phase-note">Order #{String(orderId).slice(-8).toUpperCase()}</p> : null}
        <div className="auth-state-actions">
          <Link to="/my-tickets">
            <Button>View my tickets</Button>
          </Link>
          <Link to="/events">
            <Button variant="outline">Back to events</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
