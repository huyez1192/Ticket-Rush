import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEventById } from "../../api/eventApi";
import { getMyEventQueue, joinEventQueue, leaveEventQueue } from "../../api/queueApi";
import Button from "../../components/common/Button";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import WaitingRoomCard from "../../components/queue/WaitingRoomCard";
import { eventDetail, eventSeats } from "../../constants/routes";
import { useAuth } from "../../features/auth/useAuth";
import { subscribeToQueue } from "../../realtime/socketClient";
import { normalizeEvent } from "../../utils/eventMappers";
import { mapApiError } from "../../utils/mapApiError";

const FALLBACK_POLL_INTERVAL_MS = 45000;

export default function WaitingRoomPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [event, setEvent] = useState(null);
  const [queueState, setQueueState] = useState(null);
  const [queueSummary, setQueueSummary] = useState(null);
  const [socketReady, setSocketReady] = useState(false);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");

  const handleQueueState = useCallback(
    (payload) => {
      const normalizedPayload = normalizeQueueState(eventId, payload);
      setQueueState(normalizedPayload);

      if (normalizedPayload?.queueRequired === false) {
        clearStoredQueueAccess(eventId);
        navigate(eventSeats(eventId), { replace: true });
        return;
      }

      if (normalizedPayload?.accessGranted && normalizedPayload?.queueToken) {
        storeQueueAccess(eventId, normalizedPayload.queueToken, normalizedPayload.expiresAt);
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
    setSocketReady(false);
    setQueueSummary(null);

    try {
      const [eventResult, queuePayload] = await Promise.allSettled([getEventById(eventId), joinEventQueue(eventId)]);

      if (eventResult.status === "fulfilled") {
        setEvent(normalizeEvent(eventResult.value));
      }

      if (queuePayload.status === "rejected") {
        throw queuePayload.reason;
      }

      handleQueueState(queuePayload.value);
      setSocketReady(true);
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
    if (!socketReady || !token) {
      return undefined;
    }

    setSocketStatus("connecting");
    const unsubscribe = subscribeToQueue(eventId, token, {
      onConnect: () => {
        setSocketStatus("connected");
        setError("");
      },
      onDisconnect: () => setSocketStatus("reconnecting"),
      onConnectError: () => setSocketStatus("reconnecting"),
      onState: handleQueueState,
      onSummary: (payload) => setQueueSummary(payload),
      onPositionUpdated: (payload) => {
        setQueueState((current) => mergePositionUpdate(eventId, current, payload));
      },
      onError: (payload) => {
        setError(payload?.message || "Realtime queue update failed.");
      },
    });

    return unsubscribe;
  }, [eventId, handleQueueState, socketReady, token]);

  useEffect(() => {
    if (loading || error || socketStatus === "connected") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      checkStatus({ silent: true });
    }, FALLBACK_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [checkStatus, error, loading, socketStatus]);

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
        queueSummary={queueSummary}
        socketStatus={socketStatus}
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

function normalizeQueueState(eventId, payload = {}) {
  const queue =
    payload.queue ||
    (payload.status && payload.status !== "None"
      ? {
          eventId,
          status: payload.status,
          position: payload.position,
          expiresAt: payload.expiresAt,
        }
      : null);

  return {
    ...payload,
    eventId: payload.eventId || eventId,
    queueRequired: payload.queueRequired !== false,
    accessGranted: Boolean(payload.accessGranted),
    expiresAt: payload.expiresAt || queue?.expiresAt || null,
    queue,
  };
}

function mergePositionUpdate(eventId, current, payload = {}) {
  if (!current) {
    return normalizeQueueState(eventId, payload);
  }

  const queue = {
    ...(current.queue || {}),
    eventId,
    status: payload.status || current.queue?.status || current.status,
    position: payload.position ?? current.queue?.position ?? current.position,
  };

  return {
    ...current,
    status: queue.status,
    position: queue.position,
    queue,
  };
}
