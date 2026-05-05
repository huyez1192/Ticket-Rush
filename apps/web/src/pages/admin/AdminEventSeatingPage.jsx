import { useParams } from "react-router-dom";
import AdminPageShell from "./AdminPageShell";

export default function AdminEventSeatingPage() {
  const { eventId } = useParams();

  return (
    <AdminPageShell
      title="Event seating"
      purpose={`Admin seating configuration shell for event ${eventId}.`}
      note="Phase 13 will add sections, seat generation, seat-map controls, and avoid exposing direct Sold status updates."
      status="Available"
    />
  );
}
