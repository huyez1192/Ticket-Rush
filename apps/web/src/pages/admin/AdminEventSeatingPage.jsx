import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  createEventSection,
  deleteEventSection,
  generateSeats,
  getAdminEventById,
  getEventSeatMap,
  getEventSections,
  updateEventSection,
  updateSeatStatus,
} from "../../api/adminApi";
import AdminConfirmDialog from "../../components/admin/AdminConfirmDialog";
import AdminSeatMapPreview from "../../components/admin/AdminSeatMapPreview";
import AdminSeatMatrixGenerator from "../../components/admin/AdminSeatMatrixGenerator";
import AdminSeatStatusControls from "../../components/admin/AdminSeatStatusControls";
import AdminSectionForm from "../../components/admin/AdminSectionForm";
import AdminSectionList from "../../components/admin/AdminSectionList";
import AdminSeatingHeader from "../../components/admin/AdminSeatingHeader";
import Button from "../../components/common/Button";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import Modal from "../../components/common/Modal";
import { normalizeAdminEvent } from "../../utils/adminEventMappers";
import {
  normalizeAdminSeatMap,
  normalizeAdminSectionsPayload,
} from "../../utils/adminSeatMappers";
import { mapApiError } from "../../utils/mapApiError";

export default function AdminEventSeatingPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [sections, setSections] = useState([]);
  const [seatMap, setSeatMap] = useState({ sections: [] });
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSeatId, setSelectedSeatId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sectionModal, setSectionModal] = useState({ open: false, section: null });
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sectionError, setSectionError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [seatPatchLoading, setSeatPatchLoading] = useState(false);
  const [seatPatchError, setSeatPatchError] = useState("");

  const loadSeating = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [eventPayload, sectionsPayload, mapPayload] = await Promise.all([
        getAdminEventById(eventId),
        getEventSections(eventId),
        getEventSeatMap(eventId),
      ]);
      const normalizedEvent = normalizeAdminEvent(eventPayload);
      const normalizedSections = normalizeAdminSectionsPayload(sectionsPayload);
      const normalizedSeatMap = normalizeAdminSeatMap(mapPayload, normalizedSections);

      setEvent(normalizedEvent);
      setSections(normalizedSections);
      setSeatMap(normalizedSeatMap);
      setSelectedSectionId((current) => current || normalizedSections[0]?.id || normalizedSeatMap.sections[0]?.section.id || "");
    } catch (apiError) {
      setError(mapApiError(apiError).message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const refreshSeating = useCallback(async (preferredSectionId = "") => {
    const [sectionsPayload, mapPayload] = await Promise.all([getEventSections(eventId), getEventSeatMap(eventId)]);
    const normalizedSections = normalizeAdminSectionsPayload(sectionsPayload);
    const normalizedSeatMap = normalizeAdminSeatMap(mapPayload, normalizedSections);
    setSections(normalizedSections);
    setSeatMap(normalizedSeatMap);
    setSelectedSectionId((current) => {
      const target = preferredSectionId || current;
      if (target && normalizedSeatMap.sections.some((entry) => entry.section.id === target)) {
        return target;
      }
      return normalizedSections[0]?.id || normalizedSeatMap.sections[0]?.section.id || "";
    });
    setSelectedSeatId((current) =>
      current && normalizedSeatMap.sections.some((entry) => entry.seats.some((seat) => seat.id === current)) ? current : "",
    );
  }, [eventId]);

  useEffect(() => {
    loadSeating();
  }, [loadSeating]);

  const sectionSeatMap = useMemo(() => {
    return new Map(seatMap.sections.map((entry) => [entry.section.id, entry.seats]));
  }, [seatMap.sections]);

  const selectedSection = useMemo(() => {
    return sections.find((section) => section.id === selectedSectionId) || seatMap.sections.find((entry) => entry.section.id === selectedSectionId)?.section || null;
  }, [sections, seatMap.sections, selectedSectionId]);

  const selectedSeat = useMemo(() => {
    for (const entry of seatMap.sections) {
      const seat = entry.seats.find((item) => item.id === selectedSeatId);
      if (seat) {
        return seat;
      }
    }
    return null;
  }, [seatMap.sections, selectedSeatId]);

  function openCreateSection() {
    setSectionError("");
    setSectionModal({ open: true, section: null });
  }

  function openEditSection(section) {
    setSectionError("");
    setSectionModal({ open: true, section });
  }

  function closeSectionModal() {
    setSectionModal({ open: false, section: null });
    setSectionError("");
  }

  async function handleSaveSection(payload) {
    setSectionLoading(true);
    setSectionError("");
    setNotice("");

    try {
      if (sectionModal.section) {
        await updateEventSection(eventId, sectionModal.section.id, payload);
        setNotice("Section updated.");
      } else {
        const created = await createEventSection(eventId, payload);
        const createdId = created?.id || created?._id || "";
        setNotice("Section created.");
        closeSectionModal();
        await refreshSeating(createdId);
        return;
      }
      closeSectionModal();
      await refreshSeating();
    } catch (apiError) {
      setSectionError(mapApiError(apiError).message);
    } finally {
      setSectionLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");
    setNotice("");

    try {
      await deleteEventSection(eventId, deleteTarget.id);
      setNotice("Section deleted.");
      setDeleteTarget(null);
      await refreshSeating();
    } catch (apiError) {
      setDeleteError(mapApiError(apiError).message);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleGenerateSeats(section, payload) {
    if (!section) {
      return;
    }

    setGenerateLoading(true);
    setGenerateError("");
    setNotice("");

    try {
      await generateSeats(eventId, section.id, payload);
      setSelectedSectionId(section.id);
      setNotice(`Seats generated for ${section.name}.`);
      await refreshSeating();
    } catch (apiError) {
      setGenerateError(mapApiError(apiError).message);
    } finally {
      setGenerateLoading(false);
    }
  }

  async function handleUpdateSeatStatus(seat, payload) {
    setSeatPatchLoading(true);
    setSeatPatchError("");
    setNotice("");

    try {
      await updateSeatStatus(eventId, seat.id, payload);
      setNotice(`${seat.code || seat.label} updated to ${payload.status}.`);
      await refreshSeating();
    } catch (apiError) {
      setSeatPatchError(mapApiError(apiError).message);
    } finally {
      setSeatPatchLoading(false);
    }
  }

  if (loading) {
    return <LoadingState title="Loading seating" message="Fetching event, sections, and seat map." />;
  }

  if (error && !event) {
    return (
      <ErrorState
        title="Seating unavailable"
        message={error}
        action={<Button onClick={loadSeating}>Retry</Button>}
      />
    );
  }

  return (
    <div className="admin-page">
      <AdminSeatingHeader event={event} />

      {notice ? <div className="state">{notice}</div> : null}
      {error ? <ErrorState title="Seating action failed" message={error} action={<Button onClick={loadSeating}>Retry</Button>} /> : null}

      <div className="admin-seating-layout">
        <aside className="admin-seating-layout__sidebar">
          <AdminSectionList
            sections={sections}
            sectionSeatMap={sectionSeatMap}
            selectedSectionId={selectedSectionId}
            onSelect={(sectionId) => {
              setSelectedSectionId(sectionId);
              setSelectedSeatId("");
              setGenerateError("");
              setSeatPatchError("");
            }}
            onCreate={openCreateSection}
            onEdit={openEditSection}
            onDelete={(section) => {
              setDeleteTarget(section);
              setDeleteError("");
            }}
            onGenerate={(section) => {
              setSelectedSectionId(section.id);
              setGenerateError("");
            }}
          />
          <AdminSeatMatrixGenerator
            section={selectedSection}
            onSubmit={handleGenerateSeats}
            loading={generateLoading}
            error={generateError}
          />
          <AdminSeatStatusControls
            seat={selectedSeat}
            onSubmit={handleUpdateSeatStatus}
            loading={seatPatchLoading}
            error={seatPatchError}
          />
        </aside>

        <main className="admin-seating-layout__main">
          <AdminSeatMapPreview
            sections={seatMap.sections}
            selectedSectionId={selectedSectionId}
            selectedSeatId={selectedSeatId}
            onSelectSeat={(seat) => {
              setSelectedSeatId(seat.id);
              setSeatPatchError("");
            }}
          />
        </main>
      </div>

      <Modal
        isOpen={sectionModal.open}
        title={sectionModal.section ? "Edit section" : "Create section"}
        onClose={closeSectionModal}
        actions={null}
      >
        <AdminSectionForm
          key={sectionModal.section?.id || "new-section"}
          section={sectionModal.section}
          onSubmit={handleSaveSection}
          onCancel={closeSectionModal}
          loading={sectionLoading}
          apiError={sectionError}
        />
      </Modal>

      <AdminConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete section"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.name}? The backend will block this if seats have already been generated.`
            : ""
        }
        confirmLabel="Delete section"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
