import { formatDate } from "../../utils/formatDate";
import Button from "../common/Button";
import LoadingState from "../common/LoadingState";
import Modal from "../common/Modal";
import ProfileAvatar from "../profile/ProfileAvatar";
import "./admin-users.css";

export default function AdminUserDetailModal({ user, isOpen, loading, error, onClose }) {
  return (
    <Modal isOpen={isOpen} title="User details" onClose={onClose} actions={<Button onClick={onClose}>Close</Button>}>
      {loading ? <LoadingState title="Loading user" message="Fetching account details." /> : null}
      {!loading && error ? <div className="state state--error">{error}</div> : null}
      {!loading && user ? <UserDetail user={user} /> : null}
    </Modal>
  );
}

function UserDetail({ user }) {
  return (
    <div className="admin-user-detail">
      <header className="admin-user-detail__header">
        <ProfileAvatar user={user} size="lg" />
        <div>
          <span className="admin-table__meta">Account</span>
          <h3>{user.fullName || user.username || user.email || "User"}</h3>
          <p>{user.email}</p>
        </div>
      </header>
      <dl className="admin-detail-list">
        <div className="admin-detail-row"><dt>User ID</dt><dd>{user.id}</dd></div>
        <div className="admin-detail-row"><dt>Username</dt><dd>{user.username || "Unavailable"}</dd></div>
        <div className="admin-detail-row"><dt>Full name</dt><dd>{user.fullName || "Not set"}</dd></div>
        <div className="admin-detail-row"><dt>Gender</dt><dd>{user.gender || "Not set"}</dd></div>
        <div className="admin-detail-row"><dt>Date of birth</dt><dd>{user.dateOfBirth || "Not set"}</dd></div>
        <div className="admin-detail-row"><dt>Roles</dt><dd>{(user.roles || []).map((role) => role.name || role).join(", ") || "None"}</dd></div>
        <div className="admin-detail-row"><dt>Created</dt><dd>{formatDate(user.createdAt, { dateStyle: "medium", timeStyle: "short" }) || "Unknown"}</dd></div>
        <div className="admin-detail-row"><dt>Updated</dt><dd>{formatDate(user.updatedAt, { dateStyle: "medium", timeStyle: "short" }) || "Unknown"}</dd></div>
        <div className="admin-detail-row admin-detail-row--full"><dt>Avatar</dt><dd>{user.avatarUrl ? "Set" : "Not set"}</dd></div>
      </dl>
    </div>
  );
}
