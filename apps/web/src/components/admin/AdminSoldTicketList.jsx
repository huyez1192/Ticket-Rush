import EmptyState from "../common/EmptyState";
import StatusBadge from "../common/StatusBadge";
import "./admin-orders.css";

export default function AdminSoldTicketList({ tickets = [] }) {
  if (!tickets.length) {
    return (
      <EmptyState
        title="No issued tickets"
        message="This order has no issued tickets yet. Pending or cancelled orders may not generate tickets."
      />
    );
  }

  return (
    <div className="admin-sold-ticket-list">
      {tickets.map((ticket) => (
        <article key={ticket.id || ticket.qrCode} className="admin-sold-ticket">
          <div>
            <h4>{ticket.code}</h4>
            <p>{ticket.event?.name || "Event unavailable"}</p>
          </div>
          <dl className="admin-compact-list">
            <div>
              <dt>Ticket ID</dt>
              <dd>{ticket.id || "Unavailable"}</dd>
            </div>
            <div>
              <dt>Seat</dt>
              <dd>{ticket.seat?.code || ticket.seat?.id || "Unavailable"}</dd>
            </div>
            <div>
              <dt>Issued</dt>
              <dd>{ticket.issuedAtLabel}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={ticket.status} />
              </dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}
