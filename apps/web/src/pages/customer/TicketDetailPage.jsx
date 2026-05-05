import { useParams } from "react-router-dom";
import PagePlaceholder from "../PagePlaceholder";

export default function TicketDetailPage() {
  const { ticketId } = useParams();

  return (
    <PagePlaceholder
      title="Ticket detail"
      purpose={`Authenticated ticket detail shell for ticket ${ticketId}.`}
      note="Phase 12 will add ticket details and backend QR payload display. QR image rendering remains later."
      status="Admitted"
    />
  );
}
