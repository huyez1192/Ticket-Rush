import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  cancelEvent,
  admitQueueBatch,
  closeEvent,
  createEventImage,
  deleteEventImage,
  getAdminEventQueue,
  getAdminEventById,
  getEventImages,
  openSellingEvent,
  publishEvent,
  updateEvent,
  updateEventQueueConfig,
} from "../../api/adminApi";
import AdminEventForm from "../../components/admin/AdminEventForm";
import AdminEventImageManager from "../../components/admin/AdminEventImageManager";
import AdminEventImagePreview from "../../components/admin/AdminEventImagePreview";
import AdminEventStatusActions from "../../components/admin/AdminEventStatusActions";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ErrorState from "../../components/common/ErrorState";
import Input from "../../components/common/Input";
import LoadingState from "../../components/common/LoadingState";
import Modal from "../../components/common/Modal";
import Select from "../../components/common/Select";
import StatusBadge from "../../components/common/StatusBadge";
import { adminEventSeating, adminEvents } from "../../constants/routes";
import { useAuth } from "../../features/auth/useAuth";
import { subscribeToAdminQueue } from "../../realtime/socketClient";
import {
  normalizeAdminEvent,
  normalizeEventImagesPayload,
} from "../../utils/adminEventMappers";
import { formatDate, formatDateRange } from "../../utils/formatDate";

const STATUS_ACTIONS = {
  publish: publishEvent,
  openSelling: openSellingEvent,
  close: closeEvent,
  cancel: cancelEvent,
};

