import { NavLink, Outlet } from "react-router-dom";
import Button from "../components/common/Button";
import { useAuth } from "../features/auth/useAuth";
import "./layouts.css";

const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/events", label: "Events" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/roles", label: "Roles" },
  { to: "/admin/audit-logs", label: "Audit Logs" },
  { to: "/admin/tickets/verify", label: "Verify Ticket" },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span>Admin Portal</span>
          <strong>Ticket Rush</strong>
        </div>
        <nav className="admin-nav" aria-label="Admin navigation">
          {adminLinks.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <p className="phase-note">{user?.fullName || user?.username || user?.email}</p>
          <Button variant="outline" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
