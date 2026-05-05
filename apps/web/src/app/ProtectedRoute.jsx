import { Navigate, Outlet, useLocation } from "react-router-dom";
import LoadingState from "../components/common/LoadingState";
import { ROLES } from "../constants/roles";
import { useAuth } from "../features/auth/useAuth";

export default function ProtectedRoute({ requiredRole = ROLES.CUSTOMER, loginPath = "/login" }) {
  const location = useLocation();
  const { isAuthenticated, isLoading, roles } = useAuth();

  if (isLoading) {
    return <LoadingState title="Checking session" message="Confirming your access before opening this page." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (requiredRole && !roles.includes(requiredRole)) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
