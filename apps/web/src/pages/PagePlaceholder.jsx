import Card from "../components/common/Card";
import StatusBadge from "../components/common/StatusBadge";

export default function PagePlaceholder({ title, kicker = "Phase 8 shell", purpose, note, status }) {
  return (
    <div className="page-shell">
      <div className="page-stack">
        <header className="page-header">
          <div>
            <p className="page-kicker">{kicker}</p>
            <h1 className="page-title">{title}</h1>
          </div>
          {status ? <StatusBadge status={status} /> : null}
        </header>
        <Card>
          <h3>Purpose</h3>
          <p>{purpose}</p>
          <p className="phase-note">{note || "This route is wired with shared layout and components. Full API integration is deferred to later frontend phases."}</p>
        </Card>
      </div>
    </div>
  );
}
