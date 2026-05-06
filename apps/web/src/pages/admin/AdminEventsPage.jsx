import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  cancelEvent,
  closeEvent,
  createEvent,
  deleteEvent,
  getAdminEvents,
  openSellingEvent,
  publishEvent,
  updateEvent,
} from "../../api/adminApi";
import AdminConfirmDialog from "../../components/admin/AdminConfirmDialog";
import AdminEventFilters from "../../components/admin/AdminEventFilters";
import AdminEventForm from "../../components/admin/AdminEventForm";
import AdminEventTable from "../../components/admin/AdminEventTable";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import Button from "../../components/common/Button";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import { normalizeAdminEventsPayload } from "../../utils/adminEventMappers";

const STATUS_ACTIONS = {
  publish: publishEvent,
  openSelling: openSellingEvent,
  close: closeEvent,
  cancel: cancelEvent,
};

function getFiltersFromParams(searchParams) {
  return {
    keyword: searchParams.get("keyword") || "",
    status: searchParams.get("status") || "",
    page: Number(searchParams.get("page") || 1),
    limit: Number(searchParams.get("limit") || 10),
  };
}

export default function AdminEventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedFilters = useMemo(() => getFiltersFromParams(searchParams), [searchParams]);
  const [formFilters, setFormFilters] = useState(appliedFilters);
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formModal, setFormModal] = useState({ open: false, mode: "create", event: null });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [loadingAction, setLoadingAction] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const payload = await getAdminEvents({
        page: appliedFilters.page,
        limit: appliedFilters.limit,
        keyword: appliedFilters.keyword || undefined,
        status: appliedFilters.status || undefined,
      });
      const normalized = normalizeAdminEventsPayload(payload);
      setEvents(normalized.items);
      setPagination(normalized.pagination);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    setFormFilters(appliedFilters);
  }, [appliedFilters]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  function updateSearchParams(nextValues) {
    const nextParams = new URLSearchParams();
    if (nextValues.keyword) {
      nextParams.set("keyword", nextValues.keyword);
    }
    if (nextValues.status) {
      nextParams.set("status", nextValues.status);
    }
    if (nextValues.page && nextValues.page > 1) {
      nextParams.set("page", String(nextValues.page));
    }
    if (nextValues.limit && nextValues.limit !== 10) {
      nextParams.set("limit", String(nextValues.limit));
    }
    setSearchParams(nextParams);
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFormFilters((current) => ({ ...current, [name]: value }));
  }

  function handleFilterSubmit(event) {
    event.preventDefault();
    updateSearchParams({ ...formFilters, page: 1 });
  }

  function handleResetFilters() {
    setFormFilters({ keyword: "", status: "", page: 1, limit: 10 });
    setSearchParams(new URLSearchParams());
  }

  function handlePageChange(page) {
    updateSearchParams({ ...appliedFilters, page });
  }

  function openCreateModal() {
    setFormError("");
    setFormModal({ open: true, mode: "create", event: null });
  }

  function openEditModal(event) {
    setFormError("");
    setFormModal({ open: true, mode: "edit", event });
  }

  function closeFormModal() {
    setFormModal({ open: false, mode: "create", event: null });
    setFormError("");
  }

  async function handleSaveEvent(payload) {
    setFormLoading(true);
    setFormError("");

    try {
      if (formModal.mode === "edit") {
        await updateEvent(formModal.event.id, payload);
        setNotice("Event updated.");
      } else {
        await createEvent(payload);
        setNotice("Event created.");
      }

      closeFormModal();
      await loadEvents();
    } catch (apiError) {
      setFormError(apiError.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleStatusAction(event, actionKey) {
    const action = STATUS_ACTIONS[actionKey];
    if (!action) {
      return;
    }

    setLoadingAction(`${event.id}:${actionKey}`);
    setNotice("");
    setError("");

    try {
      await action(event.id);
      setNotice(`Event status updated for ${event.name}.`);
      await loadEvents();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoadingAction("");
    }
  }

  function openDeleteDialog(event) {
    setDeleteTarget(event);
    setDeleteError("");
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      await deleteEvent(deleteTarget.id);
      setNotice(`Deleted ${deleteTarget.name}.`);
      setDeleteTarget(null);
      await loadEvents();
    } catch (apiError) {
      setDeleteError(apiError.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  const tableFooter = (
    <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
  );

  return (
    <div className="admin-page">
      <AdminPageHeader
        kicker="Event management"
        title="Events"
        subtitle="Search events, edit core details, and move events through the selling lifecycle."
        actions={<Button onClick={openCreateModal}>New Event</Button>}
      />

      {notice ? <div className="state">{notice}</div> : null}

      <AdminEventFilters
        values={formFilters}
        onChange={handleFilterChange}
        onSubmit={handleFilterSubmit}
        onReset={handleResetFilters}
        loading={loading}
      />

      {error ? (
        <ErrorState title="Event action failed" message={error} action={<Button onClick={loadEvents}>Retry</Button>} />
      ) : null}

      {loading ? (
        <LoadingState title="Loading events" message="Fetching the latest event list." />
      ) : (
        <AdminEventTable
          events={events}
          onEdit={openEditModal}
          onDelete={openDeleteDialog}
          onStatusAction={handleStatusAction}
          loadingAction={loadingAction}
          footer={tableFooter}
        />
      )}

      <Modal
        isOpen={formModal.open}
        title={formModal.mode === "edit" ? "Edit event" : "Create event"}
        onClose={closeFormModal}
        actions={null}
      >
        <AdminEventForm
          key={`${formModal.mode}:${formModal.event?.id || "new"}`}
          event={formModal.event}
          mode={formModal.mode}
          onSubmit={handleSaveEvent}
          onCancel={closeFormModal}
          loading={formLoading}
          apiError={formError}
        />
      </Modal>

      <AdminConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete event"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.name}? The backend will block this if orders, tickets, seats, or locks still depend on it.`
            : ""
        }
        confirmLabel="Delete event"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
