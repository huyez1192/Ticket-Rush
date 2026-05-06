import { Link } from "react-router-dom";
import { adminEventDetail } from "../../constants/routes";
import { formatDateRange } from "../../utils/formatDate";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import StatusBadge from "../common/StatusBadge";
import AdminDataTable from "./AdminDataTable";
import AdminEventStatusActions from "./AdminEventStatusActions";
import "./admin.css";

const columns = ["Event", "Venue / date", "Status", "Lifecycle", "Actions"];

export default function AdminEventTable({ events = [], onEdit, onDelete, onStatusAction, loadingAction, footer }) {
  if (!events.length) {
    return (
      <EmptyState
        title="No events found"
        message="Adjust the filters or create a new event to begin managing ticket sales."
      />
    );
  }

  return (
    <AdminDataTable columns={columns} footer={footer} tableClassName="admin-event-table">
      {events.map((event) => (
        <tr key={event.id}>
          <td>
            <div className="admin-event-title-cell">
              <div className="admin-event-thumb" aria-hidden="true">
                {event.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="admin-table__title">
                <strong>{event.name}</strong>
                <span className="admin-table__meta">ID {event.id}</span>
              </div>
            </div>
          </td>
          <td>
            <div className="admin-table__title">
              <strong>{event.location}</strong>
              <span>{formatDateRange(event.startTime, event.endTime)}</span>
            </div>
          </td>
          <td>
            <StatusBadge status={event.status} />
          </td>
          <td>
            <AdminEventStatusActions event={event} onAction={onStatusAction} loadingAction={loadingAction} />
          </td>
          <td>
            <div className="admin-event-table__actions">
              <Link className="btn btn--outline btn--sm" to={adminEventDetail(event.id)}>
                View
              </Link>
              <Button size="sm" variant="outline" onClick={() => onEdit?.(event)}>
                Edit
              </Button>
              <Button size="sm" variant="danger" onClick={() => onDelete?.(event)}>
                Delete
              </Button>
            </div>
          </td>
        </tr>
      ))}
    </AdminDataTable>
  );
}
