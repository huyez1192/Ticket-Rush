import Card from "../../components/common/Card";
import StatusBadge from "../../components/common/StatusBadge";

export default function AdminPageShell({ title, purpose, note, status = "Draft" }) {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-kicker">Admin foundation shell</p>
          <h1 className="page-title">{title}</h1>
        </div>
        <StatusBadge status={status} />
      </header>
      <Card>
        <h3>Purpose</h3>
        <p>{purpose}</p>
        <p className="phase-note">{note || "This admin page uses the Phase 8 layout and shared components. Data integration is deferred."}</p>
      </Card>
    </div>
  );
}
