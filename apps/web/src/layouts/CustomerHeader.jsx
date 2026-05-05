import { NavLink } from "react-router-dom";
import Button from "../components/common/Button";
import { useAuth } from "../features/auth/useAuth";

export default function CustomerHeader() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="customer-header">
      <NavLink to="/events" className="brand-link">
        Ticket Rush
      </NavLink>
      <nav className="customer-nav" aria-label="Customer navigation">
        <NavLink to="/events">Events</NavLink>
        {isAuthenticated ? <NavLink to="/my-tickets">My Tickets</NavLink> : null}
      </nav>
      <div className="customer-actions">
        {isAuthenticated ? (
          <>
            <span className="phase-note">{user?.fullName || user?.username || user?.email}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <NavLink className="btn btn--ghost btn--sm" to="/login">
              Login
            </NavLink>
            <NavLink className="btn btn--primary btn--sm" to="/register">
              Register
            </NavLink>
          </>
        )}
      </div>
    </header>
  );
}
