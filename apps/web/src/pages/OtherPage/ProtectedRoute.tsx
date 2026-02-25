import Cookies from "js-cookie";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import type { RootState } from "../../context";

type ProtectedRouteProps = {
  allowedRoles?: string[];
};

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const token = Cookies.get("access");
  const roles = useSelector((state: RootState) => state.auth.roles);

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  if (!allowedRoles) {
    return <Outlet />;
  }

  const hasAccess = roles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
