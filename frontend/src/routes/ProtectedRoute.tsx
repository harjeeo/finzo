import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

export function ProtectedRoute() {
  const { accessToken, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
