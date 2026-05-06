import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEventById, getEventImages, getEventSections } from "../../api/eventApi";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import EventDetailsHeader from "../../components/event/EventDetailsHeader";
import EventImageGallery from "../../components/event/EventImageGallery";
import EventInfoPanel from "../../components/event/EventInfoPanel";
import EventSectionSummary from "../../components/event/EventSectionSummary";
import { getCollectionItems, normalizeEvent } from "../../utils/eventMappers";
import { mapApiError } from "../../utils/mapApiError";

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [images, setImages] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadEventDetail() {
    setIsLoading(true);
    setError(null);

    try {
      const eventPayload = await getEventById(eventId);
      const normalizedEvent = normalizeEvent(eventPayload);
      setEvent(normalizedEvent);

      const [imagesResult, sectionsResult] = await Promise.allSettled([
        getEventImages(eventId),
        getEventSections(eventId),
      ]);

      const imageItems =
        imagesResult.status === "fulfilled" ? getCollectionItems(imagesResult.value) : normalizedEvent.images || [];
      const sectionItems = sectionsResult.status === "fulfilled" ? getCollectionItems(sectionsResult.value) : [];

      setImages(imageItems.length ? imageItems : normalizedEvent.images || []);
      setSections(sectionItems);
    } catch (apiError) {
      setError(mapApiError(apiError));
      setEvent(null);
      setImages([]);
      setSections([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadEventDetail();
  }, [eventId]);

  if (isLoading) {
    return (
      <main className="page-shell">
        <LoadingState title="Loading event" message="Fetching event details, images, and section pricing." />
      </main>
    );
  }

  if (error) {
    const isNotFound = error.statusCode === 404;

    return (
      <main className="page-shell">
        <ErrorState
          title={isNotFound ? "Event not found" : "Could not load event"}
          message={isNotFound ? "This event is unavailable or no longer public." : error.message}
          action={
            <div className="auth-state-actions">
              <Button onClick={loadEventDetail}>Retry</Button>
              <Link to="/events">
                <Button variant="outline">Back to events</Button>
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
    <main className="event-detail">
      <div className="page-stack">
        <Link to="/events" className="auth-link">
          Back to events
        </Link>
        <EventDetailsHeader event={event} />
        <div className="event-detail__grid">
          <div className="page-stack">
            <EventImageGallery images={images} title={event.name} />
            <Card title="Description">
              <p>{event.description || "No additional event description is available yet."}</p>
            </Card>
          </div>
          <aside className="event-detail__sidebar">
            <EventInfoPanel event={event} />
            <EventSectionSummary sections={sections} />
          </aside>
        </div>
      </div>
    </main>
  );
}
