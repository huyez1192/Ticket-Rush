import { useParams } from "react-router-dom";
import PagePlaceholder from "../PagePlaceholder";

export default function WaitingRoomPage() {
  const { eventId } = useParams();

  return (
    <PagePlaceholder
      title="Waiting room"
      purpose={`Authenticated waiting-room shell${eventId ? ` for event ${eventId}` : ""}.`}
      note="Queue token enforcement and activation rules remain partial; this screen should stay risk-tagged until clarified."
      status="Waiting"
    />
  );
}
