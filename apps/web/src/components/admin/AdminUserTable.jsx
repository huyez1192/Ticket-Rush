import { formatDate } from "../../utils/formatDate";
import Badge from "../common/Badge";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import ProfileAvatar from "../profile/ProfileAvatar";
import AdminDataTable from "./AdminDataTable";
import "./admin-users.css";

const columns = ["User", "Username", "Email", "Gender", "Date of birth", "Roles", "Created", "Actions"];

export default function AdminUserTable({ users = [], footer, onView, onEditRoles, onDelete }) {
  if (!users.length) {
    return <EmptyState title="No users found" message="No user accounts match the current filters." />;
  }

  return (
    <AdminDataTable columns={columns} footer={footer} tableClassName="admin-user-table">
      {users.map((user) => (
        <tr key={user.id}>
          <td>
            <div className="admin-user-cell">
              <ProfileAvatar user={user} size="md" />
              <div className="admin-table__title">
                <strong>{user.fullName || user.username || user.email || user.id}</strong>
                <span className="admin-table__meta">ID {user.id}</span>
              </div>
            </div>
          </td>
          <td>{user.username || "Unavailable"}</td>
          <td>{user.email || "Unavailable"}</td>
          <td>{user.gender || "Not set"}</td>
          <td>{user.dateOfBirth || "Not set"}</td>
          <td>
            <div className="admin-user-table__roles">
              {(user.roles || []).map((role) => <Badge key={role.id || role.name}>{role.name || role}</Badge>)}
            </div>
          </td>
          <td>{formatDate(user.createdAt, { dateStyle: "medium" }) || "Unknown"}</td>
          <td>
            <div className="admin-user-table__actions">
              <Button size="sm" variant="outline" onClick={() => onView?.(user)}>View</Button>
              <Button size="sm" variant="outline" onClick={() => onEditRoles?.(user)}>Roles</Button>
              <Button size="sm" variant="danger" onClick={() => onDelete?.(user)}>Delete</Button>
            </div>
          </td>
        </tr>
      ))}
    </AdminDataTable>
  );
}
