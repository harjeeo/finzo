import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

export function RequireSuperAdmin() {
  const { user } = useAuth();

  if (!user?.isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
