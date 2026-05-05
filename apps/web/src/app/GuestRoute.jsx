import { Navigate, Outlet } from "react-router-dom";
import LoadingState from "../components/common/LoadingState";
import { useAuth } from "../features/auth/useAuth";

export default function GuestRoute({ admin = false }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState title="Checking session" message="Preparing the sign-in page." />;
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin/dashboard" : admin ? "/unauthorized" : "/events"} replace />;
  }

  return <Outlet />;
}