export default function AdminEventDetailPage() {
  const { eventId } = useParams();
  const { token } = useAuth();
  const [event, setEvent] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const [queueConfig, setQueueConfig] = useState(getQueueConfigInitialValues());
  const [queueEntries, setQueueEntries] = useState([]);
  const [queueSummary, setQueueSummary] = useState(getEmptyQueueSummary());
  const [queueError, setQueueError] = useState("");
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueSaving, setQueueSaving] = useState(false);
  const [queueAdmitting, setQueueAdmitting] = useState(false);
  const [queueSocketStatus, setQueueSocketStatus] = useState("connecting");
  const queueEnabled = Boolean(event?.virtualQueueEnabled);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [eventPayload, imagePayload] = await Promise.all([
        getAdminEventById(eventId),
        getEventImages(eventId),
      ]);
      const normalizedEvent = normalizeAdminEvent(eventPayload);
      setEvent(normalizedEvent);
      setQueueConfig(getQueueConfigInitialValues(normalizedEvent));
      setImages(normalizeEventImagesPayload(imagePayload));
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    setQueueError("");

    try {
      const payload = await getAdminEventQueue(eventId, { page: 1, limit: 20 });
      setQueueEntries(Array.isArray(payload?.items) ? payload.items : []);
      setQueueSummary(normalizeQueueSummary(payload?.summary));
    } catch (apiError) {
      setQueueError(apiError.message);
    } finally {
      setQueueLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    setQueueSocketStatus("connecting");
    const unsubscribe = subscribeToAdminQueue(eventId, token, {
      onConnect: () => {
        setQueueSocketStatus("connected");
        setQueueError("");
      },
      onDisconnect: () => setQueueSocketStatus("reconnecting"),
      onConnectError: () => setQueueSocketStatus("reconnecting"),
      onSummary: (payload) => setQueueSummary(normalizeQueueSummary(payload)),
      onUpdate: (payload) => {
        if (typeof payload?.queueRequired === "boolean") {
          setEvent((current) => (current ? { ...current, virtualQueueEnabled: payload.queueRequired } : current));
          setQueueConfig((current) => ({ ...current, virtualQueueEnabled: payload.queueRequired }));
        }
        setQueueSummary(normalizeQueueSummary(payload?.summary));
        setQueueEntries(Array.isArray(payload?.entries) ? payload.entries : []);
      },
      onError: (payload) => setQueueError(payload?.message || "Realtime queue update failed."),
    });

    return unsubscribe;
  }, [eventId, token]);

  async function handleStatusAction(currentEvent, actionKey) {
    const action = STATUS_ACTIONS[actionKey];
    if (!action) {
      return;
    }

    setLoadingAction(`${currentEvent.id}:${actionKey}`);
    setError("");
    setNotice("");

    try {
      const updated = await action(currentEvent.id);
      setEvent(normalizeAdminEvent(updated));
      setNotice(`Event status updated to ${normalizeAdminEvent(updated).status}.`);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoadingAction("");
    }
  }

  async function handleUpdate(payload) {
    setEditLoading(true);
    setEditError("");

    try {
      const updated = await updateEvent(event.id, payload);
      setEvent(normalizeAdminEvent(updated));
      setNotice("Event details updated.");
      setEditOpen(false);
    } catch (apiError) {
      setEditError(apiError.message);
    } finally {
      setEditLoading(false);
    }
  }

  function handleQueueConfigChange(eventTarget) {
    const { name, type, checked, value } = eventTarget;
    setQueueConfig((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSaveQueueConfig(event) {
    event.preventDefault();
    setQueueSaving(true);
    setQueueError("");
    setNotice("");

    try {
      const payload = buildQueueConfigPayload(queueConfig);
      const updated = await updateEventQueueConfig(eventId, payload);
      const normalized = normalizeAdminEvent(updated);
      setEvent(normalized);
      setQueueConfig(getQueueConfigInitialValues(normalized));
      if (normalized.virtualQueueEnabled) {
        await loadQueue();
      } else {
        setQueueEntries([]);
        setQueueSummary(getEmptyQueueSummary());
      }
      setNotice("Virtual queue configuration saved.");
    } catch (apiError) {
      setQueueError(apiError.message);
    } finally {
      setQueueSaving(false);
    }
  }

  async function handleAdmitBatch() {
    setQueueAdmitting(true);
    setQueueError("");
    setNotice("");

    try {
      const payload = await admitQueueBatch(eventId, { limit: Number(queueConfig.queueBatchSize || 50) });
      setNotice(`${payload?.admittedCount || 0} queue entr${payload?.admittedCount === 1 ? "y" : "ies"} admitted.`);
      await loadQueue();
    } catch (apiError) {
      setQueueError(apiError.message);
    } finally {
      setQueueAdmitting(false);
    }
  }

  async function handleAddImage(payload) {
    setImageLoading(true);
    setImageError("");

    try {
      await createEventImage(event.id, payload);
      const imagePayload = await getEventImages(event.id);
      setImages(normalizeEventImagesPayload(imagePayload));
      setNotice("Image added.");
    } catch (apiError) {
      setImageError(apiError.message);
    } finally {
      setImageLoading(false);
    }
  }

  async function handleDeleteImage(image) {
    setImageLoading(true);
    setImageError("");

    try {
      await deleteEventImage(event.id, image.id);
      setImages((current) => current.filter((item) => item.id !== image.id));
      setNotice("Image deleted.");
    } catch (apiError) {
      setImageError(apiError.message);
    } finally {
      setImageLoading(false);
    }
  }

  if (loading) {
    return <LoadingState title="Loading event" message="Fetching admin event detail." />;
  }

  if (error && !event) {
    return (
      <ErrorState
        title="Event unavailable"
        message={error}
        action={
          <div className="admin-row-actions">
            <Button onClick={loadDetail}>Retry</Button>
            <Link className="btn btn--outline" to={adminEvents()}>
              Back to events
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        kicker="Event detail"
        title={event.name}
        subtitle="Review event details, lifecycle state, images, and seating entry point."
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Link className="btn btn--primary" to={adminEventSeating(event.id)}>
              Configure seating
            </Link>
          </>
        }
      />

      {notice ? <div className="state">{notice}</div> : null}
      {error ? <ErrorState title="Event action failed" message={error} /> : null}

      <section className="admin-detail-layout">
        <Card title="Event information" className="admin-event-information-card">
          <dl className="admin-detail-list">
            <div className="admin-detail-row">
              <dt>Status</dt>
              <dd>
                <StatusBadge status={event.status} />
              </dd>
            </div>
            <div className="admin-detail-row">
              <dt>When</dt>
              <dd>{formatDateRange(event.startTime, event.endTime)}</dd>
            </div>
            <div className="admin-detail-row">
              <dt>Location</dt>
              <dd>{event.location}</dd>
            </div>
            <div className="admin-detail-row">
              <dt>Event ID</dt>
              <dd>{event.id}</dd>
            </div>
            <div className="admin-detail-row admin-detail-row--full">
              <dt>Description</dt>
              <dd>{event.description || "No description provided."}</dd>
            </div>
          </dl>
          <section className="admin-detail-images" aria-labelledby="admin-event-images-heading">
            <div className="admin-detail-images__header">
              <h4 id="admin-event-images-heading">Images</h4>
            </div>
            {images.length ? (
              <div className="admin-image-gallery admin-image-gallery--detail" aria-label="Event image previews">
                {images.map((image) => (
                  <AdminEventImagePreview
                    key={image.id || image.imageUrl}
                    image={image}
                    alt={`${event.name} preview`}
                    variant="card"
                  />
                ))}
              </div>
            ) : (
              <p className="admin-detail-images__empty">No event images yet.</p>
            )}
          </section>
        </Card>

        <Card title="Lifecycle actions">
          <AdminEventStatusActions
            event={event}
            onAction={handleStatusAction}
            loadingAction={loadingAction}
          />
          <p>
            Status changes use dedicated backend lifecycle endpoints. General event edits do not send status updates.
          </p>
        </Card>
      </section>

      <Card title="Virtual queue">
        <div className="admin-queue-grid">
          <form className="admin-form" onSubmit={handleSaveQueueConfig}>
            <label className="admin-checkbox-row">
              <input
                type="checkbox"
                name="virtualQueueEnabled"
                checked={queueConfig.virtualQueueEnabled}
                onChange={(changeEvent) => handleQueueConfigChange(changeEvent.target)}
              />
              <span>Enable virtual queue for this event</span>
            </label>
            <div className="admin-form__grid">
              <Input
                label="Batch size"
                name="queueBatchSize"
                type="number"
                min="1"
                max="500"
                value={queueConfig.queueBatchSize}
                onChange={(changeEvent) => handleQueueConfigChange(changeEvent.target)}
              />
              <Input
                label="Access TTL minutes"
                name="queueAccessTtlMinutes"
                type="number"
                min="1"
                max="240"
                value={queueConfig.queueAccessTtlMinutes}
                onChange={(changeEvent) => handleQueueConfigChange(changeEvent.target)}
              />
              <Input
                label="Max active users"
                name="queueMaxActiveUsers"
                type="number"
                min="1"
                value={queueConfig.queueMaxActiveUsers}
                placeholder="Optional"
                onChange={(changeEvent) => handleQueueConfigChange(changeEvent.target)}
              />
              <Select
                label="Admission mode"
                name="queueAdmissionMode"
                value={queueConfig.queueAdmissionMode}
                onChange={(changeEvent) => handleQueueConfigChange(changeEvent.target)}
                options={[
                  { value: "Manual", label: "Manual" },
                  { value: "Auto", label: "Auto" },
                ]}
              />
            </div>
            <div className="admin-row-actions">
              <Button type="submit" loading={queueSaving} disabled={queueSaving}>
                Save config
              </Button>
              <Button
                type="button"
                variant="outline"
                loading={queueAdmitting}
                disabled={queueAdmitting || !queueEnabled}
                onClick={handleAdmitBatch}
              >
                {queueConfig.queueAdmissionMode === "Auto" ? "Admit next batch now" : "Admit next batch"}
              </Button>
            </div>
          </form>

          <div className="admin-queue-summary">
            <div className="admin-queue-summary__item">
              <span>Mode</span>
              <strong className="admin-queue-stat-value" title={queueConfig.queueAdmissionMode}>
                {queueConfig.queueAdmissionMode}
              </strong>
            </div>
            <div className="admin-queue-summary__item">
              <span>Socket</span>
              <strong
                className="admin-queue-stat-value"
                title={queueSocketStatus === "connected" ? "Live" : "Reconnecting"}
              >
                {queueSocketStatus === "connected" ? "Live" : "Reconnecting"}
              </strong>
            </div>
            {Object.entries(queueSummary).map(([status, count]) => (
              <div key={status} className="admin-queue-summary__item">
                <span>{status}</span>
                <strong className="admin-queue-stat-value" title={String(count)}>
                  {count}
                </strong>
              </div>
            ))}
          </div>
        </div>

        {queueError ? <div className="state state--error">{queueError}</div> : null}
        {queueLoading ? <LoadingState title="Loading queue" message="Fetching waiting room entries." /> : null}

        {!queueLoading ? (
          !queueEnabled ? (
            <p>Virtual queue is disabled. Queue entries will appear after the queue is enabled and customers join.</p>
          ) :
          queueEntries.length ? (
            <div className="table-wrap">
              <table className="table admin-queue-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Status</th>
                    <th>Position</th>
                    <th>Admitted</th>
                    <th>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {queueEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <strong>{entry.user?.fullName || entry.user?.username || entry.user?.email || "Customer"}</strong>
                        <div className="admin-table__meta">{entry.user?.email || entry.userId}</div>
                      </td>
                      <td>
                        <StatusBadge status={entry.status} />
                      </td>
                      <td>{formatQueuePosition(entry)}</td>
                      <td>{formatQueueDate(entry.admittedAt)}</td>
                      <td>{formatQueueDate(entry.expiresAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No active queue entries yet.</p>
          )
        ) : null}
      </Card>

      <div className="admin-row-actions">
        <Link className="btn btn--outline" to={adminEvents()}>
          Back to events
        </Link>
      </div>

      <Modal isOpen={editOpen} title="Edit event" onClose={() => setEditOpen(false)} actions={null}>
        <AdminEventForm
          key={event.id}
          event={event}
          mode="edit"
          onSubmit={handleUpdate}
          onCancel={() => setEditOpen(false)}
          loading={editLoading}
          apiError={editError}
          imageManager={
            <AdminEventImageManager
              images={images}
              onAdd={handleAddImage}
              onDelete={handleDeleteImage}
              loading={imageLoading}
              error={imageError}
            />
          }
        />
      </Modal>
    </div>
  );
}

function getEmptyQueueSummary() {
  return {
    Waiting: 0,
    Admitted: 0,
    Expired: 0,
    Cancelled: 0,
  };
}

function normalizeQueueSummary(summary = {}) {
  return {
    Waiting: Number(summary.Waiting ?? summary.waiting ?? 0),
    Admitted: Number(summary.Admitted ?? summary.admitted ?? 0),
    Expired: Number(summary.Expired ?? summary.expired ?? 0),
    Cancelled: Number(summary.Cancelled ?? summary.cancelled ?? 0),
  };
}

function getQueueConfigInitialValues(event = {}) {
  return {
    virtualQueueEnabled: Boolean(event.virtualQueueEnabled),
    queueBatchSize: event.queueBatchSize || 50,
    queueAccessTtlMinutes: event.queueAccessTtlMinutes || 10,
    queueMaxActiveUsers: event.queueMaxActiveUsers || "",
    queueAdmissionMode: event.queueAdmissionMode || "Manual",
  };
}

function buildQueueConfigPayload(values) {
  const queueMaxActiveUsers = values.queueMaxActiveUsers === "" ? null : Number(values.queueMaxActiveUsers);

  return {
    virtualQueueEnabled: Boolean(values.virtualQueueEnabled),
    queueBatchSize: Number(values.queueBatchSize || 50),
    queueAccessTtlMinutes: Number(values.queueAccessTtlMinutes || 10),
    queueMaxActiveUsers,
    queueAdmissionMode: values.queueAdmissionMode || "Manual",
  };
}

function formatQueueDate(value) {
  return value ? formatDate(value, { dateStyle: "medium", timeStyle: "short" }) : "--";
}

function formatQueuePosition(entry) {
  if (entry?.status !== "Waiting") {
    return "--";
  }

  const position = Number(entry.position);
  return Number.isFinite(position) && position > 0 ? position : "--";
}
