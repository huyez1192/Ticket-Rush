import { useParams } from "react-router-dom";
import PagePlaceholder from "../PagePlaceholder";

export default function SeatSelectionPage() {
  const { eventId } = useParams();

  return (
    <PagePlaceholder
      title="Select your seats"
      purpose={`Authenticated customer seat-selection shell for event ${eventId}.`}
      note="Phase 11 will add seat-map polling, seat lock calls, selected-seat summary, and lock timer behavior."
      status="Available"
    />
  );
}
