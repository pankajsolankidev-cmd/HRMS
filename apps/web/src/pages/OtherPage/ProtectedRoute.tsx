import { Navigate, Outlet } from "react-router";

export default function ProtectedRoute() {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  // ✅ Token present → allow access
  return <Outlet />;
}
