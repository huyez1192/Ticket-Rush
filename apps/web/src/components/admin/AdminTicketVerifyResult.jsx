import StatusBadge from "../common/StatusBadge";
import "./admin-orders.css";

export default function AdminTicketVerifyResult({ result }) {
  if (!result) {
    return (
      <section className="admin-verify-result admin-verify-result--idle">
        <h3>Awaiting verification</h3>
        <p>Paste a ticket QR token to check whether it exists in Ticket Rush.</p>
      </section>
    );
  }

  const ticket = result.ticket;

  return (
    <section className={`admin-verify-result ${result.valid ? "admin-verify-result--valid" : "admin-verify-result--invalid"}`}>
      <header>
        <div>
          <p className="admin-table__meta">Verification result</p>
          <h3>{result.valid ? "Valid ticket" : "Invalid ticket"}</h3>
        </div>
        <StatusBadge status={result.valid ? "Paid" : "Cancelled"} />
      </header>
      <p>{result.message}</p>
      {ticket ? (
        <dl className="admin-compact-list admin-verify-result__details">
          <div>
            <dt>Ticket ID</dt>
            <dd>{ticket.id || "Unavailable"}</dd>
          </div>
          <div>
            <dt>Ticket code</dt>
            <dd>{ticket.code || "Unavailable"}</dd>
          </div>
          <div>
            <dt>Event</dt>
            <dd>{ticket.event?.name || "Unavailable"}</dd>
          </div>
          <div>
            <dt>Seat</dt>
            <dd>{ticket.seat?.code || ticket.seat?.id || "Unavailable"}</dd>
          </div>
          <div>
            <dt>Section</dt>
            <dd>{ticket.seat?.sectionName || "Unavailable"}</dd>
          </div>
          <div>
            <dt>Issued</dt>
            <dd>{ticket.issuedAtLabel}</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
