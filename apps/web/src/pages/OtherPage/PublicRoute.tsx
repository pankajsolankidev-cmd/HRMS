import { Navigate, Outlet } from "react-router";
import Cookies from "js-cookie";

export default function PublicRoute() {
  const token = Cookies.get("access");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
