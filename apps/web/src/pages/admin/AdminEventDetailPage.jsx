import { useParams } from "react-router-dom";
import AdminPageShell from "./AdminPageShell";

export default function AdminEventDetailPage() {
  const { eventId } = useParams();

  return (
    <AdminPageShell
      title="Event detail"
      purpose={`Derived admin detail route for event ${eventId}.`}
      note="This may become a standalone route or be folded into an event-management modal in Phase 13."
      status="Published"
    />
  );
}
