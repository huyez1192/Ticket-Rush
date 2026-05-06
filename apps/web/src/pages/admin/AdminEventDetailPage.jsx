import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  cancelEvent,
  closeEvent,
  createEventImage,
  deleteEventImage,
  getAdminEventById,
  getEventImages,
  openSellingEvent,
  publishEvent,
  updateEvent,
} from "../../api/adminApi";
import AdminEventForm from "../../components/admin/AdminEventForm";
import AdminEventImageManager from "../../components/admin/AdminEventImageManager";
import AdminEventStatusActions from "../../components/admin/AdminEventStatusActions";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import { adminEventSeating, adminEvents } from "../../constants/routes";
import {
  normalizeAdminEvent,
  normalizeEventImagesPayload,
} from "../../utils/adminEventMappers";
import { formatDateRange } from "../../utils/formatDate";

const STATUS_ACTIONS = {
  publish: publishEvent,
  openSelling: openSellingEvent,
  close: closeEvent,
  cancel: cancelEvent,
};

export default function AdminEventDetailPage() {
  const { eventId } = useParams();
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

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [eventPayload, imagePayload] = await Promise.all([
        getAdminEventById(eventId),
        getEventImages(eventId),
      ]);
      setEvent(normalizeAdminEvent(eventPayload));
      setImages(normalizeEventImagesPayload(imagePayload));
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

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
        <Card title="Event information">
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

      <Card title="Image URL manager">
        <AdminEventImageManager
          images={images}
          onAdd={handleAddImage}
          onDelete={handleDeleteImage}
          loading={imageLoading}
          error={imageError}
        />
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
        />
      </Modal>
    </div>
  );
}
