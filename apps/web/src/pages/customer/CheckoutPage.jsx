import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
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
import SeatLockTimer from "../../components/seat/SeatLockTimer";
import { checkoutFailure, checkoutSuccess, eventDetail, eventSeats } from "../../constants/routes";
import { formatDateRange } from "../../utils/formatDate";
import { normalizeEvent } from "../../utils/eventMappers";
import { mapApiError } from "../../utils/mapApiError";
import { normalizeOrder } from "../../utils/orderMappers";

const RESERVATION_EXPIRED_MESSAGE = "Your seat reservation has expired. Please select seats again.";

export default function CheckoutPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialOrder = location.state?.order ? normalizeOrder(location.state.order) : null;
  const [order, setOrder] = useState(initialOrder);
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(!initialOrder);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [reservationExpired, setReservationExpired] = useState(false);

  const loadOrder = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
      setActionError(null);
    }
    setError(null);

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
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder({ silent: Boolean(initialOrder) });
  }, [loadOrder]);

  const lockExpiresAt = order?.lockExpiresAt || order?.expiresAt || null;
  const reservationElapsed = useMemo(() => isReservationElapsed(order), [order]);

  useEffect(() => {
    setReservationExpired(order?.status === "Expired" || reservationElapsed);
  }, [order?.status, reservationElapsed]);

  const handleReservationExpired = useCallback(() => {
    setReservationExpired(true);
    setActionError(RESERVATION_EXPIRED_MESSAGE);
    loadOrder({ silent: true });
  }, [loadOrder]);

  async function handleCheckout() {
    if (reservationExpired || isReservationElapsed(order)) {
      setReservationExpired(true);
      setActionError(RESERVATION_EXPIRED_MESSAGE);
      await loadOrder({ silent: true });
      return;
    }

    setIsCheckingOut(true);
    setActionError(null);

    try {
      const paidOrder = normalizeOrder(await checkoutOrder(orderId, { confirm: true }));
      navigate(checkoutSuccess(paidOrder.id || orderId), { state: { orderId: paidOrder.id || orderId } });
    } catch (apiError) {
      const mappedError = mapApiError(apiError);
      if (isReservationExpiredError(mappedError)) {
        setReservationExpired(true);
        setActionError(RESERVATION_EXPIRED_MESSAGE);
        await loadOrder({ silent: true });
      } else {
        navigate(checkoutFailure(orderId), { state: { orderId, message: mappedError.message } });
      }
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
  const isPayable = order.status === "Pending" && !reservationExpired && !reservationElapsed;

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
        {!actionError && reservationExpired ? (
          <div className="seat-alert seat-alert--error">{RESERVATION_EXPIRED_MESSAGE}</div>
        ) : null}

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
            <ReservationTimerPanel
              order={order}
              expiresAt={lockExpiresAt}
              expired={reservationExpired || reservationElapsed}
              onExpired={handleReservationExpired}
            />
            <CheckoutSummary order={order} event={event} />
            <OrderStatusPanel order={order} canceling={isCanceling} onCancel={handleCancel} />
            {isPaid ? (
              <Link to="/my-tickets">
                <Button>View my tickets</Button>
              </Link>
            ) : null}
            {reservationExpired && event?.id ? (
              <Link to={eventSeats(event.id)}>
                <Button variant="outline">Select seats again</Button>
              </Link>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}

function ReservationTimerPanel({ order, expiresAt, expired, onExpired }) {
  if (order.status !== "Pending" || !expiresAt) {
    return null;
  }

  return (
    <Card className="checkout-panel">
      <div className="reservation-timer-panel">
        <div>
          <p className="page-kicker">Seat reservation</p>
          <h3>{expired ? "Expired" : "Locked for checkout"}</h3>
          <p>{expired ? RESERVATION_EXPIRED_MESSAGE : "Your selected seats remain locked while this countdown is active."}</p>
        </div>
        <SeatLockTimer
          expiresAt={expiresAt}
          serverNow={order.serverNow}
          serverNowReceivedAt={order.serverNowReceivedAt}
          onExpired={onExpired}
        />
      </div>
    </Card>
  );
}

function isReservationElapsed(order) {
  const expiresAt = order?.lockExpiresAt || order?.expiresAt;
  const expiresAtTime = expiresAt ? new Date(expiresAt).getTime() : null;

  if (!Number.isFinite(expiresAtTime)) {
    return false;
  }

  const serverNowTime = order?.serverNow ? new Date(order.serverNow).getTime() : null;
  const receivedAtTime = Number(order?.serverNowReceivedAt);

  if (Number.isFinite(serverNowTime) && Number.isFinite(receivedAtTime)) {
    return expiresAtTime <= serverNowTime + Date.now() - receivedAtTime;
  }

  return expiresAtTime <= Date.now();
}

function isReservationExpiredError(error) {
  return String(error?.message || "").toLowerCase().includes("seat reservation has expired");
}
