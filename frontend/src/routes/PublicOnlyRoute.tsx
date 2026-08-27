import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

export function PublicOnlyRoute() {
  const { accessToken, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
