import { useParams } from "react-router-dom";
import PagePlaceholder from "../PagePlaceholder";

export default function EventDetailsPage() {
  const { eventId } = useParams();

  return (
    <PagePlaceholder
      title="Event details"
      purpose={`Public event detail shell for event ${eventId}.`}
      note="Phase 10 will add event metadata, images, sections, and seat-map preview data."
      status="Selling"
    />
  );
}
