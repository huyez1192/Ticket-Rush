import Button from "../common/Button";
import StatusBadge from "../common/StatusBadge";
import { formatDate } from "../../utils/formatDate";
import "./queue.css";

export default function WaitingRoomCard({
  event,
  queueState,
  queueSummary,
  socketStatus,
  loading,
  checking,
  leaving,
  error,
  onCheck,
  onLeave,
}) {
  const queue = queueState?.queue;
  const status = queue?.status || queueState?.status || (queueState?.accessGranted ? "Admitted" : "Waiting");
  const position = Number(queue?.position || queueState?.position || 0);
  const isAutoMode = event?.queueAdmissionMode === "Auto";
  const connectionLabel =
    socketStatus === "connected" ? "Realtime connected" : socketStatus === "connecting" ? "Connecting realtime" : "Reconnecting";

  return (
    <section className="waiting-room-card">
      <div className="waiting-room-card__header">
        <div>
          <p className="page-kicker">Virtual waiting room</p>
          <h1>{event?.name || "Event waiting room"}</h1>
          <p>
            {isAutoMode
              ? "You will be admitted automatically when capacity is available."
              : "You will be admitted when the organizer opens the next batch."}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className={`waiting-room-socket waiting-room-socket--${socketStatus === "connected" ? "connected" : "reconnecting"}`}>
        <span>{connectionLabel}</span>
      </div>

      <div className="waiting-room-position" aria-live="polite">
        <span className="waiting-room-position__label">Your position</span>
        <strong>{queueState?.accessGranted ? "Ready" : position > 0 ? position : "--"}</strong>
      </div>

      <dl className="waiting-room-details">
        <div>
          <dt>Status</dt>
          <dd>{status}</dd>
        </div>
        <div>
          <dt>Event</dt>
          <dd>{event?.name || "Loading event"}</dd>
        </div>
        {queueState?.expiresAt ? (
          <div>
            <dt>Access expires</dt>
            <dd>{formatDate(queueState.expiresAt, { dateStyle: "medium", timeStyle: "short" })}</dd>
          </div>
        ) : null}
        {queueSummary ? (
          <div>
            <dt>Waiting</dt>
            <dd>{queueSummary.waiting ?? 0}</dd>
          </div>
        ) : null}
      </dl>

      {error ? <div className="seat-alert seat-alert--error">{error}</div> : null}

      <div className="waiting-room-actions">
        <Button type="button" loading={checking || loading} disabled={checking || loading} onClick={onCheck}>
          Check status
        </Button>
        <Button type="button" variant="outline" loading={leaving} disabled={leaving} onClick={onLeave}>
          Leave queue
        </Button>
      </div>
    </section>
  );
}
