import Button from "../common/Button";
import Modal from "../common/Modal";
import "./admin.css";

export default function AdminConfirmDialog({
  isOpen,
  title = "Confirm action",
  message,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  loading,
  error,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      actions={
        <div className="admin-confirm-actions">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={confirmVariant} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="admin-confirm-body">
        <p>{message}</p>
        {error ? <p className="field__error">{error}</p> : null}
      </div>
    </Modal>
  );
}
