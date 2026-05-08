import { useEffect, useState } from "react";
import Button from "../common/Button";
import Modal from "../common/Modal";
import "./admin-users.css";

export default function AdminUserRoleEditor({ user, roles = [], isOpen, loading, error, onClose, onSubmit }) {
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);

  useEffect(() => {
    setSelectedRoleIds((user?.roles || []).map((role) => role.id).filter(Boolean));
  }, [user]);

  function toggleRole(roleId) {
    setSelectedRoleIds((current) =>
      current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId],
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit?.(selectedRoleIds);
  }

  return (
    <Modal
      isOpen={isOpen}
      title={user ? `Assign roles: ${user.fullName || user.username || user.email}` : "Assign roles"}
      onClose={onClose}
      actions={null}
    >
      <form className="admin-role-editor" onSubmit={handleSubmit}>
        {error ? <div className="state state--error">{error}</div> : null}
        <div className="admin-role-editor__options">
          {roles.map((role) => (
            <label key={role.id} className="admin-role-editor__option">
              <input
                type="checkbox"
                checked={selectedRoleIds.includes(role.id)}
                onChange={() => toggleRole(role.id)}
              />
              <span>{role.name}</span>
            </label>
          ))}
        </div>
        <div className="admin-confirm-actions">
          <Button type="submit" disabled={loading || selectedRoleIds.length === 0}>
            {loading ? "Saving..." : "Save roles"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
