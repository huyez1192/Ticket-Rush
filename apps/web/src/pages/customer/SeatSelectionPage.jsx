import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEventById } from "../../api/eventApi";
import { getEventSeatMap, getEventSections } from "../../api/seatApi";
import { createSeatLocks, getMySeatLocks, releaseSeatLock } from "../../api/seatLockApi";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import StatusBadge from "../../components/common/StatusBadge";
import SeatLegend from "../../components/seat/SeatLegend";
import SeatMap from "../../components/seat/SeatMap";
import SeatSelectionToolbar from "../../components/seat/SeatSelectionToolbar";
import SeatSummary from "../../components/seat/SeatSummary";
import SectionSelector from "../../components/seat/SectionSelector";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateRange } from "../../utils/formatDate";
import { getCollectionItems, normalizeEvent } from "../../utils/eventMappers";
import {
  getActiveLockItems,
  normalizeSeatLock,
  normalizeSeatMap,
  normalizeSection,
  sortSeats,
} from "../../utils/seatMappers";
import { mapApiError } from "../../utils/mapApiError";

const POLL_INTERVAL_MS = 12000;

export default function SeatSelectionPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [seatMapSections, setSeatMapSections] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState("");
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [activeLocks, setActiveLocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [releasingSeatId, setReleasingSeatId] = useState("");
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState("");

  const sections = useMemo(() => seatMapSections.map((entry) => entry.section), [seatMapSections]);
  const activeSection = useMemo(
    () => seatMapSections.find((entry) => entry.section.id === activeSectionId) || seatMapSections[0] || null,
    [activeSectionId, seatMapSections],
  );
  const allSeats = useMemo(() => seatMapSections.flatMap((entry) => entry.seats), [seatMapSections]);
  const allSeatsById = useMemo(() => new Map(allSeats.map((seat) => [seat.id, seat])), [allSeats]);
  const selectedSeatSet = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds]);
  const lockedSeatSet = useMemo(() => new Set(activeLocks.map((lock) => lock.seatId)), [activeLocks]);
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
        const [seatMapPayload, locksPayload] = await Promise.all([getEventSeatMap(eventId), getMySeatLocks(eventId)]);
        const normalizedMap = normalizeSeatMap(seatMapPayload, event, sections);
        const locks = getActiveLockItems(locksPayload);

        setSeatMapSections(normalizedMap.sections);
        setActiveLocks(locks);
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
      const [eventPayload, sectionsPayload, seatMapPayload, locksPayload] = await Promise.all([
        getEventById(eventId),
        getEventSections(eventId),
        getEventSeatMap(eventId),
        getMySeatLocks(eventId),
      ]);
      const normalizedEvent = normalizeEvent(eventPayload);
      const sectionItems = getCollectionItems(sectionsPayload).map(normalizeSection);
      const normalizedMap = normalizeSeatMap(seatMapPayload, normalizedEvent, sectionItems);

      setEvent(normalizedEvent);
      setSeatMapSections(normalizedMap.sections);
      setActiveLocks(getActiveLockItems(locksPayload));
      setActiveSectionId((current) =>
        normalizedMap.sections.some((entry) => entry.section.id === current)
          ? current
          : normalizedMap.sections[0]?.section.id || "",
      );
      setSelectedSeatIds([]);
    } catch (apiError) {
      setError(mapApiError(apiError));
      setEvent(null);
      setSeatMapSections([]);
      setActiveLocks([]);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

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
      const payload = await createSeatLocks(eventId, selectedSeatIds);
      const lockedSeats = Array.isArray(payload?.lockedSeats) ? payload.lockedSeats.map(normalizeSeatLock) : [];
      const failedSeatIds = Array.isArray(payload?.failedSeatIds) ? payload.failedSeatIds : [];

      setSelectedSeatIds([]);
      await refreshSeatData({ silent: true });

      if (lockedSeats.length) {
        setNotice(`${lockedSeats.length} seat${lockedSeats.length === 1 ? "" : "s"} locked. Checkout starts in Phase 12.`);
      }

      if (failedSeatIds.length) {
        setActionError(`${failedSeatIds.length} seat${failedSeatIds.length === 1 ? " was" : "s were"} no longer available.`);
      }
    } catch (apiError) {
      setActionError(mapApiError(apiError).message);
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
    refreshSeatData({ silent: true });
  }, [refreshSeatData]);

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
                activeSectionId={activeSection?.section.id || activeSectionId}
                seatCounts={sectionSeatCounts}
                onChange={setActiveSectionId}
              />
              <SeatSelectionToolbar
                selectedCount={selectedSeats.length}
                lockedCount={lockedSeats.length}
                canSelect={isSelling}
                isLocking={isLocking}
                onLockSelected={handleLockSelected}
                onClearSelected={() => setSelectedSeatIds([])}
              />
              <SeatMap
                section={activeSection?.section}
                seats={activeSection?.seats || []}
                selectedSeatIds={selectedSeatSet}
                lockedSeatIds={lockedSeatSet}
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
                    <Button type="button" disabled>
                      Continue to checkout
                    </Button>
                    <p className="phase-note">Order creation and checkout are intentionally deferred to Phase 12.</p>
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

function getStartingPrice(sections) {
  const prices = sections.map((section) => Number(section.price)).filter((price) => Number.isFinite(price) && price >= 0);
  return prices.length ? Math.min(...prices) : 0;
}
