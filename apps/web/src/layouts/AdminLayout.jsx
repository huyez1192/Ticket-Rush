import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import ProfileAvatar from "../components/profile/ProfileAvatar";
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
  { to: "/admin/profile", label: "Profile" },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/admin/login", { replace: true });
  }

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
          <NavLink to="/admin/profile" className="profile-user-chip admin-profile-chip">
            <ProfileAvatar user={user} size="sm" />
            <span className="profile-user-chip__text">
              <span>{user?.fullName || user?.username || user?.email}</span>
              <small>{user?.email}</small>
            </span>
          </NavLink>
          <Button variant="outline" size="sm" onClick={handleLogout}>
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
