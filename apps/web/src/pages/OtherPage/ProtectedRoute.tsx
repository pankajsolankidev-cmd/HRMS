import { Navigate, Outlet } from "react-router";
import Cookies from "js-cookie";
export default function ProtectedRoute() {
  const token = Cookies.get("access");

  if (!token) {
    return <Navigate to="/signin" replace />;
  }
  return <Outlet />;
}
