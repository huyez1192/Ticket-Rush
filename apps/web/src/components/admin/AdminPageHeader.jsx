import "./admin.css";

export default function AdminPageHeader({ kicker, title, subtitle, actions }) {
  return (
    <header className="admin-page-header">
      <div>
        {kicker ? <p className="admin-page-header__kicker">{kicker}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="admin-page-header__actions">{actions}</div> : null}
    </header>
  );
}
