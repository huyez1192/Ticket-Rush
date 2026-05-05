import { ROLES } from "../constants/roles";
import ProtectedRoute from "./ProtectedRoute";

export default function AdminRoute() {
  return <ProtectedRoute requiredRole={ROLES.ADMIN} loginPath="/admin/login" />;
}
