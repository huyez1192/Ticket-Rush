import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEventById } from "../../api/eventApi";
import { getMyEventQueue, joinEventQueue, leaveEventQueue } from "../../api/queueApi";
import Button from "../../components/common/Button";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import WaitingRoomCard from "../../components/queue/WaitingRoomCard";
import { eventDetail, eventSeats } from "../../constants/routes";
import { normalizeEvent } from "../../utils/eventMappers";
import { mapApiError } from "../../utils/mapApiError";

const POLL_INTERVAL_MS = 7000;

export default function WaitingRoomPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [queueState, setQueueState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");

  const handleQueueState = useCallback(
    (payload) => {
      setQueueState(payload);

      if (payload?.queueRequired === false) {
        clearStoredQueueAccess(eventId);
        navigate(eventSeats(eventId), { replace: true });
        return;
      }

      if (payload?.accessGranted && payload?.queueToken) {
        storeQueueAccess(eventId, payload.queueToken, payload.expiresAt);
        navigate(eventSeats(eventId), { replace: true });
      }
    },
    [eventId, navigate],
  );

  const checkStatus = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setChecking(true);
        setError("");
      }

      try {
        const payload = await getMyEventQueue(eventId);
        handleQueueState(payload);
      } catch (apiError) {
        if (!silent) {
          setError(mapApiError(apiError).message);
        }
      } finally {
        if (!silent) {
          setChecking(false);
        }
      }
    },
    [eventId, handleQueueState],
  );

  const loadWaitingRoom = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [eventResult, queuePayload] = await Promise.allSettled([getEventById(eventId), joinEventQueue(eventId)]);

      if (eventResult.status === "fulfilled") {
        setEvent(normalizeEvent(eventResult.value));
      }

      if (queuePayload.status === "rejected") {
        throw queuePayload.reason;
      }

      handleQueueState(queuePayload.value);
    } catch (apiError) {
      setError(mapApiError(apiError).message);
    } finally {
      setLoading(false);
    }
  }, [eventId, handleQueueState]);

  useEffect(() => {
    loadWaitingRoom();
  }, [loadWaitingRoom]);

  useEffect(() => {
    if (loading || error) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      checkStatus({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [checkStatus, error, loading]);

  async function handleLeaveQueue() {
    setLeaving(true);
    setError("");

    try {
      await leaveEventQueue(eventId);
      clearStoredQueueAccess(eventId);
      navigate(eventDetail(eventId), { replace: true });
    } catch (apiError) {
      setError(mapApiError(apiError).message);
    } finally {
      setLeaving(false);
    }
  }

  if (loading && !queueState) {
    return (
      <main className="waiting-room-page">
        <LoadingState title="Joining waiting room" message="Checking your event queue access." />
      </main>
    );
  }

  if (error && !queueState) {
    return (
      <main className="waiting-room-page">
        <ErrorState title="Could not join waiting room" message={error} action={<Button onClick={loadWaitingRoom}>Retry</Button>} />
      </main>
    );
  }

  return (
    <main className="waiting-room-page">
      <WaitingRoomCard
        event={event}
        queueState={queueState}
        loading={loading}
        checking={checking}
        leaving={leaving}
        error={error}
        onCheck={() => checkStatus()}
        onLeave={handleLeaveQueue}
      />
    </main>
  );
}

function queueTokenKey(eventId) {
  return `ticketRush.queueToken.${eventId}`;
}

function queueExpiryKey(eventId) {
  return `ticketRush.queueTokenExpiresAt.${eventId}`;
}

function storeQueueAccess(eventId, queueToken, expiresAt) {
  window.sessionStorage.setItem(queueTokenKey(eventId), queueToken);

  if (expiresAt) {
    window.sessionStorage.setItem(queueExpiryKey(eventId), expiresAt);
  }
}

function clearStoredQueueAccess(eventId) {
  window.sessionStorage.removeItem(queueTokenKey(eventId));
  window.sessionStorage.removeItem(queueExpiryKey(eventId));
}
