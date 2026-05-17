import { useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import Button from "../common/Button";
import Card from "../common/Card";
import StatusBadge from "../common/StatusBadge";
import "./ticket.css";

export default function TicketQrCard({ qr, ticket }) {
  const canvasRef = useRef(null);
  const [copyState, setCopyState] = useState("");
  const qrCode = qr?.qrCode || ticket?.qrCode || "";
  const status = ticket?.status || qr?.status || "Issued";
  const isUsed = useMemo(() => ["Used", "CheckedIn"].includes(status), [status]);

  async function handleCopyToken() {
    if (!qrCode) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(qrCode);
      } else {
        copyWithFallback(qrCode);
      }

      setCopyState("Token copied.");
    } catch {
      try {
        copyWithFallback(qrCode);
        setCopyState("Token copied.");
      } catch {
        setCopyState("Copy failed. Select the token manually.");
      }
    }
  }

  function handleDownloadQr() {
    const canvas = canvasRef.current?.querySelector("canvas");

    if (!canvas) {
      return;
    }

    const link = document.createElement("a");
    link.download = `ticket-${ticket?.id || qr?.ticketId || "qr"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <Card className="ticket-qr-card">
      <header className="ticket-qr-card__header">
        <div>
          <p className="page-kicker">Entry QR</p>
          <h3>{isUsed ? "Already used" : "Ready for entry"}</h3>
        </div>
        <StatusBadge status={status} />
      </header>

      <div className="ticket-qr-card__image" ref={canvasRef} aria-label="Ticket QR code">
        {qrCode ? (
          <QRCodeCanvas value={qrCode} size={224} bgColor="#fffdf8" fgColor="#141b2b" level="M" includeMargin />
        ) : (
          <span>QR token unavailable</span>
        )}
      </div>

      <div className="ticket-qr-card__token">
        <span>Manual verification token</span>
        <code>{qrCode || "Unavailable"}</code>
      </div>

      {copyState ? <p className="ticket-qr-card__notice">{copyState}</p> : null}

      <div className="ticket-qr-card__actions">
        <Button type="button" variant="outline" disabled={!qrCode} onClick={handleCopyToken}>
          Copy token
        </Button>
        <Button type="button" variant="outline" disabled={!qrCode} onClick={handleDownloadQr}>
          Download QR
        </Button>
      </div>
    </Card>
  );
}

function copyWithFallback(value) {
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "-1000px";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}
