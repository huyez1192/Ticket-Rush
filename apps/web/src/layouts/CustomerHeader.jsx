import { NavLink, useNavigate } from "react-router-dom";
import logoMark from "../assets/logo-mark.png";
import Button from "../components/common/Button";
import ProfileAvatar from "../components/profile/ProfileAvatar";
import { useAuth } from "../features/auth/useAuth";

export default function CustomerHeader() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="customer-header">
      <NavLink to="/events" className="brand-link">
        <span className="brand-lockup">
          <img className="brand-logo brand-logo-mark" src={logoMark} alt="" aria-hidden="true" />
          <span>Ticket Rush</span>
        </span>
      </NavLink>
      <nav className="customer-nav" aria-label="Customer navigation">
        <NavLink to="/events">Events</NavLink>
        {isAuthenticated ? <NavLink to="/my-tickets">My Tickets</NavLink> : null}
        {isAuthenticated ? <NavLink to="/profile">Profile</NavLink> : null}
      </nav>
      <div className="customer-actions">
        {isAuthenticated ? (
          <>
            <NavLink to="/profile" className="profile-user-chip">
              <ProfileAvatar user={user} size="sm" />
              <span className="profile-user-chip__text">
                <span>{user?.fullName || user?.username || user?.email}</span>
                <small>Profile</small>
              </span>
            </NavLink>
            <Button variant="outline" size="sm" onClick={handleLogout}>
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
