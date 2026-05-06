import Card from "../common/Card";
import "./ticket.css";

export default function TicketQrCard({ qr }) {
  const qrCode = qr?.qrCode || "";

  return (
    <Card className="ticket-qr-card">
      <p className="page-kicker">Entry token</p>
      <h3>QR payload</h3>
      <div className="ticket-qr-card__code" aria-label="Ticket QR code payload">
        {qrCode || "QR token unavailable"}
      </div>
      <p>Show this token at entry. Image QR rendering is intentionally deferred; the backend currently returns a token payload.</p>
    </Card>
  );
}
