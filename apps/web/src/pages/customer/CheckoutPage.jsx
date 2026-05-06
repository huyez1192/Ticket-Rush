import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getEventById } from "../../api/eventApi";
import { cancelOrder, checkoutOrder, getOrderById } from "../../api/orderApi";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import CheckoutSummary from "../../components/checkout/CheckoutSummary";
import OrderStatusPanel from "../../components/checkout/OrderStatusPanel";
import PaymentMockPanel from "../../components/checkout/PaymentMockPanel";
import SelectedSeatsList from "../../components/checkout/SelectedSeatsList";
import { checkoutFailure, checkoutSuccess, eventDetail } from "../../constants/routes";
import { formatDateRange } from "../../utils/formatDate";
import { normalizeEvent } from "../../utils/eventMappers";
import { mapApiError } from "../../utils/mapApiError";
import { normalizeOrder } from "../../utils/orderMappers";

export default function CheckoutPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const loadOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setActionError(null);

    try {
      const orderPayload = await getOrderById(orderId);
      const normalizedOrder = normalizeOrder(orderPayload);
      setOrder(normalizedOrder);

      if (normalizedOrder.eventId) {
        try {
          const eventPayload = await getEventById(normalizedOrder.eventId);
          setEvent(normalizeEvent(eventPayload));
        } catch {
          setEvent(null);
        }
      }
    } catch (apiError) {
      setError(mapApiError(apiError));
      setOrder(null);
      setEvent(null);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  async function handleCheckout() {
    setIsCheckingOut(true);
    setActionError(null);

    try {
      const paidOrder = normalizeOrder(await checkoutOrder(orderId, { confirm: true }));
      navigate(checkoutSuccess(paidOrder.id || orderId), { state: { orderId: paidOrder.id || orderId } });
    } catch (apiError) {
      const mappedError = mapApiError(apiError);
      navigate(checkoutFailure(orderId), { state: { orderId, message: mappedError.message } });
    } finally {
      setIsCheckingOut(false);
    }
  }

  async function handleCancel() {
    setIsCanceling(true);
    setActionError(null);

    try {
      await cancelOrder(orderId);
      await loadOrder();
      setActionError("Order cancelled. Locked seats were released by the backend.");
    } catch (apiError) {
      setActionError(mapApiError(apiError).message);
    } finally {
      setIsCanceling(false);
    }
  }

  if (isLoading) {
    return (
      <main className="page-shell">
        <LoadingState title="Loading checkout" message="Fetching your order and ticket seats." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-shell">
        <ErrorState
          title="Could not load checkout"
          message={error.message}
          action={
            <div className="auth-state-actions">
              <Button onClick={loadOrder}>Retry</Button>
              <Link to="/events">
                <Button variant="outline">Back to events</Button>
              </Link>
            </div>
          }
        />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="page-shell">
        <ErrorState title="Order not found" message="This order could not be loaded." />
      </main>
    );
  }

  const isPaid = order.status === "Paid";
  const isPayable = order.status === "Pending";

  return (
    <main className="checkout-page">
      <div className="page-stack">
        <header className="checkout-header">
          <div>
            <p className="page-kicker">Ticket Rush checkout</p>
            <h1>Review and confirm</h1>
            <p>{event ? formatDateRange(event.startTime, event.endTime) : "Confirm the order before the locks expire."}</p>
          </div>
          <Link to={event?.id ? eventDetail(event.id) : "/events"} className="auth-link">
            Back to event
          </Link>
        </header>

        {actionError ? <div className="seat-alert seat-alert--error">{actionError}</div> : null}

        <div className="checkout-layout">
          <div className="checkout-layout__main">
            <Card className="checkout-event-panel" title="Event details">
              <h2>{event?.name || "Event details unavailable"}</h2>
              <p>{event?.location || "Location to be announced"}</p>
              <p>{event ? formatDateRange(event.startTime, event.endTime) : "Date to be announced"}</p>
            </Card>
            <SelectedSeatsList items={order.items} />
            <PaymentMockPanel disabled={!isPayable} loading={isCheckingOut} onConfirm={handleCheckout} />
          </div>

          <aside className="checkout-layout__side">
            <CheckoutSummary order={order} event={event} />
            <OrderStatusPanel order={order} canceling={isCanceling} onCancel={handleCancel} />
            {isPaid ? (
              <Link to="/my-tickets">
                <Button>View my tickets</Button>
              </Link>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
