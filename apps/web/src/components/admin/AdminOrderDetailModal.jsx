import { formatCurrency } from "../../utils/formatCurrency";
import Button from "../common/Button";
import LoadingState from "../common/LoadingState";
import Modal from "../common/Modal";
import AdminOrderStatusBadge from "./AdminOrderStatusBadge";
import AdminSoldTicketList from "./AdminSoldTicketList";
import "./admin-orders.css";

export default function AdminOrderDetailModal({ order, isOpen, loading, error, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      title={order ? `Order ${order.code}` : "Order detail"}
      onClose={onClose}
      actions={<Button onClick={onClose}>Close</Button>}
    >
      {loading ? <LoadingState title="Loading order" message="Fetching order items and issued tickets." /> : null}
      {!loading && error ? <div className="state state--error">{error}</div> : null}
      {!loading && order ? <OrderDetail order={order} /> : null}
    </Modal>
  );
}

function OrderDetail({ order }) {
  return (
    <div className="admin-order-detail">
      <section className="admin-order-detail__summary">
        <div>
          <span className="admin-table__meta">Order status</span>
          <AdminOrderStatusBadge status={order.status} />
        </div>
        <div>
          <span className="admin-table__meta">Payment status</span>
          <AdminOrderStatusBadge status={order.paymentStatus} />
        </div>
        <div>
          <span className="admin-table__meta">Total</span>
          <strong>{formatCurrency(order.totalAmount)}</strong>
        </div>
      </section>

      <section className="admin-order-detail__grid">
        <DetailBlock
          title="Order metadata"
          rows={[
            ["Order ID", order.id],
            ["Created", order.createdAtLabel],
            ["Updated", order.updatedAtLabel],
          ]}
        />
        <DetailBlock
          title="Customer"
          rows={[
            ["Name", order.customer.name],
            ["Email", order.customer.email || "Unavailable"],
            ["User ID", order.customer.id || order.userId || "Unavailable"],
          ]}
        />
        <DetailBlock
          title="Event"
          rows={[
            ["Name", order.event.name],
            ["Event ID", order.event.id || order.eventId || "Unavailable"],
            ["Location", order.event.location || "Unavailable"],
          ]}
        />
      </section>

      <section className="admin-order-section">
        <h3>Order items and seats</h3>
        <div className="table-wrap">
          <table className="table admin-order-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Section</th>
                <th>Seat</th>
                <th>Price</th>
                <th>Ticket</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id || item.seatId}>
                  <td>{item.id || "Unavailable"}</td>
                  <td>{item.sectionName || "Unavailable"}</td>
                  <td>{item.seatLabel}</td>
                  <td>{formatCurrency(item.priceSnapshot)}</td>
                  <td>{item.ticket?.id || item.ticket?.qrCode || "Not issued"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-order-section">
        <h3>Sold tickets</h3>
        <AdminSoldTicketList tickets={order.tickets} />
      </section>
    </div>
  );
}

function DetailBlock({ title, rows }) {
  return (
    <article className="admin-order-detail__block">
      <h3>{title}</h3>
      <dl className="admin-compact-list">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || "Unavailable"}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
