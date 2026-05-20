import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getEventById } from "../../api/eventApi";
import { createOrder } from "../../api/orderApi";
import { getMyEventQueue } from "../../api/queueApi";
import { getEventSeatMap, getEventSeats, getEventSections } from "../../api/seatApi";
import { createSeatLocks, getMySeatLocks, releaseSeatLock } from "../../api/seatLockApi";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import StatusBadge from "../../components/common/StatusBadge";
import SeatLegend from "../../components/seat/SeatLegend";
import SeatSelectionToolbar from "../../components/seat/SeatSelectionToolbar";
import SeatSummary from "../../components/seat/SeatSummary";
import SectionSelector from "../../components/seat/SectionSelector";
import CustomerFreeformSeatMap from "../../components/seat/freeform/CustomerFreeformSeatMap";
import { checkout, eventWaitingRoom } from "../../constants/routes";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateRange } from "../../utils/formatDate";
import { getCollectionItems, normalizeEvent } from "../../utils/eventMappers";
import {
  getActiveLockItems,
  normalizeSeat,
  normalizeSeatLock,
  normalizeSeatMap,
  normalizeSection,
  sortSeats,
} from "../../utils/seatMappers";
import { mapApiError } from "../../utils/mapApiError";

const POLL_INTERVAL_MS = 12000;

