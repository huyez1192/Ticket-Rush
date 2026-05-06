import Button from "../common/Button";
import "./admin.css";

export default function AdminEventStatusActions({ event, onAction, loadingAction = "" }) {
  const status = event?.status;
  const actions = getActionsForStatus(status);

  if (!actions.length) {
    return <span className="admin-table__meta">No lifecycle actions</span>;
  }

  return (
    <div className="admin-status-actions">
      {actions.map((action) => (
        <Button
          key={action.key}
          variant={action.variant}
          size="sm"
          loading={loadingAction === `${event.id}:${action.key}`}
          onClick={() => onAction?.(event, action.key)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

function getActionsForStatus(status) {
  if (status === "Draft") {
    return [{ key: "publish", label: "Publish", variant: "primary" }];
  }

  if (status === "Published") {
    return [
      { key: "openSelling", label: "Open selling", variant: "secondary" },
      { key: "cancel", label: "Cancel", variant: "danger" },
    ];
  }

  if (status === "Selling") {
    return [
      { key: "close", label: "Close", variant: "outline" },
      { key: "cancel", label: "Cancel", variant: "danger" },
    ];
  }

  return [];
}
