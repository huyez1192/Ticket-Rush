import Button from "../common/Button";
import StatusBadge from "../common/StatusBadge";
import { formatDate } from "../../utils/formatDate";
import "./queue.css";

export default function WaitingRoomCard({
  event,
  queueState,
  loading,
  checking,
  leaving,
  error,
  onCheck,
  onLeave,
}) {
  const queue = queueState?.queue;
  const status = queue?.status || (queueState?.accessGranted ? "Admitted" : "Waiting");
  const position = Number(queue?.position || 0);

  return (
    <section className="waiting-room-card">
      <div className="waiting-room-card__header">
        <div>
          <p className="page-kicker">Virtual waiting room</p>
          <h1>{event?.name || "Event waiting room"}</h1>
          <p>Please do not refresh. We will let you in when it is your turn.</p>
        </div>
        <StatusBadge status={status} />
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
