import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { hasRole, type Role } from "../lib/permissions";

interface RequireRoleProps {
  roles: Role[];
}

export function RequireRole({ roles }: RequireRoleProps) {
  const { user } = useAuth();

  if (!hasRole(user?.role, roles)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
