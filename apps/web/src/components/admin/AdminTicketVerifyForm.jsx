import { useState } from "react";
import Button from "../common/Button";
import Textarea from "../common/Textarea";
import "./admin-orders.css";

export default function AdminTicketVerifyForm({ onSubmit, onReset, loading, error }) {
  const [qrCode, setQrCode] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit?.({ qrCode: qrCode.trim() });
  }

  function handleReset() {
    setQrCode("");
    onReset?.();
  }

  return (
    <form className="admin-ticket-verify-form" onSubmit={handleSubmit}>
      <Textarea
        label="Ticket QR/token"
        name="qrCode"
        value={qrCode}
        onChange={(event) => setQrCode(event.target.value)}
        placeholder="Paste the QR token from the customer ticket detail"
        helper="Camera scanning is not included in this phase. Paste the ticket QR payload or token here."
        error={error}
        rows={5}
      />
      <div className="admin-row-actions">
        <Button type="submit" loading={loading} disabled={!qrCode.trim()}>
          Verify ticket
        </Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          Clear
        </Button>
      </div>
    </form>
  );
}
