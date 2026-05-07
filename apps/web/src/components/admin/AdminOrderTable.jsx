import { formatCurrency } from "../../utils/formatCurrency";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import AdminDataTable from "./AdminDataTable";
import AdminOrderStatusBadge from "./AdminOrderStatusBadge";
import "./admin-orders.css";

const columns = ["Order", "Customer", "Event", "Tickets / seats", "Total", "Status", "Created", "Actions"];

export default function AdminOrderTable({ orders = [], onView, footer }) {
  if (!orders.length) {
    return (
      <EmptyState
        title="No orders found"
        message="No sold-ticket or pending order records match the current filters."
      />
    );
  }

  return (
    <AdminDataTable columns={columns} footer={footer} tableClassName="admin-order-table">
      {orders.map((order) => (
        <tr key={order.id}>
          <td>
            <div className="admin-table__title">
              <strong>{order.code}</strong>
              <span className="admin-table__meta">ID {order.id}</span>
            </div>
          </td>
          <td>
            <div className="admin-table__title">
              <strong>{order.customer.name}</strong>
              <span className="admin-table__meta">{order.customer.email || order.customer.id || "Customer details unavailable"}</span>
            </div>
          </td>
          <td>
            <div className="admin-table__title">
              <strong>{order.event.name}</strong>
              <span className="admin-table__meta">{order.event.id || "Event details unavailable"}</span>
            </div>
          </td>
          <td>
            <div className="admin-table__title">
              <strong>{order.items.length} item{order.items.length === 1 ? "" : "s"}</strong>
              <span className="admin-table__meta">{order.tickets.length} issued ticket{order.tickets.length === 1 ? "" : "s"}</span>
            </div>
          </td>
          <td>
            <strong>{formatCurrency(order.totalAmount)}</strong>
          </td>
          <td>
            <div className="admin-order-table__badges">
              <AdminOrderStatusBadge status={order.status} />
              <AdminOrderStatusBadge status={order.paymentStatus} />
            </div>
          </td>
          <td>{order.createdAtLabel}</td>
          <td>
            <div className="admin-order-table__actions">
              <Button size="sm" variant="outline" onClick={() => onView?.(order)}>
                View
              </Button>
            </div>
          </td>
        </tr>
      ))}
    </AdminDataTable>
  );
}
