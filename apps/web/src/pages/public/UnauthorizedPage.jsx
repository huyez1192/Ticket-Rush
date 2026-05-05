import { Link, useLocation } from "react-router-dom";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ErrorState from "../../components/common/ErrorState";
import { useAuth } from "../../features/auth/useAuth";

export default function UnauthorizedPage() {
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();
  const reason = location.state?.reason || "Your current account does not have permission to open this area.";

  return (
    <div className="page-shell">
      <Card>
        <div className="page-stack">
          <ErrorState title="Access denied" message={reason} />
          <div className="auth-state-actions">
            <Link to="/events">
              <Button variant="outline">Go to events</Button>
            </Link>
            {!isAuthenticated ? (
              <Link to="/login">
                <Button>Go to login</Button>
              </Link>
            ) : null}
            {!isAdmin ? (
              <Link to="/admin/login">
                <Button variant="secondary">Admin login</Button>
              </Link>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
