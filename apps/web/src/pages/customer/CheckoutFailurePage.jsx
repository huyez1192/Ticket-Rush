import { Link, useLocation, useSearchParams } from "react-router-dom";
import Button from "../../components/common/Button";
import { checkout } from "../../constants/routes";
import "../../components/checkout/checkout.css";

export default function CheckoutFailurePage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const orderId = location.state?.orderId || searchParams.get("orderId");
  const message = location.state?.message || "Checkout could not be completed. Your locks may have expired or seats may no longer be available.";

  return (
    <main className="checkout-result-page">
      <section className="checkout-result checkout-result--failure">
        <p className="page-kicker">Checkout failed</p>
        <h1>Could not confirm payment</h1>
        <p>{message}</p>
        <div className="auth-state-actions">
          {orderId ? (
            <Link to={checkout(orderId)}>
              <Button>Try again</Button>
            </Link>
          ) : null}
          <Link to="/events">
            <Button variant="outline">Back to events</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