export default function SeatSelectionPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [seatMapLayout, setSeatMapLayout] = useState(null);
  const [seatMapSections, setSeatMapSections] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [activeLocks, setActiveLocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [releasingSeatId, setReleasingSeatId] = useState("");
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState("");

  const sections = useMemo(() => seatMapSections.map((entry) => entry.section), [seatMapSections]);
  const allSeats = useMemo(() => seatMapSections.flatMap((entry) => entry.seats), [seatMapSections]);
  const allSeatsById = useMemo(() => new Map(allSeats.map((seat) => [seat.id, seat])), [allSeats]);
  const selectedSeatSet = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds]);
  const lockedByMeSeatSet = useMemo(
    () => new Set(activeLocks.map((lock) => lock.seatId).filter(Boolean)),
    [activeLocks],
  );
  const selectedSeats = useMemo(
    () => sortSeats(selectedSeatIds.map((seatId) => allSeatsById.get(seatId)).filter(Boolean)),
    [allSeatsById, selectedSeatIds],
  );
  const lockedSeats = useMemo(
    () =>
      sortSeats(
        activeLocks
          .map((lock) => allSeatsById.get(lock.seatId) || lock.seat)
          .filter(Boolean)
          .map((seat) => ({ ...seat, status: "Locked" })),
      ),
    [activeLocks, allSeatsById],
  );
  const sectionSeatCounts = useMemo(() => buildSectionSeatCounts(seatMapSections), [seatMapSections]);
  const lockExpiresAt = useMemo(() => getEarliestExpiry(activeLocks), [activeLocks]);
  const isSelling = event?.status === "Selling";

  const refreshSeatData = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setIsPolling(true);
      }

      try {
        const [seatMapPayload, locksPayload] = await Promise.all([
          getSeatMapPayloadWithFallback(eventId, event, sections),
          getMySeatLocks(eventId),
        ]);
        const normalizedMap = normalizeSeatMap(
          seatMapPayload.__fallbackSeatList ? buildSeatMapFromSeatList(seatMapPayload, event, sections) : seatMapPayload,
          event,
          sections,
        );
        const locks = getActiveLockItems(locksPayload);

        setSeatMapLayout(normalizedMap.layout);
        setSeatMapSections(normalizedMap.sections);
        setActiveLocks(locks);
        if (seatMapPayload.__fallbackSeatList && !silent) {
          setActionError(`Saved seat-map layout could not be loaded. Showing generated seat map fallback. ${seatMapPayload.__seatMapError}`);
        } else if (!silent) {
          setActionError(null);
        }
        setSelectedSeatIds((current) =>
          current.filter((seatId) => {
            const seat = normalizedMap.sections.flatMap((entry) => entry.seats).find((item) => item.id === seatId);
            return seat?.status === "Available";
          }),
        );
      } catch (apiError) {
        if (!silent) {
          setActionError(mapApiError(apiError).message);
        }
      } finally {
        if (!silent) {
          setIsPolling(false);
        }
      }
    },
    [event, eventId, sections],
  );

  const loadSeatSelection = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setActionError(null);

    try {
      const eventPayload = await getEventById(eventId);
      const normalizedEvent = normalizeEvent(eventPayload);

      if (normalizedEvent.virtualQueueEnabled) {
        const access = getStoredQueueAccess(eventId);

        if (!access) {
          navigate(eventWaitingRoom(eventId), { replace: true });
          return;
        }

        try {
          const queuePayload = await getMyEventQueue(eventId);

          if (queuePayload?.accessGranted && queuePayload?.queueToken) {
            storeQueueAccess(eventId, queuePayload.queueToken, queuePayload.expiresAt);
          } else if (!queuePayload?.accessGranted) {
            clearStoredQueueAccess(eventId);
            navigate(eventWaitingRoom(eventId), { replace: true });
            return;
          }
        } catch {
          clearStoredQueueAccess(eventId);
          navigate(eventWaitingRoom(eventId), { replace: true });
          return;
        }
      }

      const [sectionsPayload, seatMapPayload, locksPayload] = await Promise.all([
        getEventSections(eventId),
        getSeatMapPayloadWithFallback(eventId, normalizedEvent),
        getMySeatLocks(eventId),
      ]);
      const sectionItems = getCollectionItems(sectionsPayload).map(normalizeSection);
      const normalizedMap = normalizeSeatMap(
        seatMapPayload.__fallbackSeatList ? buildSeatMapFromSeatList(seatMapPayload, normalizedEvent, sectionItems) : seatMapPayload,
        normalizedEvent,
        sectionItems,
      );

      setEvent(normalizedEvent);
      setSeatMapLayout(normalizedMap.layout);
      setSeatMapSections(normalizedMap.sections);
      setActiveLocks(getActiveLockItems(locksPayload));
      setSelectedSeatIds([]);
      if (seatMapPayload.__fallbackSeatList) {
        setActionError(`Saved seat-map layout could not be loaded. Showing generated seat map fallback. ${seatMapPayload.__seatMapError}`);
      }
    } catch (apiError) {
      setError(mapApiError(apiError));
      setEvent(null);
      setSeatMapLayout(null);
      setSeatMapSections([]);
      setActiveLocks([]);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, navigate]);

  useEffect(() => {
    loadSeatSelection();
  }, [loadSeatSelection]);

  useEffect(() => {
    if (isLoading || error) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      refreshSeatData({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [error, isLoading, refreshSeatData]);

  function handleToggleSeat(seat) {
    if (!isSelling || seat.status !== "Available") {
      return;
    }

    setActionError(null);
    setNotice("");
    setSelectedSeatIds((current) =>
      current.includes(seat.id) ? current.filter((seatId) => seatId !== seat.id) : [...current, seat.id],
    );
  }

  async function handleLockSelected() {
    if (!selectedSeatIds.length) {
      return;
    }

    setIsLocking(true);
    setActionError(null);
    setNotice("");

    try {
      const queueAccess = event?.virtualQueueEnabled ? getStoredQueueAccess(eventId) : null;
      const payload = await createSeatLocks(eventId, selectedSeatIds, queueAccess?.token);
      const lockedSeats = Array.isArray(payload?.lockedSeats) ? payload.lockedSeats.map(normalizeSeatLock) : [];
      const failedSeatIds = Array.isArray(payload?.failedSeatIds) ? payload.failedSeatIds : [];

      setSelectedSeatIds([]);
      await refreshSeatData({ silent: true });

      if (lockedSeats.length) {
        setNotice(`${lockedSeats.length} seat${lockedSeats.length === 1 ? "" : "s"} locked. You can now create an order.`);
      }

      if (failedSeatIds.length) {
        setActionError(`${failedSeatIds.length} seat${failedSeatIds.length === 1 ? " was" : "s were"} no longer available.`);
      }
    } catch (apiError) {
      const normalizedError = mapApiError(apiError);

      if (event?.virtualQueueEnabled && isQueueAccessError(normalizedError)) {
        clearStoredQueueAccess(eventId);
        navigate(eventWaitingRoom(eventId), { replace: true });
        return;
      }

      setActionError(normalizedError.message);
      await refreshSeatData({ silent: true });
    } finally {
      setIsLocking(false);
    }
  }

  async function handleReleaseSeat(seatId) {
    setReleasingSeatId(seatId);
    setActionError(null);
    setNotice("");

    try {
      await releaseSeatLock(eventId, seatId);
      setNotice("Seat lock released.");
      await refreshSeatData({ silent: true });
    } catch (apiError) {
      setActionError(mapApiError(apiError).message);
    } finally {
      setReleasingSeatId("");
    }
  }

  const handleTimerExpired = useCallback(() => {
    setNotice("A seat lock expired. Refreshing seat availability.");
    setActiveLocks([]);
    refreshSeatData({ silent: true });
  }, [refreshSeatData]);

  async function handleCreateOrder() {
    if (!activeLocks.length) {
      setActionError("Lock seats before creating an order.");
      return;
    }

    if (isLockExpired(lockExpiresAt)) {
      setActiveLocks([]);
      setActionError("Seat locks expired. Refreshing availability.");
      await refreshSeatData({ silent: true });
      return;
    }

    setIsCreatingOrder(true);
    setActionError(null);
    setNotice("");

    try {
      const order = await createOrder({
        eventId,
        seatIds: activeLocks.map((lock) => lock.seatId).filter(Boolean),
      });

      if (!order?.id && !order?._id) {
        throw new Error("The API did not return an order id.");
      }

      navigate(checkout(order.id || order._id), { state: { order: attachCurrentSeatLabelsToOrder(order, allSeatsById) } });
    } catch (apiError) {
      setActionError(mapApiError(apiError).message);
      await refreshSeatData({ silent: true });
    } finally {
      setIsCreatingOrder(false);
    }
  }

  if (isLoading) {
    return (
      <main className="page-shell">
        <LoadingState title="Loading seat map" message="Fetching event details, seat sections, seats, and your active locks." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-shell">
        <ErrorState
          title="Could not load seat selection"
          message={error.message}
          action={
            <div className="auth-state-actions">
              <Button onClick={loadSeatSelection}>Retry</Button>
              <Link to={`/events/${eventId}`}>
                <Button variant="outline">Back to event</Button>
              </Link>
            </div>
          }
        />
      </main>
    );
  }

  if (!event) {
    return (
      <main className="page-shell">
        <ErrorState title="Event not found" message="This event could not be loaded." />
      </main>
    );
  }

  return (
    <main className="seat-selection-page">
      <div className="page-stack">
        <Link to={`/events/${eventId}`} className="auth-link">
          Back to event details
        </Link>

        <section className="seat-selection-hero">
          <div className="seat-selection-hero__main">
            <div className="auth-state-actions">
              <StatusBadge status={event.status} />
            </div>
            <h1>{event.name}</h1>
            <div className="seat-selection-hero__meta">
              <span>{formatDateRange(event.startTime, event.endTime)}</span>
              <span>{event.location}</span>
            </div>
          </div>
          <aside className="seat-selection-hero__aside">
            <span className="page-kicker">Starting at</span>
            <strong>{formatCurrency(getStartingPrice(sections))}</strong>
            <p className="phase-note">{sections.length} section{sections.length === 1 ? "" : "s"} configured</p>
          </aside>
        </section>

        {!isSelling ? (
          <div className="seat-alert">
            This event is currently {event.status}. Seats can only be selected while the event is Selling.
          </div>
        ) : null}

        {notice ? <div className="seat-alert seat-alert--success">{notice}</div> : null}
        {actionError ? <div className="seat-alert seat-alert--error">{actionError}</div> : null}

        {!seatMapSections.length ? (
          <EmptyState title="No seat map yet" message="Seat sections and generated seats are not available for this event." />
        ) : (
          <div className="seat-layout">
            <div className="seat-layout__main">
              <SectionSelector
                sections={sections}
                seatCounts={sectionSeatCounts}
              />
              <SeatSelectionToolbar
                selectedCount={selectedSeats.length}
                lockedCount={lockedSeats.length}
                canSelect={isSelling}
                isLocking={isLocking}
                onLockSelected={handleLockSelected}
                onClearSelected={() => setSelectedSeatIds([])}
              />
              <CustomerFreeformSeatMap
                layout={seatMapLayout}
                sections={seatMapSections}
                selectedSeatIds={selectedSeatSet}
                lockedByMeSeatIds={lockedByMeSeatSet}
                disabled={!isSelling}
                onToggleSeat={handleToggleSeat}
              />
              <Button type="button" variant="outline" loading={isPolling} onClick={() => refreshSeatData()}>
                Refresh seat availability
              </Button>
            </div>

            <aside className="seat-layout__sidebar">
              <SeatLegend />
              <SeatSummary
                selectedSeats={selectedSeats}
                lockedSeats={lockedSeats}
                lockExpiresAt={lockExpiresAt}
                onReleaseSeat={handleReleaseSeat}
                releasingSeatId={releasingSeatId}
                onTimerExpired={handleTimerExpired}
              />
              <Card title="Checkout">
                {lockedSeats.length ? (
                  <>
                    <p>
                      {lockedSeats.length} locked seat{lockedSeats.length === 1 ? "" : "s"} are ready for the checkout
                      phase.
                    </p>
                    <Button
                      type="button"
                      loading={isCreatingOrder}
                      disabled={isCreatingOrder || isLockExpired(lockExpiresAt)}
                      onClick={handleCreateOrder}
                    >
                      Create order and continue
                    </Button>
                  </>
                ) : (
                  <p>Lock seats before continuing. This phase does not create orders.</p>
                )}
              </Card>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function attachCurrentSeatLabelsToOrder(order, seatsById) {
  if (!Array.isArray(order?.items) || !seatsById?.size) {
    return order;
  }

  return {
    ...order,
    items: order.items.map((item) => {
      const displaySeat = seatsById.get(item.seatId || item.seat?.id || item.seat?._id);

      if (!displaySeat || !item.seat) {
        return item;
      }

      return {
        ...item,
        seat: {
          ...item.seat,
          displayLabel: displaySeat.displayLabel,
          displayRowLabel: displaySeat.displayRowLabel,
          displaySeatNumber: displaySeat.displaySeatNumber,
        },
      };
    }),
  };
}

function buildSectionSeatCounts(sectionEntries) {
  return sectionEntries.reduce((result, entry) => {
    result[entry.section.id] = entry.seats.reduce(
      (counts, seat) => {
        counts.total += 1;
        counts[String(seat.status).toLowerCase()] = (counts[String(seat.status).toLowerCase()] || 0) + 1;
        return counts;
      },
      { total: 0, available: 0 },
    );

    return result;
  }, {});
}

function getEarliestExpiry(locks) {
  const expiryTimes = locks
    .map((lock) => (lock.expiresAt ? new Date(lock.expiresAt).getTime() : null))
    .filter((time) => Number.isFinite(time));

  if (!expiryTimes.length) {
    return null;
  }

  return new Date(Math.min(...expiryTimes)).toISOString();
}

function isLockExpired(expiresAt) {
  if (!expiresAt) {
    return false;
  }

  const expiresAtTime = new Date(expiresAt).getTime();
  return Number.isFinite(expiresAtTime) && expiresAtTime <= Date.now();
}

function getStartingPrice(sections) {
  const prices = sections.map((section) => Number(section.price)).filter((price) => Number.isFinite(price) && price >= 0);
  return prices.length ? Math.min(...prices) : 0;
}

async function getSeatMapPayloadWithFallback(eventId, fallbackEvent = null, fallbackSections = []) {
  try {
    return await getEventSeatMap(eventId);
  } catch (seatMapError) {
    const seatsPayload = await getEventSeats(eventId, { limit: 1000 });
    return {
      __fallbackSeatList: true,
      __seatMapError: mapApiError(seatMapError).message,
      event: fallbackEvent,
      layout: null,
      sections: fallbackSections,
      seats: getCollectionItems(seatsPayload),
    };
  }
}

function buildSeatMapFromSeatList(payload = {}, fallbackEvent = null, fallbackSections = []) {
  const sectionsById = new Map(fallbackSections.map((section) => [section.id, { section, seats: [] }]));

  getCollectionItems(payload.seats).forEach((seat) => {
    const normalizedSeat = normalizeSeat(seat);
    const sectionId = normalizedSeat.sectionId;

    if (!sectionsById.has(sectionId)) {
      sectionsById.set(sectionId, {
        section: normalizeSection({
          id: sectionId,
          name: normalizedSeat.sectionName,
          price: normalizedSeat.price,
        }),
        seats: [],
      });
    }

    sectionsById.get(sectionId).seats.push(seat);
  });

  return {
    event: fallbackEvent || payload.event || null,
    layout: null,
    sections: Array.from(sectionsById.values()),
  };
}

function queueTokenKey(eventId) {
  return `ticketRush.queueToken.${eventId}`;
}

function queueExpiryKey(eventId) {
  return `ticketRush.queueTokenExpiresAt.${eventId}`;
}

function getStoredQueueAccess(eventId) {
  const token = window.sessionStorage.getItem(queueTokenKey(eventId));
  const expiresAt = window.sessionStorage.getItem(queueExpiryKey(eventId));

  if (!token) {
    return null;
  }

  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    clearStoredQueueAccess(eventId);
    return null;
  }

  return { token, expiresAt };
}

function storeQueueAccess(eventId, queueToken, expiresAt) {
  if (!queueToken) {
    return;
  }

  window.sessionStorage.setItem(queueTokenKey(eventId), queueToken);

  if (expiresAt) {
    window.sessionStorage.setItem(queueExpiryKey(eventId), expiresAt);
  }
}

function clearStoredQueueAccess(eventId) {
  window.sessionStorage.removeItem(queueTokenKey(eventId));
  window.sessionStorage.removeItem(queueExpiryKey(eventId));
}

function isQueueAccessError(error) {
  const message = String(error?.message || "").toLowerCase();
  return error?.statusCode === 403 || error?.statusCode === 409 || message.includes("queue access") || message.includes("waiting room");
}
