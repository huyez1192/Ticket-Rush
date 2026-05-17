import StatusBadge from "../common/StatusBadge";
import { getSeatDisplayName } from "../../utils/seatMappers";
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
  const isAlreadyUsed = result.reason === "already_used" || ["Used", "CheckedIn"].includes(ticket?.status);
  const resultClass = result.valid
    ? "admin-verify-result--valid"
    : isAlreadyUsed
      ? "admin-verify-result--used"
      : "admin-verify-result--invalid";
  const title = result.valid ? "Ticket verified" : isAlreadyUsed ? "Ticket already used" : "Invalid ticket";
  const badgeStatus = result.valid ? "Valid" : isAlreadyUsed ? "Used" : "Cancelled";

  return (
    <section className={`admin-verify-result ${resultClass}`}>
      <header>
        <div>
          <p className="admin-table__meta">Verification result</p>
          <h3>{title}</h3>
        </div>
        <StatusBadge status={badgeStatus} />
      </header>
      <p>{result.message}</p>
      {ticket ? (
        <dl className="admin-compact-list admin-verify-result__details">
          <VerifyFact label="Ticket ID" value={ticket.id} />
          <VerifyFact label="Ticket status" value={ticket.status} />
          <VerifyFact label="Event" value={ticket.event?.name} />
          <VerifyFact label="Customer" value={ticket.customer?.fullName || ticket.customer?.username || ticket.customer?.email} />
          <VerifyFact label="Seat" value={ticket.seat ? getSeatDisplayName(ticket.seat) : ticket.seat?.code} />
          <VerifyFact label="Section" value={ticket.seat?.sectionName} />
          <VerifyFact label="Issued" value={ticket.issuedAtLabel} />
          <VerifyFact label="Checked in" value={result.checkedInAtLabel || ticket.checkedInAtLabel} />
          <VerifyFact label="Order" value={ticket.order?.status} />
        </dl>
      ) : null}
    </section>
  );
}

function VerifyFact({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "Unavailable"}</dd>
    </div>
  );
}
